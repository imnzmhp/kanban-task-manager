/**
 * TaskContext - Global state management for tasks using React Context API
 * Requirements: 1.1, 2.1, 4.1, 5.2
 */

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { Task, TaskState, TaskAction, TaskFormData, TaskStatus } from '../types/Task';
import { taskReducer, initialTaskState } from './TaskReducer';
import { TaskRepository } from '../services/TaskRepository';

/**
 * Context value interface providing state and convenient methods
 */
interface TaskContextValue {
  state: TaskState;
  dispatch: React.Dispatch<TaskAction>;
  
  // Convenient methods for common operations
  createTask: (taskData: TaskFormData) => Promise<void>;
  updateTask: (taskId: string, taskData: TaskFormData) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTask: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  loadTasks: () => Promise<void>;
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
 */
export const TaskProvider: React.FC<TaskProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialTaskState);

  /**
   * Load all tasks from storage
   */
  const loadTasks = useCallback(async () => {
    dispatch({ type: 'LOAD_TASKS_START' });
    
    try {
      const tasks = await TaskRepository.getAllTasks();
      dispatch({ type: 'LOAD_TASKS_SUCCESS', payload: tasks });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load tasks';
      dispatch({ type: 'LOAD_TASKS_ERROR', payload: errorMessage });
    }
  }, []);

  /**
   * Create a new task
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
   * Update an existing task
   */
  const updateTask = useCallback(async (taskId: string, taskData: TaskFormData) => {
    try {
      const updates: Partial<Task> = {
        title: taskData.title.trim(),
        description: taskData.description.trim(),
        updatedAt: new Date()
      };
      
      // Find the existing task to get the full object for saving
      const existingTask = state.tasks.find(task => task.id === taskId);
      if (!existingTask) {
        throw new Error('Task not found');
      }
      
      const updatedTask = { ...existingTask, ...updates };
      await TaskRepository.saveTask(updatedTask);
      
      dispatch({ type: 'UPDATE_TASK', payload: { id: taskId, updates } });
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
   * Move a task to a different status
   */
  const moveTask = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    try {
      // Find the existing task to get the full object for saving
      const existingTask = state.tasks.find(task => task.id === taskId);
      if (!existingTask) {
        throw new Error('Task not found');
      }
      
      const updatedTask = {
        ...existingTask,
        status: newStatus,
        updatedAt: new Date()
      };
      
      await TaskRepository.saveTask(updatedTask);
      dispatch({ type: 'MOVE_TASK', payload: { id: taskId, status: newStatus } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to move task';
      dispatch({ type: 'LOAD_TASKS_ERROR', payload: errorMessage });
      throw error;
    }
  }, [state.tasks]);

  const contextValue: TaskContextValue = {
    state,
    dispatch,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    loadTasks
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