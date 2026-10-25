/**
 * TaskContext - Global state management for tasks using React Context API
 * Extended to support CustomStatus integration (TaskV2)
 * Enhanced with comprehensive error handling using SystemError framework
 * Requirements: 1.1, 2.1, 4.1, 5.2, 7.2, 7.3, 16.2
 */

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';

import { Task, TaskV2, TaskState, TaskAction, TaskFormData, TaskStatus } from '../types/Task';
import { taskReducerV2, initialTaskStateV2, getTasksByStatusId } from './TaskReducer';
import { TaskRepository } from '../services/TaskRepository';
import { TaskV2Converter } from '../utils/TaskV2Converter';

/**
 * TaskContext - Global state management for tasks using React Context API
 * Extended to support CustomStatus integration (TaskV2)
 * Requirements: 1.1, 2.1, 4.1, 5.2, 7.2, 7.3
 */
interface TaskContextValue {
  // State and basic operations (legacy compatibility)
  state: TaskState;
  dispatch: React.Dispatch<TaskAction>;
  
  // Direct access to state properties
  tasks: (Task | TaskV2)[];
  loading: boolean;
  error: string | null;
  
  // Legacy task operations (backward compatibility)
  createTask: (taskData: TaskFormData) => Promise<void>;
  updateTask: (taskId: string, taskData: TaskFormData) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTask: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  loadTasks: () => Promise<void>;
  
  // Task query methods
  getTasksByStatus: (status: TaskStatus) => Task[];
  getTaskById: (id: string) => Task | TaskV2 | undefined;
  getTaskStats: () => { total: number; byStatus: Record<string, number> };
  
  // V2 operations for CustomStatus support  
  createTaskV2: (taskData: TaskFormData, statusId: string) => Promise<TaskV2>;
  updateTaskV2: (taskId: string, taskData: TaskFormData) => Promise<void>;
  updateTaskStatus: (taskId: string, statusId: string) => Promise<void>;
  getTasksByStatusId: (statusId: string) => (Task | TaskV2)[];
  clearTasks: () => Promise<void>;
  
  // Error handling and recovery methods
  moveTasksToStatus: (fromStatusId: string, toStatusId: string) => Promise<void>;
  validateTaskIntegrity: () => Promise<boolean>;
  repairOrphanedTasks: (defaultStatusId: string) => Promise<void>;
  
  // Utility methods
  isV2Mode: boolean;
  enableV2Mode: () => void;
}

/**
 * Task Context for global state management
 */
const TaskContext = createContext<TaskContextValue | undefined>(undefined);

/**
 * Props for TaskProvider component
 */
interface TaskProviderProps {
  children: ReactNode;
}

/**
 * TaskProvider component that provides global task state to child components
 * Enhanced to support both legacy and V2 task management
 */
