/**
 * useTask Hook
 * Convenience wrapper for TaskContext with additional utility hooks
 */

import { useCallback } from 'react';
import { useTaskContext } from '../contexts/TaskContext';
import { TaskStatus } from '../types/Task';

// Main hook - re-export the context
export const useTask = useTaskContext;

// Task statistics interface
export interface TaskStats {
  total: number;
  byStatus: Record<string, number>;
  completed: number;
  pending: number;
}

// Task filters interface
export interface TaskFilters {
  status?: TaskStatus;
  search?: string;
}

// Return type for useTask hook
export interface UseTaskReturn extends ReturnType<typeof useTaskContext> {
  // Additional computed properties can be added here
}

/**
 * Hook for getting tasks by specific status
 */
export const useTasksByStatus = (status: TaskStatus) => {
  const { getTasksByStatus } = useTask();
  return getTasksByStatus(status);
};

/**
 * Hook for getting task statistics
 */
export const useTaskStats = (): TaskStats => {
  const { getTaskStats, tasks } = useTask();
  const stats = getTaskStats();
  
  return {
    ...stats,
    completed: tasks.filter(task => !('statusId' in task) && task.status === 'DONE').length,
    pending: tasks.filter(task => !('statusId' in task) && task.status !== 'DONE').length
  };
};

/**
 * Hook for task search functionality
 */
export const useTaskSearch = () => {
  const { tasks } = useTask();
  
  const searchTasks = useCallback((query: string) => {
    if (!query.trim()) return tasks;
    
    const lowercaseQuery = query.toLowerCase();
    return tasks.filter(task => 
      task.title.toLowerCase().includes(lowercaseQuery) ||
      task.description.toLowerCase().includes(lowercaseQuery)
    );
  }, [tasks]);
  
  return { searchTasks };
};

/**
 * Hook for task form validation and handling
 */
export const useTaskForm = () => {
  const { createTask, updateTask } = useTask();
  
  const validateTaskForm = useCallback((data: { title: string; description: string }) => {
    const errors: string[] = [];
    
    if (!data.title.trim()) {
      errors.push('Title is required');
    } else if (data.title.trim().length > 100) {
      errors.push('Title must be 100 characters or less');
    }
    
    if (data.description.trim().length > 500) {
      errors.push('Description must be 500 characters or less');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);
  
  return {
    validateTaskForm,
    createTask,
    updateTask
  };
};
