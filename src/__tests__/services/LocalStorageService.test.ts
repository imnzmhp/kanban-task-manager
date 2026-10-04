/**
 * LocalStorageService Unit Tests
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import { LocalStorageService, StorageError } from '../../services/LocalStorageService';
import { Task, TaskStatus } from '../../types/Task';

describe('LocalStorageService', () => {
  const createValidTask = (): Task => ({
    id: '1',
    title: 'Test Task',
    description: 'Test Description',
    status: 'TODO' as TaskStatus,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  });

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('saveTasks', () => {
    it('should save valid tasks array to localStorage', () => {
      const tasks: Task[] = [createValidTask()];

      expect(() => {
        LocalStorageService.saveTasks(tasks);
      }).not.toThrow();

      // Verify data was saved
      const savedData = localStorage.getItem('kanban-tasks');
      expect(savedData).not.toBeNull();
      expect(savedData).toContain('Test Task');
    });

    it('should throw StorageError for invalid tasks data', () => {
      expect(() => {
        LocalStorageService.saveTasks('invalid' as any);
      }).toThrow(StorageError);
      expect(() => {
        LocalStorageService.saveTasks('invalid' as any);
      }).toThrow('Invalid tasks data: expected array');
    });

    it('should throw StorageError for tasks with missing required properties', () => {
      const invalidTask = {
        id: '1',
        title: 'Test Task',
        // missing other required properties
      };

      expect(() => {
        LocalStorageService.saveTasks([invalidTask] as any);
      }).toThrow(StorageError);
    });

    it('should throw StorageError for tasks with invalid title length', () => {
      const taskWithLongTitle: Task = {
        ...createValidTask(),
        title: 'A'.repeat(201), // Too long
      };

      expect(() => {
        LocalStorageService.saveTasks([taskWithLongTitle]);
      }).toThrow(StorageError);
      expect(() => {
        LocalStorageService.saveTasks([taskWithLongTitle]);
      }).toThrow('title must be 200 characters or less');
    });

    it('should throw StorageError for tasks with invalid description length', () => {
      const taskWithLongDescription: Task = {
        ...createValidTask(),
        description: 'A'.repeat(1001), // Too long
      };

      expect(() => {
        LocalStorageService.saveTasks([taskWithLongDescription]);
      }).toThrow(StorageError);
      expect(() => {
        LocalStorageService.saveTasks([taskWithLongDescription]);
      }).toThrow('description must be 1000 characters or less');
    });

    it('should include metadata in saved data', () => {
      const tasks: Task[] = [createValidTask()];
      
      LocalStorageService.saveTasks(tasks);
      
      const savedData = localStorage.getItem('kanban-tasks');
      const parsedData = JSON.parse(savedData!);
      
      expect(parsedData.version).toBe('1.0.0');
      expect(parsedData.lastSaved).toBeDefined();
      expect(parsedData.tasks).toHaveLength(1);
    });
  });

  describe('loadTasks', () => {
    it('should return empty array when no data exists', () => {
      const tasks = LocalStorageService.loadTasks();
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks).toHaveLength(0);
    });

    it('should load and parse valid tasks data', () => {
      const originalTasks: Task[] = [createValidTask()];

      // First save the tasks
      LocalStorageService.saveTasks(originalTasks);
      
      // Then load them back
      const loadedTasks = LocalStorageService.loadTasks();

      expect(loadedTasks).toHaveLength(1);
      expect(loadedTasks[0].id).toBe('1');
      expect(loadedTasks[0].title).toBe('Test Task');
      expect(loadedTasks[0].description).toBe('Test Description');
      expect(loadedTasks[0].status).toBe('TODO');
      expect(loadedTasks[0].createdAt).toBeInstanceOf(Date);
      expect(loadedTasks[0].updatedAt).toBeInstanceOf(Date);
    });

    it('should return empty array for corrupted data and clear it', () => {
      // Directly set corrupted data
      localStorage.setItem('kanban-tasks', 'invalid json');
      
      const tasks = LocalStorageService.loadTasks();
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks).toHaveLength(0);
      
      // Should have cleared the corrupted data
      expect(localStorage.getItem('kanban-tasks')).toBeNull();
    });

    it('should return empty array for invalid data structure', () => {
      // Set data with invalid structure
      localStorage.setItem('kanban-tasks', JSON.stringify({
        tasks: 'not an array',
        version: '1.0.0',
        lastSaved: new Date().toISOString(),
      }));
      
      const tasks = LocalStorageService.loadTasks();
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks).toHaveLength(0);
    });

    it('should convert date strings back to Date objects', () => {
      const originalTasks: Task[] = [createValidTask()];
      LocalStorageService.saveTasks(originalTasks);
      
      const loadedTasks = LocalStorageService.loadTasks();
      
      expect(loadedTasks[0].createdAt).toBeInstanceOf(Date);
      expect(loadedTasks[0].updatedAt).toBeInstanceOf(Date);
      expect(loadedTasks[0].createdAt.getTime()).toBe(originalTasks[0].createdAt.getTime());
    });
  });

  describe('clearTasks', () => {
    it('should remove tasks data from localStorage', () => {
      // First add some data
      localStorage.setItem('kanban-tasks', 'some data');
      expect(localStorage.getItem('kanban-tasks')).toBe('some data');
      
      LocalStorageService.clearTasks();
      
      expect(localStorage.getItem('kanban-tasks')).toBeNull();
    });
  });

  describe('isStorageAvailable', () => {
    it('should return true when localStorage is available', () => {
      const isAvailable = LocalStorageService.isStorageAvailable();
      expect(isAvailable).toBe(true);
    });
  });

  describe('getStorageInfo', () => {
    it('should return correct info when no data exists', () => {
      const info = LocalStorageService.getStorageInfo();
      
      expect(info.isAvailable).toBe(true);
      expect(info.hasData).toBe(false);
      expect(info.dataSize).toBe(0);
      expect(info.lastSaved).toBeNull();
      expect(info.version).toBeNull();
    });

    it('should return correct info when data exists', () => {
      const tasks: Task[] = [createValidTask()];

      LocalStorageService.saveTasks(tasks);
      const info = LocalStorageService.getStorageInfo();
      
      expect(info.isAvailable).toBe(true);
      expect(info.hasData).toBe(true);
      expect(info.dataSize).toBeGreaterThan(0);
      expect(info.lastSaved).not.toBeNull();
      expect(info.version).toBe('1.0.0');
    });
  });

  describe('StorageError', () => {
    it('should create StorageError with message and cause', () => {
      const cause = new Error('Original error');
      const storageError = new StorageError('Storage failed', cause);
      
      expect(storageError.name).toBe('StorageError');
      expect(storageError.message).toBe('Storage failed');
      expect(storageError.cause).toBe(cause);
    });

    it('should create StorageError with message only', () => {
      const storageError = new StorageError('Storage failed');
      
      expect(storageError.name).toBe('StorageError');
      expect(storageError.message).toBe('Storage failed');
      expect(storageError.cause).toBeUndefined();
    });
  });

  describe('Task validation', () => {
    it('should validate task status values', () => {
      const taskWithInvalidStatus = {
        ...createValidTask(),
        status: 'INVALID' as TaskStatus,
      };

      expect(() => {
        LocalStorageService.saveTasks([taskWithInvalidStatus]);
      }).toThrow(StorageError);
      expect(() => {
        LocalStorageService.saveTasks([taskWithInvalidStatus]);
      }).toThrow('status must be one of TODO, DOING, DONE');
    });

    it('should validate required fields are present', () => {
      const taskMissingId = {
        title: 'Test Task',
        description: 'Test Description', 
        status: 'TODO' as TaskStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() => {
        LocalStorageService.saveTasks([taskMissingId] as any);
      }).toThrow(StorageError);
      expect(() => {
        LocalStorageService.saveTasks([taskMissingId] as any);
      }).toThrow("missing required property 'id'");
    });

    it('should validate empty title', () => {
      const taskWithEmptyTitle = {
        ...createValidTask(),
        title: '',
      };

      expect(() => {
        LocalStorageService.saveTasks([taskWithEmptyTitle]);
      }).toThrow(StorageError);
      expect(() => {
        LocalStorageService.saveTasks([taskWithEmptyTitle]);
      }).toThrow('title must be a non-empty string');
    });

    it('should validate invalid dates', () => {
      const taskWithInvalidDate = {
        ...createValidTask(),
        createdAt: 'invalid-date' as any,
      };

      expect(() => {
        LocalStorageService.saveTasks([taskWithInvalidDate]);
      }).toThrow(StorageError);
      expect(() => {
        LocalStorageService.saveTasks([taskWithInvalidDate]);
      }).toThrow('createdAt must be a valid date');
    });
  });
});