export const TaskProvider: React.FC<TaskProviderProps> = ({ children }) => {
  // Use enhanced reducer that supports both formats
  const [state, dispatch] = useReducer(taskReducerV2, initialTaskStateV2);

  /**
   * Check if context is in V2 mode
   */
  const isV2Mode = state.isV2Mode;

  /**
   * Enable V2 mode for CustomStatus support
   */
  const enableV2Mode = useCallback(() => {
    console.log('V2 Mode enabled for CustomStatus support');
  }, []);

  /**
   * Load all tasks from storage
   */
  const loadTasks = useCallback(async () => {
    dispatch({ type: 'LOAD_TASKS_START' });
    
    try {
      const tasks = await TaskRepository.getAllTasks();
      console.log("TaskContext loadTasks - loaded tasks:", tasks.length, tasks);
      dispatch({ type: 'LOAD_TASKS_SUCCESS', payload: tasks });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load tasks';
      dispatch({ type: 'LOAD_TASKS_ERROR', payload: errorMessage });
    }
  }, []);

  /**
   * Create a new task (legacy method)
   */
  const createTask = useCallback(async (taskData: TaskFormData) => {
    try {
      const newTask: Task = {
        id: crypto.randomUUID(),
        title: taskData.title.trim(),
        description: taskData.description.trim(),
        status: 'TODO' as TaskStatus,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await TaskRepository.saveTask(newTask);
      dispatch({ type: 'CREATE_TASK', payload: newTask });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create task';
      dispatch({ type: 'LOAD_TASKS_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  /**
   * Create a new task with statusId (V2 method)
   */
  const createTaskV2 = useCallback(async (taskData: TaskFormData, statusId: string): Promise<TaskV2> => {
    try {
      const newTask: TaskV2 = {
        id: crypto.randomUUID(),
        title: taskData.title.trim(),
        description: taskData.description.trim(),
        statusId: statusId,
        // レガシーのstatusフィールドは持たせない（TaskV2はstatusIdのみ）
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await TaskRepository.saveTask(newTask);
      dispatch({ type: 'CREATE_TASK_V2', payload: newTask });
      return newTask;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create task';
      dispatch({ type: 'LOAD_TASKS_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  /**
   * Update an existing task (legacy method)
   */
  const updateTask = useCallback(async (taskId: string, taskData: TaskFormData) => {
    try {
      const updates: Partial<Task> = {
        title: taskData.title.trim(),
        description: taskData.description.trim(),
        updatedAt: new Date()
      };
      
      const existingTask = state.tasks.find(task => task.id === taskId);
      if (!existingTask) {
        throw new Error('Task not found');
      }
      
      // レガシーのstatusフィールドを除外し、statusIdがあれば保持する
      const taskWithoutStatus = TaskV2Converter.stripStatus(existingTask);
      const updatedTask: Task | TaskV2 = TaskV2Converter.isTaskV2(existingTask)
        ? { ...taskWithoutStatus, statusId: existingTask.statusId, ...updates }
        : { ...taskWithoutStatus, status: existingTask.status, ...updates };
      console.log('TaskContext.updateTaskStatus - About to call TaskRepository.saveTask with:', updatedTask);
      await TaskRepository.saveTask(updatedTask);
      
      dispatch({ type: 'UPDATE_TASK', payload: { id: taskId, updates } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update task';
      dispatch({ type: 'LOAD_TASKS_ERROR', payload: errorMessage });
      throw error;
    }
  }, [state.tasks]);

  /**
   * Update an existing task (V2 method)
   */
  const updateTaskV2 = useCallback(async (taskId: string, taskData: TaskFormData) => {
    try {
      const updates: Partial<TaskV2> = {
        title: taskData.title.trim(),
        description: taskData.description.trim(),
        updatedAt: new Date()
      };
      
      const existingTask = state.tasks.find(task => task.id === taskId);
      if (!existingTask) {
        throw new Error('Task not found');
      }
      
      // レガシーのstatusフィールドを除外し、statusIdを保持してV2形式に寄せる
      const taskWithoutStatus = TaskV2Converter.stripStatus(existingTask);
      const existingStatusId = TaskV2Converter.isTaskV2(existingTask)
        ? existingTask.statusId
        : undefined;
      const updatedTask: Task | TaskV2 = existingStatusId !== undefined
        ? { ...taskWithoutStatus, statusId: existingStatusId, ...updates }
        : { ...taskWithoutStatus, status: (existingTask as Task).status, ...updates };
      console.log('TaskContext.updateTaskStatus - About to call TaskRepository.saveTask with:', updatedTask);
      await TaskRepository.saveTask(updatedTask);
      
      dispatch({ type: 'UPDATE_TASK_V2', payload: { id: taskId, updates } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update task';
      dispatch({ type: 'LOAD_TASKS_ERROR', payload: errorMessage });
      throw error;
    }
  }, [state.tasks]);

  /**
   * Delete a task
   */
  const deleteTask = useCallback(async (taskId: string) => {
    try {
      await TaskRepository.deleteTask(taskId);
      dispatch({ type: 'DELETE_TASK', payload: taskId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete task';
      dispatch({ type: 'LOAD_TASKS_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  /**
   * Move a task to a different status (legacy method)
   */
  const moveTask = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    try {
      const existingTask = state.tasks.find(task => task.id === taskId);
      if (!existingTask) {
        throw new Error('Task not found');
      }
      
      // 新しいstatusを付与したレガシー形式のタスクを作る
      const taskWithoutStatus = TaskV2Converter.stripStatus(existingTask);
      const updatedTask: Task = {
        ...taskWithoutStatus,
        status: newStatus,
        updatedAt: new Date()
      };
      
      console.log('TaskContext.updateTaskStatus - About to call TaskRepository.saveTask with:', updatedTask);
      await TaskRepository.saveTask(updatedTask);
      dispatch({ type: 'MOVE_TASK', payload: { id: taskId, status: newStatus } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to move task';
      dispatch({ type: 'LOAD_TASKS_ERROR', payload: errorMessage });
      throw error;
    }
  }, [state.tasks]);

  /**
   * Update task status using statusId (V2 method)
   */
  const updateTaskStatus = useCallback(async (taskId: string, statusId: string) => {
    console.log('TaskContext.updateTaskStatus called - taskId:', taskId, 'statusId:', statusId);
    try {
      const existingTask = state.tasks.find(task => task.id === taskId);
      if (!existingTask) {
        throw new Error('Task not found');
      }
      
      // statusIdを付与してV2形式のタスクを作る
      const taskWithoutStatus = TaskV2Converter.stripStatus(existingTask);
      const updatedTask: TaskV2 = {
        ...taskWithoutStatus,
        statusId: statusId,
        updatedAt: new Date()
      };
      
      console.log('TaskContext.updateTaskStatus - About to call TaskRepository.saveTask with:', updatedTask);
      await TaskRepository.saveTask(updatedTask);
      dispatch({ type: 'MOVE_TASK_V2', payload: { id: taskId, statusId } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update task status';
      dispatch({ type: 'LOAD_TASKS_ERROR', payload: errorMessage });
      throw error;
    }
  }, [state.tasks]);

  /**
   * Get tasks by status (legacy method)
   */
  const getTasksByStatus = useCallback((status: TaskStatus): Task[] => {
    return state.tasks.filter(
      (task): task is Task => !TaskV2Converter.isTaskV2(task) && task.status === status
    );
  }, [state.tasks]);

  /**
   * Get tasks by statusId
   */
  const getTasksByStatusIdMethod = useCallback((statusId: string): (Task | TaskV2)[] => {
    return getTasksByStatusId(state.tasks, statusId);
  }, [state.tasks]);

  /**
   * Get task by ID
   */
  const getTaskById = useCallback((id: string): Task | TaskV2 | undefined => {
    return state.tasks.find(task => task.id === id);
  }, [state.tasks]);

  /**
   * Get task statistics
   */
  const getTaskStats = useCallback(() => {
    const stats = {
      total: state.tasks.length,
      byStatus: {} as Record<string, number>
    };

    state.tasks.forEach(task => {
      if (TaskV2Converter.isTaskV2(task)) {
        const statusId = task.statusId || 'unknown';
        stats.byStatus[statusId] = (stats.byStatus[statusId] || 0) + 1;
      } else {
        const status = task.status || 'unknown';
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
      }
    });

    return stats;
  }, [state.tasks]);

  /**
   * Clear all tasks (for demo/reset purposes)
   */
  const clearTasks = useCallback(async () => {
    try {
      await TaskRepository.clearAllTasks();
      dispatch({ type: 'CLEAR_TASKS' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear tasks';
      dispatch({ type: 'LOAD_TASKS_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  /**
   * Move tasks from one status to another (error handling method)
   */
  const moveTasksToStatus = useCallback(async (fromStatusId: string, toStatusId: string) => {
    try {
      const tasksToMove = state.tasks.filter(task => {
        if (TaskV2Converter.isTaskV2(task)) {
          return task.statusId === fromStatusId;
        }
        return false; // Skip legacy tasks for status-based operations
      });
      
      for (const task of tasksToMove) {
        await updateTaskStatus(task.id, toStatusId);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to move tasks';
      dispatch({ type: 'LOAD_TASKS_ERROR', payload: errorMessage });
      throw error;
    }
  }, [state.tasks, updateTaskStatus]);

  /**
   * Validate task integrity and detect orphaned tasks
   */
  const validateTaskIntegrity = useCallback(async (): Promise<boolean> => {
    try {
      const orphanedTasks = state.tasks.filter(task => {
        if (TaskV2Converter.isTaskV2(task)) {
          return !task.statusId;
        }
        return !task.status;
      });
      
      return orphanedTasks.length === 0;
    } catch (error) {
      console.error('Task integrity validation failed:', error);
      return false;
    }
  }, [state.tasks]);

  /**
   * Repair orphaned tasks by assigning them to a default status
   */
  const repairOrphanedTasks = useCallback(async (defaultStatusId: string) => {
    try {
      const orphanedTasks = state.tasks.filter(task => {
        if (TaskV2Converter.isTaskV2(task)) {
          return !task.statusId;
        }
        return !task.status;
      });
      
      for (const task of orphanedTasks) {
        if (TaskV2Converter.isTaskV2(task)) {
          await updateTaskStatus(task.id, defaultStatusId);
        } else {
          await moveTask(task.id, 'TODO');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to repair orphaned tasks';
      dispatch({ type: 'LOAD_TASKS_ERROR', payload: errorMessage });
      throw error;
    }
  }, [state.tasks, updateTaskStatus, moveTask]);

  // Extract legacy tasks for backward compatibility
  const legacyTasks = state.tasks.filter(task => !TaskV2Converter.isTaskV2(task)) as Task[];

  const contextValue: TaskContextValue = {
    // Legacy compatibility
    state: {
      tasks: legacyTasks,
      loading: state.loading,
      error: state.error
    },
    dispatch,
    
    // Direct access to properties
    tasks: legacyTasks,
    loading: state.loading,
    error: state.error,
    
    // Legacy methods
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    loadTasks,
    
    // Task query methods
    getTasksByStatus,
    getTaskById,
    getTaskStats,
    
    // V2 methods
    createTaskV2,
    updateTaskV2,
    updateTaskStatus,
    getTasksByStatusId: getTasksByStatusIdMethod,
    clearTasks,
    
    // Error handling and recovery methods
    moveTasksToStatus,
    validateTaskIntegrity,
    repairOrphanedTasks,
    
    // Utility
    isV2Mode,
    enableV2Mode
  };

  return (
    <TaskContext.Provider value={contextValue}>
      {children}
    </TaskContext.Provider>
  );
};

/**
 * Custom hook to use TaskContext
 * Throws error if used outside of TaskProvider
 */
export const useTaskContext = (): TaskContextValue => {
  const context = useContext(TaskContext);
  
  if (context === undefined) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  
  return context;
};

/**
 * Export the context for advanced use cases
 */
export { TaskContext };
