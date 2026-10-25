/**
 * TaskRepository - High-level task operations API
 * Requirements: 1.1, 1.2, 4.1, 5.2, 6.1
 * 
 * This repository provides high-level APIs for task operations including
 * create, read, update, and delete functionality with proper error handling
 * and data validation.
 */

import { Task, TaskV2, TaskFormData, TaskStatus } from '../types/Task';
import { TaskV2Converter } from '../utils/TaskV2Converter';
import { LocalStorageService } from './LocalStorageService';

/**
 * Custom error class for repository-level operations
 */
export class RepositoryError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'RepositoryError';
  }
}

/**
 * TaskRepository class handles high-level task operations
 * Built on top of LocalStorageService for data persistence
 */
export class TaskRepository {
  /**
   * Get all tasks from storage
   * Requirements: 6.1, 6.2
   * 
   * @returns Promise<Task[]> Array of all tasks
   * @throws {RepositoryError} When data retrieval fails
   */
  static async getAllTasks(): Promise<(Task | TaskV2)[]> {
    try {
      const tasks = LocalStorageService.loadTasks();
      
      // Sort tasks by creation date (newest first) for consistent ordering
      return tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
    } catch (error) {
      throw new RepositoryError('Failed to retrieve tasks', error as Error);
    }
  }

  /**
   * Get tasks by status
   * Requirements: 2.1, 3.2
   * 
   * @param status - Task status to filter by
   * @returns Promise<Task[]> Array of tasks with specified status
   * @throws {RepositoryError} When data retrieval fails
   */
  static async getTasksByStatus(status: TaskStatus): Promise<Task[]> {
    try {
      const allTasks = await TaskRepository.getAllTasks();
      return allTasks.filter(
        (task): task is Task => !('statusId' in task) && task.status === status
      );
      
    } catch (error) {
      throw new RepositoryError(`Failed to retrieve tasks with status ${status}`, error as Error);
    }
  }

