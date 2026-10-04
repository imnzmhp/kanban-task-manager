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
 */
export interface StoredData {
  tasks: Task[];
  version: string;
  lastSaved: string;
}

/**
 * Task state for the global state management
 */
export interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

/**
 * Actions for the task reducer
 */
export type TaskAction =
  | { type: 'LOAD_TASKS_START' }
  | { type: 'LOAD_TASKS_SUCCESS'; payload: Task[] }
  | { type: 'LOAD_TASKS_ERROR'; payload: string }
  | { type: 'CREATE_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: { id: string; updates: Partial<Task> } }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'MOVE_TASK'; payload: { id: string; status: TaskStatus } };