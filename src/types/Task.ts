/**
 * Core data models for the Kanban Task Manager
 * Requirements: 1.1, 1.2, 2.1, 6.1
 */

/**
 * Task status enum representing the three columns in the Kanban board
 */
export type TaskStatus = 'TODO' | 'DOING' | 'DONE';

/**
 * Main Task entity representing a task in the system
 */
export interface Task {
  /** UUID format unique identifier */
  id: string;
  
  /** Task title (required, 1-200 characters) */
  title: string;
  
  /** Task description (optional, max 1000 characters) */
  description: string;
  
  /** Current status of the task */
  status: TaskStatus;
  
  /** Creation timestamp */
  createdAt: Date;
  
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Form data model for task creation and editing
 */
export interface TaskFormData {
  title: string;
  description: string;
}

/**
 * Validation result for form data
 */
export interface TaskFormValidation {
  title: string[];
  description: string[];
}

/**
 * UI state model for managing form and dialog states
 */
export interface UIState {
  activeForm: {
    isOpen: boolean;
    mode: 'create' | 'edit';
    taskId?: string;
  };
  deleteDialog: {
    isOpen: boolean;
    taskId?: string;
    taskTitle?: string;
  };
  dragState: {
    isDragging: boolean;
    draggedTaskId?: string;
  };
}

/**
 * Local Storage data structure for persistence
 * タスクは移行期間中、レガシー(Task)とV2(TaskV2)の両形式が混在しうる
 */
export interface StoredData {
  tasks: (Task | TaskV2)[];
  version: string;
  lastSaved: string;
}

/**
 * Task state for the global state management
 * レガシーとV2の両形式のタスクを保持しうる
 */
export interface TaskState {
  tasks: (Task | TaskV2)[];
  loading: boolean;
  error: string | null;
}

/**
 * Actions for the task reducer
 */
export type TaskAction =
  | { type: 'LOAD_TASKS_START' }
  | { type: 'LOAD_TASKS_SUCCESS'; payload: (Task | TaskV2)[] }
  | { type: 'LOAD_TASKS_ERROR'; payload: string }
  | { type: 'CREATE_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: { id: string; updates: Partial<Task> } }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'MOVE_TASK'; payload: { id: string; status: TaskStatus } }
  // V2 Actions for CustomStatus support
  | { type: 'CREATE_TASK_V2'; payload: TaskV2 }
  | { type: 'UPDATE_TASK_V2'; payload: { id: string; updates: Partial<TaskV2> } }
  | { type: 'MOVE_TASK_V2'; payload: { id: string; statusId: string } }
  | { type: 'CLEAR_TASKS' };

/**
 * V2 Task interface with CustomStatus support
 * Extends the base Task by replacing status with statusId
 */
export interface TaskV2 extends Omit<Task, 'status'> {
  /** Reference to CustomStatus ID */
  statusId: string;
}

/**
 * Enhanced TaskState that supports both legacy and V2 tasks
 */
export interface TaskStateV2 {
  /** All tasks (both legacy and V2 format) */
  tasks: (Task | TaskV2)[];
  loading: boolean;
  error: string | null;
  /** Indicates if the context is operating in V2 mode with CustomStatus support */
  isV2Mode: boolean;
}