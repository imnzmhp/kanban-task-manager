/**
 * LocalStorageService - Data persistence service using Browser Local Storage
 * Enhanced with comprehensive error handling using SystemError framework
 * Requirements: 6.1, 6.2, 6.3, 6.4, 16.2
 * 
 * This service provides abstraction for Local Storage operations with proper
 * error handling and data validation for the Kanban Task Manager.
 */

import { Task, TaskV2, StoredData } from '../types/Task';
import { ErrorHandler } from './ErrorHandler';

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
   * Save tasks array to Local Storage with comprehensive error handling
   * Requirements: 6.1, 6.3, 16.2
   * 
   * @param tasks - Array of tasks to save
   * @throws {StorageError} When storage operation fails
   */
  static async saveTasks(tasks: (Task | TaskV2)[]): Promise<void> {
    try {
      // Validate input data
      if (!Array.isArray(tasks)) {
        await ErrorHandler.handleStorageError(
          'STORAGE_SERIALIZATION_FAILED',
          'Invalid tasks data: expected array',
          {
            operation: 'write',
            storageType: 'localStorage',
            dataSize: 0
          }
        );
        throw new StorageError('Invalid tasks data: expected array');
      }

      // Validate each task structure
      for (const task of tasks) {
        try {
          LocalStorageService.validateTask(task);
        } catch (validationError) {
          console.error('Task validation failed for task:', task);
          console.error('Validation error:', validationError);
          const validationMessage = validationError instanceof Error
            ? validationError.message
            : String(validationError);
          await ErrorHandler.handleStorageError(
            'STORAGE_SERIALIZATION_FAILED',
            `Task validation failed: ${validationMessage}`,
            {
              operation: 'write',
              storageType: 'localStorage',
              dataSize: JSON.stringify(task).length
            }
          );
          throw validationError;
        }
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
        await ErrorHandler.handleStorageError(
          'STORAGE_ACCESS_DENIED',
          'Local Storage is not available',
          {
            operation: 'write',
            storageType: 'localStorage',
            dataSize: serializedData.length
          },
          async () => {
            // Recovery action: try session storage fallback
            await ErrorHandler.RecoveryActions.fallbackStorage();
          }
        );
        throw new StorageError('Local Storage is not available');
      }

      // Check available quota before saving large data
      if (serializedData.length > 100000) { // 100KB threshold
        try {
          // Estimate quota usage
          if (navigator.storage && navigator.storage.estimate) {
            const estimate = await navigator.storage.estimate();
            if (estimate.quota && estimate.usage) {
              const remainingQuota = estimate.quota - estimate.usage;
              if (serializedData.length > remainingQuota) {
                await ErrorHandler.handleStorageError(
                  'STORAGE_QUOTA_EXCEEDED',
                  'Storage quota would be exceeded',
                  {
                    operation: 'write',
                    storageType: 'localStorage',
                    dataSize: serializedData.length,
                    availableQuota: remainingQuota
                  },
                  async () => {
                    // Recovery action: compress data by removing old backups
                    await ErrorHandler.RecoveryActions.handleStorageQuota();
                  }
                );
              }
            }
          }
        } catch (quotaError) {
          // Quota API not supported, continue with save attempt
          console.warn('Storage quota estimation not supported');
        }
      }

      try {
        localStorage.setItem(LocalStorageService.TASKS_KEY, serializedData);
      } catch (setItemError) {
        if (setItemError instanceof DOMException && setItemError.code === 22) {
          await ErrorHandler.handleStorageError(
            'STORAGE_QUOTA_EXCEEDED',
            'Storage quota exceeded during save',
            {
              operation: 'write',
              storageType: 'localStorage',
              dataSize: serializedData.length
            },
            async () => {
              // Recovery action: compress storage and retry
              await ErrorHandler.RecoveryActions.handleStorageQuota();
            }
          );
          throw new StorageError('Storage quota exceeded. Please free up space.', setItemError);
        }
        
        await ErrorHandler.handleStorageError(
          'STORAGE_SERIALIZATION_FAILED',
          'Failed to write to localStorage',
          {
            operation: 'write',
            storageType: 'localStorage',
            dataSize: serializedData.length
          }
        );
        throw setItemError;
      }
      
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      
      // Handle unexpected errors
      await ErrorHandler.handleStorageError(
        'STORAGE_SERIALIZATION_FAILED',
        'Unexpected error during save operation',
        {
          operation: 'write',
          storageType: 'localStorage',
          dataSize: 0
        }
      );
      
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
  static loadTasks(): (Task | TaskV2)[] {
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
      const tasks: (Task | TaskV2)[] = storedData.tasks.map(task => {
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
   * Generic method to get an item from Local Storage
   * 
   * @param key - Storage key
   * @returns Parsed data or null if not found
   */
  static async getItem<T>(key: string): Promise<T | null> {
    try {
      if (!LocalStorageService.isStorageAvailable()) {
        return null;
      }

      const storedDataString = localStorage.getItem(key);
      
      if (!storedDataString) {
        return null;
      }

      return JSON.parse(storedDataString) as T;
      
    } catch (error) {
      console.error(`Failed to get item from Local Storage (key: ${key}):`, error);
      return null;
    }
  }

  /**
   * Generic method to set an item in Local Storage
   * 
   * @param key - Storage key
   * @param data - Data to store
   */
  static async setItem<T>(key: string, data: T): Promise<void> {
    try {
      if (!LocalStorageService.isStorageAvailable()) {
        throw new StorageError('Local Storage is not available');
      }

      const serializedData = JSON.stringify(data);
      localStorage.setItem(key, serializedData);
      
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      
      if (error instanceof DOMException && error.code === 22) {
        throw new StorageError('Storage quota exceeded. Please free up space.', error);
      }
      
      throw new StorageError(`Failed to save data to Local Storage (key: ${key})`, error as Error);
    }
  }

  /**
   * Generic method to remove an item from Local Storage
   * 
   * @param key - Storage key
   */
  static async removeItem(key: string): Promise<void> {
    try {
      if (!LocalStorageService.isStorageAvailable()) {
        throw new StorageError('Local Storage is not available');
      }

      localStorage.removeItem(key);
      
    } catch (error) {
      throw new StorageError(`Failed to remove item from Local Storage (key: ${key})`, error as Error);
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

    // Check required properties (common to both Task and TaskV2)
    const commonProps = ['id', 'title', 'description', 'createdAt', 'updatedAt'];
    for (const prop of commonProps) {
      if (!(prop in task)) {
        throw new StorageError(`Invalid task: missing required property '${prop}'`);
      }
    }
    
    // Check that task has either status (Task) or statusId (TaskV2)
    if (!('status' in task) && !('statusId' in task)) {
      throw new StorageError('Invalid task: must have either status (Task) or statusId (TaskV2)');
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

    // Validate status (support both Task and TaskV2)
    if ('status' in task) {
      // Legacy Task format
      const validStatuses = ['TODO', 'DOING', 'DONE'];
      if (!validStatuses.includes(task.status)) {
        throw new StorageError(`Invalid task: status must be one of ${validStatuses.join(', ')}`);
      }
    } else if ('statusId' in task) {
      // V2 Task format
      if (typeof task.statusId !== 'string' || task.statusId.trim() === '') {
        throw new StorageError('Invalid task: statusId must be a non-empty string');
      }
    } else {
      throw new StorageError('Invalid task: must have either status or statusId');
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