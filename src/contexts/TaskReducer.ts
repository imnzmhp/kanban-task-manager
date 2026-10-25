/**
 * TaskReducer - State management logic for task operations
 * Extended to support CustomStatus integration (TaskV2)
 * Requirements: 1.1, 2.1, 4.1, 5.2, 7.2, 7.3
 */

import { TaskState, TaskStateV2, TaskAction, Task, TaskV2 } from '../types/Task';

/**
 * Initial state for the task reducer - V2 enhanced
 */
export const initialTaskState: TaskState = {
  tasks: [],
  loading: false,
  error: null
};

/**
 * Initial state for the enhanced task reducer with V2 support
 */
export const initialTaskStateV2: TaskStateV2 = {
  tasks: [],
  loading: false,
  error: null,
  isV2Mode: false
};

/**
 * Task reducer function that handles all task-related state changes
 * Enhanced to support both legacy Task and TaskV2 formats
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
      console.log("TaskReducer LOAD_TASKS_SUCCESS - payload:", action.payload);
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
 * Enhanced task reducer that handles both legacy and V2 actions
 */
export const taskReducerV2 = (state: TaskStateV2, action: TaskAction): TaskStateV2 => {
  switch (action.type) {
    case 'LOAD_TASKS_START':
      return {
        ...state,
        loading: true,
        error: null
      };

    case 'LOAD_TASKS_SUCCESS':
      console.log("TaskReducer LOAD_TASKS_SUCCESS - payload:", action.payload);
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

    case 'CREATE_TASK_V2':
      return {
        ...state,
        error: null,
        isV2Mode: true,
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

    case 'UPDATE_TASK_V2': {
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

    case 'MOVE_TASK_V2': {
      const { id, statusId } = action.payload;
      return {
        ...state,
        error: null,
        tasks: state.tasks.map(task =>
          task.id === id
            ? ({
                id: task.id,
                title: task.title,
                description: task.description,
                createdAt: task.createdAt,
                statusId,
                updatedAt: new Date()
              } as TaskV2)
            : task
        )
      };
    }

    case 'CLEAR_TASKS':
      return {
        ...state,
        error: null,
        tasks: []
      };

    default:
      return state;
  }
};

/**
 * Selector functions for accessing specific parts of the state
 */

/**
 * Helper function to check if a task is V2 format
 */
export const isTaskV2 = (task: Task | TaskV2): task is TaskV2 => {
  return 'statusId' in task;
};

/**
 * Helper function to get the status/statusId from a task
 */
export const getTaskStatus = (task: Task | TaskV2): string => {
  return isTaskV2(task) ? task.statusId : task.status;
};

/**
 * Get tasks by status (works with both legacy status and statusId)
 */
export const getTasksByStatus = (tasks: (Task | TaskV2)[], status: string): (Task | TaskV2)[] => {
  return tasks.filter(task => getTaskStatus(task) === status);
};

/**
 * Get tasks by statusId specifically (for V2 tasks)
 */
export const getTasksByStatusId = (tasks: (Task | TaskV2)[], statusId: string): (Task | TaskV2)[] => {
  return tasks.filter(task => {
    if (isTaskV2(task)) {
      return task.statusId === statusId;
    }
    return false; // Legacy tasks don't have statusId
  });
};

/**
 * Get task by ID
 */
export const getTaskById = (tasks: (Task | TaskV2)[], taskId: string): Task | TaskV2 | undefined => {
  return tasks.find(task => task.id === taskId);
};

/**
 * Get tasks count by status (works with both formats)
 */
export const getTasksCountByStatus = (tasks: (Task | TaskV2)[]): Record<string, number> => {
  return tasks.reduce((count, task) => {
    const status = getTaskStatus(task);
    count[status] = (count[status] || 0) + 1;
    return count;
  }, {} as Record<string, number>);
};

/**
 * Get tasks count by statusId specifically
 */
export const getTasksCountByStatusId = (tasks: (Task | TaskV2)[]): Record<string, number> => {
  return tasks.reduce((count, task) => {
    if (isTaskV2(task)) {
      count[task.statusId] = (count[task.statusId] || 0) + 1;
    }
    return count;
  }, {} as Record<string, number>);
};

/**
 * Check if there are any tasks in the system
 */
export const hasAnyTasks = (tasks: (Task | TaskV2)[]): boolean => {
  return tasks.length > 0;
};

/**
 * Get the most recently updated task
 */
export const getMostRecentTask = (tasks: (Task | TaskV2)[]): Task | TaskV2 | undefined => {
  if (tasks.length === 0) return undefined;
  
  return tasks.reduce((mostRecent, task) => {
    return new Date(task.updatedAt) > new Date(mostRecent.updatedAt) 
      ? task 
      : mostRecent;
  });
};

/**
 * Convert legacy tasks to V2 format with provided statusId mapping
 */
export const convertTasksToV2 = (
  tasks: Task[], 
  statusMapping: Record<string, string>
): TaskV2[] => {
  return tasks.map(task => ({
    ...task,
    statusId: statusMapping[task.status] || statusMapping['TODO'] || 'default',
  }));
};

/**
 * Check if any tasks are using a specific statusId
 */
export const hasTasksWithStatusId = (tasks: (Task | TaskV2)[], statusId: string): boolean => {
  return tasks.some(task => isTaskV2(task) && task.statusId === statusId);
};

/**
 * Check if any tasks are using a specific legacy status
 */
export const hasTasksWithStatus = (tasks: (Task | TaskV2)[], status: string): boolean => {
  return tasks.some(task => !isTaskV2(task) && (task as Task).status === status);
};