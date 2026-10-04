/**
 * TaskReducer - State management logic for task operations
 * Requirements: 1.1, 2.1, 4.1, 5.2
 */

import { TaskState, TaskAction, Task } from '../types/Task';

/**
 * Initial state for the task reducer
 */
export const initialTaskState: TaskState = {
  tasks: [],
  loading: false,
  error: null
};

/**
 * Task reducer function that handles all task-related state changes
 */
export const taskReducer = (state: TaskState, action: TaskAction): TaskState => {
  switch (action.type) {
    case 'LOAD_TASKS_START':
      return {
        ...state,
        loading: true,
        error: null
      };

    case 'LOAD_TASKS_SUCCESS':
      return {
        ...state,
        loading: false,
        error: null,
        tasks: action.payload
      };

    case 'LOAD_TASKS_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
        tasks: []
      };

    case 'CREATE_TASK':
      return {
        ...state,
        error: null,
        tasks: [...state.tasks, action.payload]
      };

    case 'UPDATE_TASK': {
      const { id, updates } = action.payload;
      return {
        ...state,
        error: null,
        tasks: state.tasks.map(task =>
          task.id === id
            ? { ...task, ...updates }
            : task
        )
      };
    }

    case 'DELETE_TASK':
      return {
        ...state,
        error: null,
        tasks: state.tasks.filter(task => task.id !== action.payload)
      };

    case 'MOVE_TASK': {
      const { id, status } = action.payload;
      return {
        ...state,
        error: null,
        tasks: state.tasks.map(task =>
          task.id === id
            ? { ...task, status, updatedAt: new Date() }
            : task
        )
      };
    }

    default:
      return state;
  }
};

/**
 * Selector functions for accessing specific parts of the state
 */

/**
 * Get tasks by status
 */
export const getTasksByStatus = (tasks: Task[], status: string): Task[] => {
  return tasks.filter(task => task.status === status);
};

/**
 * Get task by ID
 */
export const getTaskById = (tasks: Task[], taskId: string): Task | undefined => {
  return tasks.find(task => task.id === taskId);
};

/**
 * Get tasks count by status
 */
export const getTasksCountByStatus = (tasks: Task[]): Record<string, number> => {
  return tasks.reduce((count, task) => {
    count[task.status] = (count[task.status] || 0) + 1;
    return count;
  }, {} as Record<string, number>);
};

/**
 * Check if there are any tasks in the system
 */
export const hasAnyTasks = (tasks: Task[]): boolean => {
  return tasks.length > 0;
};

/**
 * Get the most recently updated task
 */
export const getMostRecentTask = (tasks: Task[]): Task | undefined => {
  if (tasks.length === 0) return undefined;
  
  return tasks.reduce((mostRecent, task) => {
    return new Date(task.updatedAt) > new Date(mostRecent.updatedAt) 
      ? task 
      : mostRecent;
  });
};