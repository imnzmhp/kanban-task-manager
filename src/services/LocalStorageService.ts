/**
 * LocalStorageService - Data persistence service using Browser Local Storage
 * Requirements: 6.1, 6.2, 6.3, 6.4
 * 
 * This service provides abstraction for Local Storage operations with proper
 * error handling and data validation for the Kanban Task Manager.
 */

import { Task, StoredData } from '../types/Task';

/**
 * Custom error class for storage-related issues
 */
export class StorageError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * LocalStorageService class handles all Local Storage operations
 * with error handling and data validation.
 */
export class LocalStorageService {
  /**
   * Storage key for tasks data in Local Storage
   */
  private static readonly TASKS_KEY = 'kanban-tasks';
  
  /**
   * Current data schema version for migration support
   */
  private static readonly CURRENT_VERSION = '1.0.0';

  /**
   * Save tasks array to Local Storage
   * Requirements: 6.1, 6.3
   * 
   * @param tasks - Array of tasks to save
   * @throws {StorageError} When storage operation fails
   */
  static saveTasks(tasks: Task[]): void {
    try {
      // Validate input data
      if (!Array.isArray(tasks)) {
        throw new StorageError('Invalid tasks data: expected array');
      }

      // Validate each task structure
      for (const task of tasks) {
        LocalStorageService.validateTask(task);
      }

      // Create stored data structure with metadata
      const storedData: StoredData = {
        tasks,
        version: LocalStorageService.CURRENT_VERSION,
        lastSaved: new Date().toISOString()
      };

      // Serialize and store data
      const serializedData = JSON.stringify(storedData);
      
      // Check if Local Storage is available and has space
      if (!LocalStorageService.isStorageAvailable()) {
        throw new StorageError('Local Storage is not available');
      }

      localStorage.setItem(LocalStorageService.TASKS_KEY, serializedData);
      
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      
      // Handle quota exceeded errors
      if (error instanceof DOMException && error.code === 22) {
        throw new StorageError('Storage quota exceeded. Please free up space.', error);
      }
      
      // Handle other storage errors
      throw new StorageError('Failed to save tasks to Local Storage', error as Error);
    }
  }

