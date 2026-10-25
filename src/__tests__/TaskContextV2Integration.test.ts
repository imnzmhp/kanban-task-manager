/**
 * TaskContextV2Integration - Integration tests for TaskContext CustomStatus extension
 * Requirements: 7.2, 7.3
 */

import { TaskV2Converter } from '../utils/TaskV2Converter';
import { Task, TaskV2, TaskStatus } from '../types/Task';
import { CustomStatus } from '../types/CustomStatus';

describe('TaskContextV2Integration', () => {
  describe('TaskV2Converter', () => {
    const mockCustomStatuses: CustomStatus[] = [
      {
        id: 'status-1',
        name: 'TODO',
        displayOrder: 0,
        createdAt: new Date()
      },
      {
        id: 'status-2', 
        name: 'DOING',
        displayOrder: 1,
        createdAt: new Date()
      },
      {
        id: 'status-3',
        name: 'DONE',
        displayOrder: 2,
        createdAt: new Date()
      }
    ];

    it('should convert TaskV2 to Task format', () => {
      const taskV2: TaskV2 = {
        id: 'task-1',
        title: 'Test Task',
        description: 'Test Description',
        statusId: 'status-1',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const statusMapping = { 'status-1': 'TODO' as TaskStatus };
      const task = TaskV2Converter.taskV2ToTask(taskV2, statusMapping);

      expect(task).toEqual({
        id: taskV2.id,
        title: taskV2.title,
        description: taskV2.description,
        status: 'TODO',
        createdAt: taskV2.createdAt,
        updatedAt: taskV2.updatedAt
      });
    });

    it('should convert Task to TaskV2 format', () => {
      const task: Task = {
        id: 'task-1',
        title: 'Test Task',
        description: 'Test Description',  
        status: 'TODO',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const statusIdMapping = { 'TODO': 'status-1' };
      const taskV2 = TaskV2Converter.taskToTaskV2(task, statusIdMapping);

      expect(taskV2).toEqual({
        id: task.id,
        title: task.title,
        description: task.description,
        statusId: 'status-1',
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      });
    });

    it('should create proper status mappings from CustomStatus array', () => {
      const mappings = TaskV2Converter.createStatusMappings(mockCustomStatuses);

      expect(mappings.statusIdToStatus).toEqual({
        'status-1': 'TODO',
        'status-2': 'DOING', 
        'status-3': 'DONE'
      });

      expect(mappings.statusToStatusId).toEqual({
        'TODO': 'status-1',
        'DOING': 'status-2',
        'DONE': 'status-3'
      });
    });

    it('should identify TaskV2 format correctly', () => {
      const task: Task = {
        id: 'task-1',
        title: 'Test',
        description: 'Test',
        status: 'TODO',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const taskV2: TaskV2 = {
        id: 'task-2',
        title: 'Test V2',
        description: 'Test V2',
        statusId: 'status-1',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(TaskV2Converter.isTaskV2(task)).toBe(false);
      expect(TaskV2Converter.isTaskV2(taskV2)).toBe(true);
    });

    it('should get effective status from both formats', () => {
      const task: Task = {
        id: 'task-1',
        title: 'Test',
        description: 'Test',
        status: 'DOING',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const taskV2: TaskV2 = {
        id: 'task-2',
        title: 'Test V2',
        description: 'Test V2',
        statusId: 'status-2',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(TaskV2Converter.getEffectiveStatus(task)).toBe('DOING');
      expect(TaskV2Converter.getEffectiveStatus(taskV2)).toBe('status-2');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle mixed Task and TaskV2 arrays', () => {
      const task: Task = {
        id: 'task-1',
        title: 'Legacy Task',
        description: 'Legacy',
        status: 'TODO',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const taskV2: TaskV2 = {
        id: 'task-2',
        title: 'V2 Task',
        description: 'V2',
        statusId: 'status-1',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mixedTasks = [task, taskV2];
      const statusMapping = { 'status-1': 'TODO' as TaskStatus };
      
      const convertedTasks = TaskV2Converter.mixedTasksToTasks(mixedTasks, statusMapping);
      
      expect(convertedTasks).toHaveLength(2);
      expect(convertedTasks[0]).toEqual(task); // Original Task unchanged
      expect(convertedTasks[1].status).toBe('TODO'); // TaskV2 converted
      expect(convertedTasks[1].id).toBe(taskV2.id);
    });
  });
});