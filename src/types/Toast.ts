/**
 * Toast notification types and interfaces
 * Requirements: 6.4, 7.5
 */

/**
 * Toast message severity levels
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Individual toast message interface
 */
export interface ToastMessage {
  /** Unique identifier for the toast */
  id: string;
  
  /** Message type/severity */
  type: ToastType;
  
  /** Toast title */
  title: string;
  
  /** Toast message content */
  message: string;
  
  /** Auto-dismiss duration in milliseconds (0 = no auto-dismiss) */
  duration?: number;
  
  /** Creation timestamp */
  createdAt: Date;
}

/**
 * Toast state for managing multiple toasts
 */
export interface ToastState {
  toasts: ToastMessage[];
}

/**
 * Toast actions for state management
 */
export type ToastAction =
  | { type: 'ADD_TOAST'; payload: Omit<ToastMessage, 'id' | 'createdAt'> }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'CLEAR_ALL_TOASTS' };

/**
 * Default durations for different toast types (in milliseconds)
 */
export const DEFAULT_TOAST_DURATIONS: Record<ToastType, number> = {
  success: 3000,   // 3 seconds
  error: 5000,     // 5 seconds
  warning: 4000,   // 4 seconds
  info: 3000,      // 3 seconds
};

/**
 * Toast configuration options
 */
export interface ToastOptions {
  /** Custom duration override */
  duration?: number;
  
  /** Prevent auto-dismiss */
  persistent?: boolean;
}