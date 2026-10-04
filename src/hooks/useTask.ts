/**
 * useTask - Custom hook providing convenient interface to TaskContext
 * Requirements: 1.1, 2.1, 4.1, 5.2
 */

import { useMemo } from 'react';
import { useTaskContext } from '../contexts';
import { Task, TaskStatus, TaskFormData } from '../types/Task';

/**
 * Task statistics interface
 */
export interface TaskStats {
  total: number;
  todo: number;
  doing: number;
  done: number;
}

/**
 * Task filtering options
 */
export interface TaskFilters {
  status?: TaskStatus;
  search?: string;
}

/**
 * useTask hook return interface
 */
export interface UseTaskReturn {
  // Core state
  tasks: Task[];
  loading: boolean;
  error: string | null;
  
  // Grouped tasks by status
  tasksByStatus: Record<TaskStatus, Task[]>;
  
  // Task operations
  createTask: (taskData: TaskFormData) => Promise<void>;
  updateTask: (taskId: string, taskData: TaskFormData) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTask: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  loadTasks: () => Promise<void>;
  
  // Convenience methods
  getTaskById: (taskId: string) => Task | undefined;
  getTasksByStatus: (status: TaskStatus) => Task[];
  filterTasks: (filters: TaskFilters) => Task[];
  getTaskStats: () => TaskStats;
  hasAnyTasks: () => boolean;
  getMostRecentTask: () => Task | undefined;
  
  // Validation utilities
  validateTaskForm: (taskData: TaskFormData) => { isValid: boolean; errors: Record<string, string[]> };
}

/**
 * Custom hook that provides a convenient interface to the TaskContext
 * with additional utility methods for task operations and filtering
 */
export const useTask = (): UseTaskReturn => {
  const { state, createTask, updateTask, deleteTask, moveTask, loadTasks } = useTaskContext();
  const { tasks, loading, error } = state;

  /**
   * Get task by ID
   */
  const getTaskById = (taskId: string): Task | undefined => {
    return tasks.find(task => task.id === taskId);
  };

  /**
   * Get tasks by status
   */
  const getTasksByStatus = (status: TaskStatus): Task[] => {
    return tasks.filter(task => task.status === status);
  };

  /**
   * Memoized tasks grouped by status
   */
  const tasksByStatus = useMemo((): Record<TaskStatus, Task[]> => {
    return {
      TODO: getTasksByStatus('TODO'),
      DOING: getTasksByStatus('DOING'),
      DONE: getTasksByStatus('DONE')
    };
  }, [tasks]);

  /**
   * Filter tasks based on provided criteria
   */
  const filterTasks = (filters: TaskFilters): Task[] => {
    let filteredTasks = [...tasks];

    // Filter by status
    if (filters.status) {
      filteredTasks = filteredTasks.filter(task => task.status === filters.status);
    }

    // Filter by search term (searches in title and description)
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.trim().toLowerCase();
      filteredTasks = filteredTasks.filter(task =>
        task.title.toLowerCase().includes(searchTerm) ||
        task.description.toLowerCase().includes(searchTerm)
      );
    }

    return filteredTasks;
  };

  /**
   * Get task statistics
   */
  const getTaskStats = (): TaskStats => {
    return tasks.reduce(
      (stats, task) => {
        stats.total++;
        switch (task.status) {
          case 'TODO':
            stats.todo++;
            break;
          case 'DOING':
            stats.doing++;
            break;
          case 'DONE':
            stats.done++;
            break;
        }
        return stats;
      },
      { total: 0, todo: 0, doing: 0, done: 0 }
    );
  };

  /**
   * Check if there are any tasks in the system
   */
  const hasAnyTasks = (): boolean => {
    return tasks.length > 0;
  };

  /**
   * Get the most recently updated task
   */
  const getMostRecentTask = (): Task | undefined => {
    if (tasks.length === 0) return undefined;
    
    return tasks.reduce((mostRecent, task) => {
      return new Date(task.updatedAt) > new Date(mostRecent.updatedAt) 
        ? task 
        : mostRecent;
    });
  };

  /**
   * Validate task form data
   */
  const validateTaskForm = (taskData: TaskFormData): { isValid: boolean; errors: Record<string, string[]> } => {
    const errors: Record<string, string[]> = {};
    
    // Validate title
    const trimmedTitle = taskData.title.trim();
    if (!trimmedTitle) {
      errors.title = ['タイトルは必須です'];
    } else if (trimmedTitle.length > 200) {
      errors.title = ['タイトルは200文字以内で入力してください'];
    }
    
    // Validate description
    if (taskData.description.length > 1000) {
      errors.description = ['説明は1000文字以内で入力してください'];
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  // Enhanced task operations with validation
  const createTaskWithValidation = async (taskData: TaskFormData): Promise<void> => {
    const validation = validateTaskForm(taskData);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0][0];
      throw new Error(firstError);
    }
    return createTask(taskData);
  };

  const updateTaskWithValidation = async (taskId: string, taskData: TaskFormData): Promise<void> => {
    const validation = validateTaskForm(taskData);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0][0];
      throw new Error(firstError);
    }
    return updateTask(taskId, taskData);
  };

  return {
    // Core state
    tasks,
    loading,
    error,
    
    // Grouped tasks by status
    tasksByStatus,
    
    // Task operations with validation
    createTask: createTaskWithValidation,
    updateTask: updateTaskWithValidation,
    deleteTask,
    moveTask,
    loadTasks,
    
    // Convenience methods
    getTaskById,
    getTasksByStatus,
    filterTasks,
    getTaskStats,
    hasAnyTasks,
    getMostRecentTask,
    validateTaskForm,
  };
};

/**
 * Hook for getting tasks by specific status with memoization
 */
export const useTasksByStatus = (status: TaskStatus): Task[] => {
  const { getTasksByStatus } = useTask();
  
  return useMemo(() => getTasksByStatus(status), [getTasksByStatus, status]);
};

/**
 * Hook for getting task statistics with memoization
 */
export const useTaskStats = (): TaskStats => {
  const { getTaskStats } = useTask();
  
  return useMemo(() => getTaskStats(), [getTaskStats]);
};

/**
 * Hook for searching tasks with debouncing support
 */
export const useTaskSearch = (searchTerm: string): Task[] => {
  const { filterTasks } = useTask();
  
  return useMemo(() => {
    if (!searchTerm.trim()) return [];
    return filterTasks({ search: searchTerm });
  }, [filterTasks, searchTerm]);
};

/**
 * Hook for task form management
 */
export const useTaskForm = () => {
  const { validateTaskForm, createTask, updateTask } = useTask();
  
  const handleSubmit = async (
    taskData: TaskFormData, 
    taskId?: string
  ): Promise<{ success: boolean; errors?: Record<string, string[]> }> => {
    const validation = validateTaskForm(taskData);
    
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }
    
    try {
      if (taskId) {
        await updateTask(taskId, taskData);
      } else {
        await createTask(taskData);
      }
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { 
        success: false, 
        errors: { general: [errorMessage] }
      };
    }
  };
  
  return {
    validateTaskForm,
    handleSubmit
  };
};
