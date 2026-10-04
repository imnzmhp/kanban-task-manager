/**
 * TaskRepository - High-level task operations API
 * Requirements: 1.1, 1.2, 4.1, 5.2, 6.1
 * 
 * This repository provides high-level APIs for task operations including
 * create, read, update, and delete functionality with proper error handling
 * and data validation.
 */

import { Task, TaskFormData, TaskStatus } from '../types/Task';
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
  static async getAllTasks(): Promise<Task[]> {
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
      return allTasks.filter(task => task.status === status);
      
    } catch (error) {
      throw new RepositoryError(`Failed to retrieve tasks with status ${status}`, error as Error);
    }
  }

  /**
   * Get a single task by ID
   * Requirements: 4.1
   * 
   * @param id - Task ID to find
   * @returns Promise<Task | null> Task if found, null if not found
   * @throws {RepositoryError} When data retrieval fails
   */
  static async getTaskById(id: string): Promise<Task | null> {
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

      // Save to storage
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
   * @returns Promise<Task> The updated task
   * @throws {RepositoryError} When task update fails
   */
  static async updateTask(taskId: string, taskData: TaskFormData): Promise<Task> {
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

      // Create updated task
      const existingTask = currentTasks[taskIndex];
      const updatedTask: Task = {
        ...existingTask,
        title: taskData.title.trim(),
        description: taskData.description.trim(),
        updatedAt: new Date()
      };

      // Update tasks array
      const updatedTasks = [...currentTasks];
      updatedTasks[taskIndex] = updatedTask;

      // Save to storage
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
      
      // Check if status actually changed
      if (existingTask.status === newStatus) {
        return existingTask; // No change needed
      }

      // Create updated task with new status
      const updatedTask: Task = {
        ...existingTask,
        status: newStatus,
        updatedAt: new Date()
      };

      // Update tasks array
      const updatedTasks = [...currentTasks];
      updatedTasks[taskIndex] = updatedTask;

      // Save to storage
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

      // Save to storage
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
        counts[task.status]++;
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
  static async saveTask(task: Task): Promise<void> {
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
      
      let updatedTasks: Task[];
      if (existingTaskIndex >= 0) {
        // Update existing task
        updatedTasks = [...currentTasks];
        updatedTasks[existingTaskIndex] = task;
      } else {
        // Add new task
        updatedTasks = [...currentTasks, task];
      }

      // Save to storage
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