  /**
   * Load tasks array from Local Storage
   * Requirements: 6.2, 6.4
   * 
   * @returns Array of tasks from storage, empty array if no data or error
   * @throws {StorageError} When storage operation fails critically
   */
  static loadTasks(): Task[] {
    try {
      // Check if Local Storage is available
      if (!LocalStorageService.isStorageAvailable()) {
        console.warn('Local Storage is not available, returning empty tasks array');
        return [];
      }

      // Get data from Local Storage
      const storedDataString = localStorage.getItem(LocalStorageService.TASKS_KEY);
      
      // Return empty array if no data exists
      if (!storedDataString) {
        return [];
      }

      // Parse stored data
      const storedData: StoredData = JSON.parse(storedDataString);
      
      // Validate stored data structure
      if (!LocalStorageService.validateStoredData(storedData)) {
        console.warn('Invalid stored data format, returning empty array');
        return [];
      }

      // Validate and convert tasks
      const tasks: Task[] = storedData.tasks.map(task => {
        // Convert date strings back to Date objects
        return {
          ...task,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt)
        };
      });

      // Validate each task
      for (const task of tasks) {
        LocalStorageService.validateTask(task);
      }

      return tasks;
      
    } catch (error) {
      // Log error but don't throw for data loading - graceful degradation
      console.error('Failed to load tasks from Local Storage:', error);
      
      // Try to clear corrupted data
      try {
        LocalStorageService.clearTasks();
        console.warn('Corrupted data cleared from Local Storage');
      } catch (clearError) {
        console.error('Failed to clear corrupted data:', clearError);
      }
      
      // Return empty array as fallback
      return [];
    }
  }

  /**
   * Clear all tasks data from Local Storage
   * Requirements: 6.1
   * 
   * @throws {StorageError} When storage operation fails
   */
  static clearTasks(): void {
    try {
      if (!LocalStorageService.isStorageAvailable()) {
        throw new StorageError('Local Storage is not available');
      }

      localStorage.removeItem(LocalStorageService.TASKS_KEY);
      
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      
      throw new StorageError('Failed to clear tasks from Local Storage', error as Error);
    }
  }

  /**
   * Check if Local Storage is available and functional
   * Requirements: 6.4
   * 
   * @returns true if Local Storage is available, false otherwise
   */
  static isStorageAvailable(): boolean {
    try {
      const testKey = '__localStorage_test__';
      const testValue = 'test';
      
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      return retrieved === testValue;
      
    } catch (error) {
      return false;
    }
  }

  /**
   * Get storage information for debugging/monitoring
   * Requirements: 6.4
   * 
   * @returns Storage information object
   */
  static getStorageInfo(): {
    isAvailable: boolean;
    hasData: boolean;
    dataSize: number;
    lastSaved: string | null;
    version: string | null;
  } {
    try {
      const isAvailable = LocalStorageService.isStorageAvailable();
      
      if (!isAvailable) {
        return {
          isAvailable: false,
          hasData: false,
          dataSize: 0,
          lastSaved: null,
          version: null
        };
      }

      const storedDataString = localStorage.getItem(LocalStorageService.TASKS_KEY);
      
      if (!storedDataString) {
        return {
          isAvailable: true,
          hasData: false,
          dataSize: 0,
          lastSaved: null,
          version: null
        };
      }

      try {
        const storedData: StoredData = JSON.parse(storedDataString);
        
        return {
          isAvailable: true,
          hasData: true,
          dataSize: storedDataString.length,
          lastSaved: storedData.lastSaved || null,
          version: storedData.version || null
        };
        
      } catch (parseError) {
        return {
          isAvailable: true,
          hasData: true,
          dataSize: storedDataString.length,
          lastSaved: null,
          version: null
        };
      }
      
    } catch (error) {
      return {
        isAvailable: false,
        hasData: false,
        dataSize: 0,
        lastSaved: null,
        version: null
      };
    }
  }

  /**
   * Private method to validate a single task object
   * Requirements: 6.2
   * 
   * @param task - Task object to validate
   * @throws {StorageError} When task validation fails
   */
  private static validateTask(task: any): void {
    if (!task || typeof task !== 'object') {
      throw new StorageError('Invalid task: must be an object');
    }

    // Check required properties
    const requiredProps = ['id', 'title', 'description', 'status', 'createdAt', 'updatedAt'];
    for (const prop of requiredProps) {
      if (!(prop in task)) {
        throw new StorageError(`Invalid task: missing required property '${prop}'`);
      }
    }

    // Validate property types and values
    if (typeof task.id !== 'string' || task.id.trim() === '') {
      throw new StorageError('Invalid task: id must be a non-empty string');
    }

    if (typeof task.title !== 'string' || task.title.trim() === '') {
      throw new StorageError('Invalid task: title must be a non-empty string');
    }

    if (task.title.length > 200) {
      throw new StorageError('Invalid task: title must be 200 characters or less');
    }

    if (typeof task.description !== 'string') {
      throw new StorageError('Invalid task: description must be a string');
    }

    if (task.description.length > 1000) {
      throw new StorageError('Invalid task: description must be 1000 characters or less');
    }

    // Validate status
    const validStatuses = ['TODO', 'DOING', 'DONE'];
    if (!validStatuses.includes(task.status)) {
      throw new StorageError(`Invalid task: status must be one of ${validStatuses.join(', ')}`);
    }

    // Validate dates (they might be strings from JSON)
    const createdAt = task.createdAt instanceof Date ? task.createdAt : new Date(task.createdAt);
    const updatedAt = task.updatedAt instanceof Date ? task.updatedAt : new Date(task.updatedAt);

    if (isNaN(createdAt.getTime())) {
      throw new StorageError('Invalid task: createdAt must be a valid date');
    }

    if (isNaN(updatedAt.getTime())) {
      throw new StorageError('Invalid task: updatedAt must be a valid date');
    }
  }

  /**
   * Private method to validate stored data structure
   * Requirements: 6.2
   * 
   * @param data - Stored data object to validate
   * @returns true if valid, false otherwise
   */
  private static validateStoredData(data: any): data is StoredData {
    try {
      if (!data || typeof data !== 'object') {
        return false;
      }

      // Check required properties
      if (!Array.isArray(data.tasks)) {
        return false;
      }

      if (typeof data.version !== 'string') {
        return false;
      }

      if (typeof data.lastSaved !== 'string') {
        return false;
      }

      // Validate lastSaved is a valid date string
      const lastSavedDate = new Date(data.lastSaved);
      if (isNaN(lastSavedDate.getTime())) {
        return false;
      }

      return true;
      
    } catch (error) {
      return false;
    }
  }
}