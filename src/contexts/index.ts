/**
 * Context exports - Centralized exports for all context-related modules
 * Requirements: 1.1, 2.1, 4.1, 5.2, 7.1
 */

export { TaskProvider, useTaskContext, TaskContext } from './TaskContext';
export { taskReducer, initialTaskState, getTasksByStatus, getTaskById, getTasksCountByStatus, hasAnyTasks, getMostRecentTask } from './TaskReducer';
export type { TaskState, TaskAction } from '../types/Task';

export { ToastProvider, useToast, ToastContext } from './ToastContext';
export { toastReducer, initialToastState } from './ToastReducer';
export type { ToastState, ToastAction } from '../types/Toast';

export { StatusProvider, useStatusContext, StatusContext } from './StatusContext';
export { statusReducer, initialStatusState } from './StatusReducer';
export type { StatusState, StatusAction } from '../types/CustomStatus';

export { AppProviders } from './AppProviders';