  /**
   * Get a single task by ID
   * Requirements: 4.1
   * 
   * @param id - Task ID to find
   * @returns Promise<Task | TaskV2 | null> Task if found, null if not found
   * @throws {RepositoryError} When data retrieval fails
   */
  static async getTaskById(id: string): Promise<Task | TaskV2 | null> {
    try {
      if (!id || typeof id !== 'string') {
        throw new RepositoryError('Invalid task ID: must be a non-empty string');
      }

      const allTasks = await TaskRepository.getAllTasks();
      const task = allTasks.find(task => task.id === id);
      
      return task || null;
      
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw error;
      }
      throw new RepositoryError(`Failed to retrieve task with ID ${id}`, error as Error);
    }
  }

  /**
   * Create a new task
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
   * 
   * @param taskData - Task form data
   * @returns Promise<Task> The created task
   * @throws {RepositoryError} When task creation fails
   */
  static async createTask(taskData: TaskFormData): Promise<Task> {
    try {
      // Validate input data
      TaskRepository.validateTaskFormData(taskData);

      // Generate new task ID (simple UUID alternative)
      const taskId = TaskRepository.generateTaskId();
      
      const now = new Date();
      
      // Create new task with default status 'TODO'
      const newTask: Task = {
        id: taskId,
        title: taskData.title.trim(),
        description: taskData.description.trim(),
        status: 'TODO', // Default status for new tasks (Requirement 1.4)
        createdAt: now,
        updatedAt: now
      };

      // Get current tasks and add the new one
      const currentTasks = await TaskRepository.getAllTasks();
      const updatedTasks = [...currentTasks, newTask];

      // Debug: Log what we're about to save
      console.log('TaskRepository.deleteTask - Remaining tasks:', updatedTasks.length, updatedTasks);

      
      // Save to storage
      console.log('TaskRepository.saveTask - About to save tasks:', updatedTasks);
      console.log('TaskRepository.saveTask - Individual task analysis:');
      updatedTasks.forEach((task, i) => {
        console.log(`Task ${i}:`, task);
        console.log(`Task ${i} - Has status: ${'status' in task}`);
        console.log(`Task ${i} - Has statusId: ${'statusId' in task}`);
        console.log(`Task ${i} - Type check: ${typeof task}`);
      });
      
      LocalStorageService.saveTasks(updatedTasks);
      
      return newTask;
      
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw error;
      }
      throw new RepositoryError('Failed to create task', error as Error);
    }
  }

  /**
   * Update an existing task
   * Requirements: 4.1, 4.2, 4.3, 4.4
   * 
   * @param taskId - ID of task to update
   * @param taskData - Updated task form data
   * @returns Promise<Task | TaskV2> The updated task
   * @throws {RepositoryError} When task update fails
   */
  static async updateTask(taskId: string, taskData: TaskFormData): Promise<Task | TaskV2> {
    try {
      // Validate inputs
      if (!taskId || typeof taskId !== 'string') {
        throw new RepositoryError('Invalid task ID: must be a non-empty string');
      }

      TaskRepository.validateTaskFormData(taskData);

      // Get current tasks
      const currentTasks = await TaskRepository.getAllTasks();
      
      // Find task to update
      const taskIndex = currentTasks.findIndex(task => task.id === taskId);
      if (taskIndex === -1) {
        throw new RepositoryError(`タスクが見つかりません: ${taskId}`);
      }

      // Create updated task（既存の識別子 status/statusId はそのまま保持する）
      const existingTask = currentTasks[taskIndex];
      const updatedTask: Task | TaskV2 = {
        ...existingTask,
        title: taskData.title.trim(),
        description: taskData.description.trim(),
        updatedAt: new Date()
      };

      // Update tasks array
      const updatedTasks = [...currentTasks];
      updatedTasks[taskIndex] = updatedTask;

      // Debug: Log what we're about to save
      console.log('TaskRepository.deleteTask - Remaining tasks:', updatedTasks.length, updatedTasks);

      
      // Save to storage
      console.log('TaskRepository.saveTask - About to save tasks:', updatedTasks);
      console.log('TaskRepository.saveTask - Individual task analysis:');
      updatedTasks.forEach((task, i) => {
        console.log(`Task ${i}:`, task);
        console.log(`Task ${i} - Has status: ${'status' in task}`);
        console.log(`Task ${i} - Has statusId: ${'statusId' in task}`);
        console.log(`Task ${i} - Type check: ${typeof task}`);
      });
      
      LocalStorageService.saveTasks(updatedTasks);
      
      return updatedTask;
      
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw error;
      }
      throw new RepositoryError('Failed to update task', error as Error);
    }
  }

  /**
   * Move a task to a different status
   * Requirements: 2.1, 2.2, 2.3, 2.4
   * 
   * @param taskId - ID of task to move
   * @param newStatus - New status for the task
   * @returns Promise<Task> The updated task
   * @throws {RepositoryError} When task move fails
   */
  static async moveTask(taskId: string, newStatus: TaskStatus): Promise<Task> {
    try {
      // Validate inputs
      if (!taskId || typeof taskId !== 'string') {
        throw new RepositoryError('Invalid task ID: must be a non-empty string');
      }

      const validStatuses: TaskStatus[] = ['TODO', 'DOING', 'DONE'];
      if (!validStatuses.includes(newStatus)) {
        throw new RepositoryError(`無効なステータスです: ${validStatuses.join(', ')}のいずれかを指定してください`);
      }

      // Get current tasks
      const currentTasks = await TaskRepository.getAllTasks();
      
      // Find task to move
      const taskIndex = currentTasks.findIndex(task => task.id === taskId);
      if (taskIndex === -1) {
        throw new RepositoryError(`Task not found with ID: ${taskId}`);
      }

      const existingTask = currentTasks[taskIndex];
      
      // Check if status actually changed（レガシー形式のみstatusを持つ）
      if (!('statusId' in existingTask) && existingTask.status === newStatus) {
        return existingTask; // No change needed
      }

      // Create updated task with new status（共通部分のみ引き継ぎstatusを上書き）
      const updatedTask: Task = {
        ...TaskV2Converter.stripStatus(existingTask),
        status: newStatus,
        updatedAt: new Date()
      };

      // Update tasks array
      const updatedTasks = [...currentTasks];
      updatedTasks[taskIndex] = updatedTask;

      // Debug: Log what we're about to save
      console.log('TaskRepository.deleteTask - Remaining tasks:', updatedTasks.length, updatedTasks);

      
      // Save to storage
      console.log('TaskRepository.saveTask - About to save tasks:', updatedTasks);
      console.log('TaskRepository.saveTask - Individual task analysis:');
      updatedTasks.forEach((task, i) => {
        console.log(`Task ${i}:`, task);
        console.log(`Task ${i} - Has status: ${'status' in task}`);
        console.log(`Task ${i} - Has statusId: ${'statusId' in task}`);
        console.log(`Task ${i} - Type check: ${typeof task}`);
      });
      
      LocalStorageService.saveTasks(updatedTasks);
      
      return updatedTask;
      
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw error;
      }
      throw new RepositoryError('Failed to move task', error as Error);
    }
  }

  /**
   * Delete a task
   * Requirements: 5.1, 5.2, 5.3, 5.4
   * 
   * @param taskId - ID of task to delete
   * @returns Promise<boolean> True if task was deleted, false if not found
   * @throws {RepositoryError} When task deletion fails
   */
  static async deleteTask(taskId: string): Promise<boolean> {
    try {
      // Validate input
      if (!taskId || typeof taskId !== 'string') {
        throw new RepositoryError('Invalid task ID: must be a non-empty string');
      }

      // Get current tasks
      const currentTasks = await TaskRepository.getAllTasks();
      
      // Find task to delete
      const taskIndex = currentTasks.findIndex(task => task.id === taskId);
      if (taskIndex === -1) {
        throw new RepositoryError(`タスクが見つかりません: ${taskId}`);
      }

      // Remove task from array
      const updatedTasks = currentTasks.filter(task => task.id !== taskId);

      // Debug: Log what we're about to save
      console.log('TaskRepository.deleteTask - Remaining tasks:', updatedTasks.length, updatedTasks);

      
      // Save to storage
      console.log('TaskRepository.saveTask - About to save tasks:', updatedTasks);
      console.log('TaskRepository.saveTask - Individual task analysis:');
      updatedTasks.forEach((task, i) => {
        console.log(`Task ${i}:`, task);
        console.log(`Task ${i} - Has status: ${'status' in task}`);
        console.log(`Task ${i} - Has statusId: ${'statusId' in task}`);
        console.log(`Task ${i} - Type check: ${typeof task}`);
      });
      
      LocalStorageService.saveTasks(updatedTasks);
      
      return true;
      
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw error;
      }
      throw new RepositoryError('Failed to delete task', error as Error);
    }
  }

  /**
   * Get count of tasks by status
   * Requirements: 3.1, 3.5
   * 
   * @returns Promise<Record<TaskStatus, number>> Count of tasks per status
   * @throws {RepositoryError} When data retrieval fails
   */
  static async getTaskCountsByStatus(): Promise<Record<TaskStatus, number>> {
    try {
      const allTasks = await TaskRepository.getAllTasks();
      
      const counts: Record<TaskStatus, number> = {
        TODO: 0,
        DOING: 0,
        DONE: 0
      };

      for (const task of allTasks) {
        // レガシー形式(status)のタスクのみカウント対象
        if (!('statusId' in task)) {
          counts[task.status]++;
        }
      }

      return counts;
      
    } catch (error) {
      throw new RepositoryError('Failed to get task counts by status', error as Error);
    }
  }

  /**
   * Check if storage is available and healthy
   * Requirements: 6.4
   * 
   * @returns boolean True if storage is available and healthy
   */
  static isStorageAvailable(): boolean {
    try {
      return LocalStorageService.isStorageAvailable();
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if storage is available and healthy
   * Requirements: 6.4
   * 
   * @returns Promise<boolean> True if storage is available and healthy
   */
  static async isStorageHealthy(): Promise<boolean> {
    try {
      const storageInfo = LocalStorageService.getStorageInfo();
      return storageInfo.isAvailable;
      
    } catch (error) {
      return false;
    }
  }

  /**
   * Save a task (create or update)
   * This is a unified method for both creating new tasks and updating existing ones
   * Requirements: 1.1, 4.1, 6.3
   * 
   * @param task - Complete task object to save
   * @returns Promise<void>
   * @throws {RepositoryError} When task save fails
   */
  static async saveTask(task: Task | TaskV2): Promise<void> {
    try {
      // Validate task object
      if (!task || typeof task !== 'object') {
        throw new RepositoryError('Invalid task: must be a task object');
      }

      if (!task.id || typeof task.id !== 'string') {
        throw new RepositoryError('Invalid task ID: must be a non-empty string');
      }

      // Get current tasks
      const currentTasks = await TaskRepository.getAllTasks();
      
      // Check if task exists
      const existingTaskIndex = currentTasks.findIndex(t => t.id === task.id);
      
      let updatedTasks: (Task | TaskV2)[];
      if (existingTaskIndex >= 0) {
        // Update existing task - convert TaskV2 to Task format for storage
        updatedTasks = [...currentTasks];
        if ('statusId' in task) {
          // Check if this is a known legacy status that can be converted
          const knownStatusIds = ['migrated-todo', 'default-todo', 'migrated-doing', 'default-doing', 'migrated-done', 'default-done'];
          const knownStatusNames = ['TODO', 'To Do', 'DOING', 'Doing', 'DONE', 'Done'];
          
          if (knownStatusIds.includes(task.statusId) || knownStatusNames.includes(task.statusId)) {
            // Convert legacy-compatible V2 task to Task format
            const statusIdMapping: Record<string, TaskStatus> = {
              'migrated-todo': 'TODO', 'default-todo': 'TODO',
              'migrated-doing': 'DOING', 'default-doing': 'DOING', 
              'migrated-done': 'DONE', 'default-done': 'DONE'
            };
            
            const statusByName: Record<string, TaskStatus> = {
              'TODO': 'TODO', 'To Do': 'TODO',
              'DOING': 'DOING', 'Doing': 'DOING',
              'DONE': 'DONE', 'Done': 'DONE'
            };
            
            const mappedStatus = statusIdMapping[task.statusId] || statusByName[task.statusId] || 'TODO';
            const statusMapping = { [task.statusId]: mappedStatus };
            updatedTasks[existingTaskIndex] = TaskV2Converter.taskV2ToTask(task, statusMapping);
          } else {
            // Keep custom status tasks in V2 format to preserve statusId
            updatedTasks[existingTaskIndex] = task as TaskV2;
          }
        } else {
          updatedTasks[existingTaskIndex] = task;
        }
      } else {
        // Add new task - convert TaskV2 to Task format for storage
        if ('statusId' in task) {
          // Check if this is a known legacy status that can be converted
          const knownStatusIds = ['migrated-todo', 'default-todo', 'migrated-doing', 'default-doing', 'migrated-done', 'default-done'];
          const knownStatusNames = ['TODO', 'To Do', 'DOING', 'Doing', 'DONE', 'Done'];
          
          if (knownStatusIds.includes(task.statusId) || knownStatusNames.includes(task.statusId)) {
            // Convert legacy-compatible V2 task to Task format
            const statusIdMapping: Record<string, TaskStatus> = {
              'migrated-todo': 'TODO', 'default-todo': 'TODO',
              'migrated-doing': 'DOING', 'default-doing': 'DOING', 
              'migrated-done': 'DONE', 'default-done': 'DONE'
            };
            
            const statusByName: Record<string, TaskStatus> = {
              'TODO': 'TODO', 'To Do': 'TODO',
              'DOING': 'DOING', 'Doing': 'DOING',
              'DONE': 'DONE', 'Done': 'DONE'
            };
            
            const mappedStatus = statusIdMapping[task.statusId] || statusByName[task.statusId] || 'TODO';
            const statusMapping = { [task.statusId]: mappedStatus };
            updatedTasks = [...currentTasks, TaskV2Converter.taskV2ToTask(task, statusMapping)];
          } else {
            // Keep custom status tasks in V2 format to preserve statusId  
            updatedTasks = [...currentTasks, task as TaskV2];
          }
        } else {
          updatedTasks = [...currentTasks, task];
        }
      }

      // Debug: Log what we're about to save
      console.log('TaskRepository.deleteTask - Remaining tasks:', updatedTasks.length, updatedTasks);

      
      // Save to storage
      console.log('TaskRepository.saveTask - About to save tasks:', updatedTasks);
      console.log('TaskRepository.saveTask - Individual task analysis:');
      updatedTasks.forEach((task, i) => {
        console.log(`Task ${i}:`, task);
        console.log(`Task ${i} - Has status: ${'status' in task}`);
        console.log(`Task ${i} - Has statusId: ${'statusId' in task}`);
        console.log(`Task ${i} - Type check: ${typeof task}`);
      });
      
      LocalStorageService.saveTasks(updatedTasks);
      
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw error;
      }
      throw new RepositoryError('Failed to save task', error as Error);
    }
  }

  /**
   * Get repository statistics for monitoring/debugging
   * Requirements: 6.4
   * 
   * @returns Promise<object> Repository statistics
   */
  static async getRepositoryStats(): Promise<{
    totalTasks: number;
    tasksByStatus: Record<TaskStatus, number>;
    storageInfo: ReturnType<typeof LocalStorageService.getStorageInfo>;
  }> {
    try {
      const allTasks = await TaskRepository.getAllTasks();
      const tasksByStatus = await TaskRepository.getTaskCountsByStatus();
      const storageInfo = LocalStorageService.getStorageInfo();

      return {
        totalTasks: allTasks.length,
        tasksByStatus,
        storageInfo
      };
      
    } catch (error) {
      throw new RepositoryError('Failed to get repository statistics', error as Error);
    }
  }

  /**
   * Clear all tasks (for demo/reset purposes)
   * 
   * @returns Promise<void>
   * @throws {RepositoryError} When task clearing fails
   */
  static async clearAllTasks(): Promise<void> {
    try {
      // Save empty array to storage
      LocalStorageService.saveTasks([]);
      
    } catch (error) {
      throw new RepositoryError('Failed to clear all tasks', error as Error);
    }
  }

  /**
   * Private method to validate task form data
   * Requirements: 1.1, 1.2, 4.1
   * 
   * @param taskData - Task form data to validate
   * @throws {RepositoryError} When validation fails
   */
  private static validateTaskFormData(taskData: TaskFormData): void {
    if (!taskData || typeof taskData !== 'object') {
      throw new RepositoryError('Invalid task data: must be an object');
    }

    // Validate title
    if (typeof taskData.title !== 'string') {
      throw new RepositoryError('Invalid title: must be a string');
    }

    const trimmedTitle = taskData.title.trim();
    if (trimmedTitle === '') {
      throw new RepositoryError('タイトルを入力してください');
    }

    if (trimmedTitle.length > 200) {
      throw new RepositoryError('タイトルは200文字以内で入力してください');
    }

    // Validate description
    if (typeof taskData.description !== 'string') {
      throw new RepositoryError('Invalid description: must be a string');
    }

    if (taskData.description.length > 1000) {
      throw new RepositoryError('説明は1000文字以内で入力してください');
    }
  }

  /**
   * Private method to generate a simple task ID
   * In a real application, you might use a proper UUID library
   * Requirements: 1.1
   * 
   * @returns string Unique task identifier
   */
  private static generateTaskId(): string {
    // Simple ID generation using timestamp and random number
    // In production, consider using a proper UUID library like 'uuid'
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `task_${timestamp}_${randomPart}`;
  }
}
/**
 * Extended LocalStorage Service for Custom Status Management
 * カスタム状態管理のためのローカルストレージサービス拡張
 * 
 * Requirements: 10.1, 10.2
 */

