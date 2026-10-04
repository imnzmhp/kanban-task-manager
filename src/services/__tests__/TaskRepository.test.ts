/**
 * Unit tests for TaskRepository
 * Testing high-level task operations and data validation
 */

import { TaskRepository } from '../TaskRepository';
import { LocalStorageService } from '../LocalStorageService';
import { Task, TaskFormData } from '../../types';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock LocalStorageService
jest.mock('../LocalStorageService');
const MockedLocalStorageService = LocalStorageService as jest.Mocked<typeof LocalStorageService>;

describe('TaskRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getAllTasks', () => {
    it('should return tasks from LocalStorageService', async () => {
      const mockTasks: Task[] = [
        {
          id: '1',
          title: 'Test Task',
          description: 'Test Description',
          status: 'TODO',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      MockedLocalStorageService.loadTasks.mockReturnValue(mockTasks);

      const result = await TaskRepository.getAllTasks();

      expect(result).toEqual(mockTasks);
      expect(MockedLocalStorageService.loadTasks).toHaveBeenCalledTimes(1);
    });
  });

  describe('createTask', () => {
    it('should create a new task with TODO status', async () => {
      const taskData: TaskFormData = {
        title: 'New Task',
        description: 'New Description',
      };

      MockedLocalStorageService.loadTasks.mockReturnValue([]);
      MockedLocalStorageService.saveTasks.mockImplementation(() => {});

      const result = await TaskRepository.createTask(taskData);

      expect(result).toMatchObject({
        title: 'New Task',
        description: 'New Description',
        status: 'TODO',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });
      expect(result.id).toBeDefined();
      expect(MockedLocalStorageService.saveTasks).toHaveBeenCalledWith([result]);
    });

    it('should validate title is required', async () => {
      const taskData: TaskFormData = {
        title: '',
        description: 'Test',
      };

      await expect(TaskRepository.createTask(taskData)).rejects.toThrow('タイトルを入力してください');
    });

    it('should validate title length limit', async () => {
      const taskData: TaskFormData = {
        title: 'a'.repeat(201),
        description: 'Test',
      };

      await expect(TaskRepository.createTask(taskData)).rejects.toThrow('タイトルは200文字以内で入力してください');
    });

    it('should validate description length limit', async () => {
      const taskData: TaskFormData = {
        title: 'Valid Title',
        description: 'a'.repeat(1001),
      };

      await expect(TaskRepository.createTask(taskData)).rejects.toThrow('説明は1000文字以内で入力してください');
    });
  });

  describe('updateTask', () => {
    it('should update existing task', async () => {
      const existingTask: Task = {
        id: '1',
        title: 'Old Title',
        description: 'Old Description',
        status: 'TODO',
        createdAt: new Date('2023-12-01T00:00:00.000Z'),
        updatedAt: new Date('2023-12-01T00:00:00.000Z'),
      };

      const updateData: TaskFormData = {
        title: 'New Title',
        description: 'New Description',
      };

      MockedLocalStorageService.loadTasks.mockReturnValue([existingTask]);
      MockedLocalStorageService.saveTasks.mockImplementation(() => {});

      const result = await TaskRepository.updateTask('1', updateData);

      expect(result).toMatchObject({
        id: '1',
        title: 'New Title',
        description: 'New Description',
        status: 'TODO', // Status should remain unchanged
        createdAt: new Date('2023-12-01T00:00:00.000Z'), // Should remain unchanged
        updatedAt: new Date('2024-01-01T00:00:00.000Z'), // Should be updated
      });
    });

    it('should throw error for non-existent task', async () => {
      MockedLocalStorageService.loadTasks.mockReturnValue([]);

      const updateData: TaskFormData = {
        title: 'New Title',
        description: 'New Description',
      };

      await expect(TaskRepository.updateTask('nonexistent', updateData)).rejects.toThrow('タスクが見つかりません');
    });
  });

  describe('deleteTask', () => {
    it('should delete existing task', async () => {
      const existingTask: Task = {
        id: '1',
        title: 'Task to Delete',
        description: 'Description',
        status: 'TODO',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      MockedLocalStorageService.loadTasks.mockReturnValue([existingTask]);
      MockedLocalStorageService.saveTasks.mockImplementation(() => {});

      await TaskRepository.deleteTask('1');

      expect(MockedLocalStorageService.saveTasks).toHaveBeenCalledWith([]);
    });

    it('should throw error for non-existent task', async () => {
      MockedLocalStorageService.loadTasks.mockReturnValue([]);

      await expect(TaskRepository.deleteTask('nonexistent')).rejects.toThrow('タスクが見つかりません');
    });
  });

  describe('moveTask', () => {
    it('should update task status', async () => {
      const existingTask: Task = {
        id: '1',
        title: 'Task to Move',
        description: 'Description',
        status: 'TODO',
        createdAt: new Date('2023-12-01T00:00:00.000Z'),
        updatedAt: new Date('2023-12-01T00:00:00.000Z'),
      };

      MockedLocalStorageService.loadTasks.mockReturnValue([existingTask]);
      MockedLocalStorageService.saveTasks.mockImplementation(() => {});

      const result = await TaskRepository.moveTask('1', 'DOING');

      expect(result).toMatchObject({
        id: '1',
        status: 'DOING',
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });
    });

    it('should validate status value', async () => {
      const existingTask: Task = {
        id: '1',
        title: 'Task',
        description: 'Description',
        status: 'TODO',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      MockedLocalStorageService.loadTasks.mockReturnValue([existingTask]);

      // @ts-expect-error Testing invalid status
      await expect(TaskRepository.moveTask('1', 'INVALID')).rejects.toThrow('無効なステータスです');
    });
  });

  describe('getTasksByStatus', () => {
    it('should return tasks filtered by status', async () => {
      const tasks: Task[] = [
        {
          id: '1',
          title: 'TODO Task',
          description: 'Description',
          status: 'TODO',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          title: 'DOING Task',
          description: 'Description',
          status: 'DOING',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      MockedLocalStorageService.loadTasks.mockReturnValue(tasks);

      const result = await TaskRepository.getTasksByStatus('TODO');

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('TODO');
    });
  });

  describe('isStorageAvailable', () => {
    it('should return storage availability status', () => {
      MockedLocalStorageService.isStorageAvailable.mockReturnValue(true);

      const result = TaskRepository.isStorageAvailable();

      expect(result).toBe(true);
      expect(MockedLocalStorageService.isStorageAvailable).toHaveBeenCalledTimes(1);
    });
  });
});