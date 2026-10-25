/**
 * TaskV2Converter - Utility for converting between Task and TaskV2 formats
 * Handles backward compatibility and migration between formats
 * Requirements: 7.2, 7.3
 */

import { Task, TaskV2, TaskStatus } from '../types/Task';
import { CustomStatus } from '../types/CustomStatus';

/**
 * Converter class for handling Task ↔ TaskV2 format conversions
 */
export class TaskV2Converter {
  /**
   * Convert TaskV2 to Task format for storage compatibility
   * Uses a statusId to status mapping
   */
  static taskV2ToTask(taskV2: TaskV2, statusMapping: Record<string, TaskStatus>): Task {
    // Default to TODO if statusId not found in mapping
    const status = statusMapping[taskV2.statusId] || 'TODO';
    
    return {
      id: taskV2.id,
      title: taskV2.title,
      description: taskV2.description,
      status: status,
      createdAt: taskV2.createdAt,
      updatedAt: taskV2.updatedAt
    };
  }

  /**
   * Convert Task to TaskV2 format using status to statusId mapping
   */
  static taskToTaskV2(task: Task, statusIdMapping: Record<TaskStatus, string>): TaskV2 {
    // Get the statusId for this status, or use a default
    const statusId = statusIdMapping[task.status] || statusIdMapping['TODO'] || 'default-todo-id';
    
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      statusId: statusId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    };
  }

  /**
   * Convert a mixed array of Task/TaskV2 objects to Task array for storage
   */
  static mixedTasksToTasks(
    tasks: (Task | TaskV2)[], 
    statusMapping: Record<string, TaskStatus>
  ): Task[] {
    return tasks.map(task => {
      if ('statusId' in task) {
        // This is a TaskV2, convert to Task
        return this.taskV2ToTask(task, statusMapping);
      }
      // This is already a Task
      return task;
    });
  }

  /**
   * Create status mappings from CustomStatus array
   */
  static createStatusMappings(customStatuses: CustomStatus[]): {
    statusIdToStatus: Record<string, TaskStatus>;
    statusToStatusId: Record<TaskStatus, string>;
  } {
    const statusIdToStatus: Record<string, TaskStatus> = {};
    const statusToStatusId: Partial<Record<TaskStatus, string>> = {};
    
    // Create default mappings for known legacy statuses
    const legacyStatusNames: Record<string, TaskStatus> = {
      'TODO': 'TODO',
      'DOING': 'DOING',
      'DONE': 'DONE'
    };

    customStatuses.forEach(status => {
      const legacyStatus = legacyStatusNames[status.name];
      if (legacyStatus) {
        statusIdToStatus[status.id] = legacyStatus;
        statusToStatusId[legacyStatus] = status.id;
      }
    });

    // Ensure we have all legacy statuses mapped
    if (!statusToStatusId['TODO']) {
      statusToStatusId['TODO'] = customStatuses[0]?.id || 'default-todo-id';
    }
    if (!statusToStatusId['DOING']) {
      statusToStatusId['DOING'] = customStatuses[1]?.id || customStatuses[0]?.id || 'default-doing-id';
    }
    if (!statusToStatusId['DONE']) {
      statusToStatusId['DONE'] = customStatuses[2]?.id || customStatuses[0]?.id || 'default-done-id';
    }

    return { statusIdToStatus, statusToStatusId: statusToStatusId as Record<TaskStatus, string> };
  }

  /**
   * Check if a task object is in V2 format
   */
  static isTaskV2(task: Task | TaskV2): task is TaskV2 {
    return 'statusId' in task;
  }

  /**
   * Get the effective status (either status or statusId) from a task
   */
  static getEffectiveStatus(task: Task | TaskV2): string {
    return this.isTaskV2(task) ? task.statusId : task.status;
  }

  /**
   * レガシーのstatusフィールドを取り除いた共通部分を返す
   * Task/TaskV2のどちらでも安全に扱えるよう、ユニオンから共通プロパティのみ抽出する
   */
  static stripStatus(task: Task | TaskV2): Omit<Task, 'status'> {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    };
  }
}