import { CustomStatus, SerializedStatusConfig } from '../types/CustomStatus';
import { StatusSerializer } from './StatusSerializer';

/**
 * LocalStorageService拡張 - カスタム状態の永続化
 */
export class StatusRepository {
  /** カスタム状態設定のキー */
  private static readonly STATUS_CONFIG_KEY = 'kanban-custom-statuses';
  
  /** バックアップキーのプレフィックス */
  private static readonly BACKUP_KEY_PREFIX = 'kanban-status-backup';

  /**
   * カスタム状態設定をローカルストレージに保存
   * 
   * @param statuses 保存する状態リスト
   */
  static async saveStatusConfig(statuses: CustomStatus[]): Promise<void> {
    try {
      const serialized = StatusSerializer.serialize(statuses);
      
      if (!serialized.success || !serialized.data) {
        throw new Error(`Failed to serialize statuses: ${serialized.error}`);
      }

      localStorage.setItem(this.STATUS_CONFIG_KEY, serialized.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to save status config: ${errorMessage}`);
    }
  }

  /**
   * ローカルストレージからカスタム状態設定を読み込み
   * 
   * @returns 読み込まれた状態設定
   */
  static async loadStatusConfig(): Promise<SerializedStatusConfig> {
    try {
      const data = localStorage.getItem(this.STATUS_CONFIG_KEY);
      
      if (!data) {
        // データが存在しない場合はデフォルト設定を返す
        return StatusSerializer.getDefaultConfig();
      }

      const deserialized = StatusSerializer.deserialize(data);
      
      if (!deserialized.success || !deserialized.data) {
        console.warn('Failed to deserialize status config, using default:', deserialized.error);
        return StatusSerializer.getDefaultConfig();
      }

      return deserialized.data;
    } catch (error) {
      console.warn('Error loading status config, using default:', error);
      return StatusSerializer.getDefaultConfig();
    }
  }

  /**
   * 設定のバックアップを作成
   * 
   * @param statuses バックアップする状態リスト
   * @returns バックアップキー
   */
  static async createBackup(statuses: CustomStatus[]): Promise<string> {
    try {
      const backupKey = `${this.BACKUP_KEY_PREFIX}-${Date.now()}`;
      const serialized = StatusSerializer.serialize(statuses);
      
      if (!serialized.success || !serialized.data) {
        throw new Error(`Failed to serialize backup: ${serialized.error}`);
      }

      localStorage.setItem(backupKey, serialized.data);
      return backupKey;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create backup: ${errorMessage}`);
    }
  }

  /**
   * バックアップから設定を復元
   * 
   * @param backupKey バックアップキー
   * @returns 復元された状態設定
   */
  static async restoreFromBackup(backupKey: string): Promise<SerializedStatusConfig> {
    try {
      const data = localStorage.getItem(backupKey);
      
      if (!data) {
        throw new Error(`Backup not found: ${backupKey}`);
      }

      const deserialized = StatusSerializer.deserialize(data);
      
      if (!deserialized.success || !deserialized.data) {
        throw new Error(`Failed to restore backup: ${deserialized.error}`);
      }

      return deserialized.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to restore from backup: ${errorMessage}`);
    }
  }

  /**
   * 古いバックアップを削除
   * 
   * @param maxAge 最大保持期間（ミリ秒）
   */
  static async cleanupOldBackups(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
    try {
      const currentTime = Date.now();
      let deletedCount = 0;
      
      // ローカルストレージのすべてのキーをチェック
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        
        if (key && key.startsWith(this.BACKUP_KEY_PREFIX)) {
          // タイムスタンプを抽出
          const timestampMatch = key.match(/-(\d+)$/);
          if (timestampMatch) {
            const timestamp = parseInt(timestampMatch[1]);
            if (currentTime - timestamp > maxAge) {
              localStorage.removeItem(key);
              deletedCount++;
            }
          }
        }
      }
      
      return deletedCount;
    } catch (error) {
      console.warn('Error cleaning up old backups:', error);
      return 0;
    }
  }

  /**
   * 全バックアップのリストを取得
   * 
   * @returns バックアップ情報のリスト
   */
  static async listBackups(): Promise<Array<{ key: string; timestamp: number; age: string }>> {
    try {
      const backups: Array<{ key: string; timestamp: number; age: string }> = [];
      const currentTime = Date.now();
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        if (key && key.startsWith(this.BACKUP_KEY_PREFIX)) {
          const timestampMatch = key.match(/-(\d+)$/);
          if (timestampMatch) {
            const timestamp = parseInt(timestampMatch[1]);
            const age = this.formatAge(currentTime - timestamp);
            
            backups.push({ key, timestamp, age });
          }
        }
      }
      
      // 新しい順にソート
      return backups.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.warn('Error listing backups:', error);
      return [];
    }
  }

  /**
   * ストレージ使用量情報を取得
   */
  static getStorageInfo(): {
    statusConfigSize: number;
    backupCount: number;
    totalBackupSize: number;
    estimatedTotal: number;
  } {
    try {
      let statusConfigSize = 0;
      let backupCount = 0;
      let totalBackupSize = 0;

      // ステータス設定のサイズ
      const statusConfig = localStorage.getItem(this.STATUS_CONFIG_KEY);
      if (statusConfig) {
        statusConfigSize = new Blob([statusConfig]).size;
      }

      // バックアップのサイズ
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        if (key && key.startsWith(this.BACKUP_KEY_PREFIX)) {
          const data = localStorage.getItem(key);
          if (data) {
            backupCount++;
            totalBackupSize += new Blob([data]).size;
          }
        }
      }

      return {
        statusConfigSize,
        backupCount,
        totalBackupSize,
        estimatedTotal: statusConfigSize + totalBackupSize
      };
    } catch (error) {
      console.warn('Error getting storage info:', error);
      return {
        statusConfigSize: 0,
        backupCount: 0,
        totalBackupSize: 0,
        estimatedTotal: 0
      };
    }
  }

  /**
   * 年齢を人間が読みやすい形式にフォーマット
   */
  private static formatAge(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}日前`;
    } else if (hours > 0) {
      return `${hours}時間前`;
    } else if (minutes > 0) {
      return `${minutes}分前`;
    } else {
      return `${seconds}秒前`;
    }
  }
}
