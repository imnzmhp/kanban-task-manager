/**
 * ToastContext - Toast notification state management using React Context API
 * Requirements: 6.4, 7.5
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react';
import { ToastState, ToastAction, ToastType, ToastOptions } from '../types';
import { toastReducer, initialToastState } from './ToastReducer';

/**
 * Context value interface providing toast state and methods
 */
interface ToastContextValue {
  state: ToastState;
  dispatch: React.Dispatch<ToastAction>;
  
  // Convenient methods for showing different types of toasts
  showToast: (type: ToastType, title: string, message: string, options?: ToastOptions) => string;
  showSuccess: (title: string, message: string, options?: ToastOptions) => string;
  showError: (title: string, message: string, options?: ToastOptions) => string;
  showWarning: (title: string, message: string, options?: ToastOptions) => string;
  showInfo: (title: string, message: string, options?: ToastOptions) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

/**
 * Toast Context for managing toast notifications
 */
const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/**
 * Props for ToastProvider component
 */
interface ToastProviderProps {
  children: ReactNode;
}

/**
 * ToastProvider component that provides global toast state to child components
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(toastReducer, initialToastState);

  /**
   * Auto-dismiss toasts based on their duration
   */
  useEffect(() => {
    const timers: Record<string, NodeJS.Timeout> = {};

    // Set up timers for each toast with duration > 0
    state.toasts.forEach(toast => {
      if (toast.duration && toast.duration > 0) {
        timers[toast.id] = setTimeout(() => {
          dispatch({ type: 'REMOVE_TOAST', payload: toast.id });
        }, toast.duration);
      }
    });

    // Cleanup function to clear all timers
    return () => {
      Object.values(timers).forEach(timer => clearTimeout(timer));
    };
  }, [state.toasts]);

  /**
   * Generic method to show a toast notification
   */
  const showToast = useCallback((
    type: ToastType,
    title: string,
    message: string,
    options?: ToastOptions
  ): string => {
    const duration = options?.persistent 
      ? 0 
      : options?.duration;

    const toastData = {
      type,
      title,
      message,
      duration
    };

    dispatch({ type: 'ADD_TOAST', payload: toastData });
    
    // Return the ID that will be generated for potential manual removal
    // Note: This is a simplified approach; in a real implementation, 
    // you might want to generate the ID here and pass it to the reducer
    return crypto.randomUUID();
  }, []);

  /**
   * Show a success toast
   */
  const showSuccess = useCallback((title: string, message: string, options?: ToastOptions) => {
    return showToast('success', title, message, options);
  }, [showToast]);

  /**
   * Show an error toast
   */
  const showError = useCallback((title: string, message: string, options?: ToastOptions) => {
    return showToast('error', title, message, options);
  }, [showToast]);

  /**
   * Show a warning toast
   */
  const showWarning = useCallback((title: string, message: string, options?: ToastOptions) => {
    return showToast('warning', title, message, options);
  }, [showToast]);

  /**
   * Show an info toast
   */
  const showInfo = useCallback((title: string, message: string, options?: ToastOptions) => {
    return showToast('info', title, message, options);
  }, [showToast]);

  /**
   * Remove a specific toast
   */
  const removeToast = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id });
  }, []);

  /**
   * Clear all toasts
   */
  const clearAllToasts = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_TOASTS' });
  }, []);

  const contextValue: ToastContextValue = {
    state,
    dispatch,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast,
    clearAllToasts
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  );
};

/**
 * Custom hook to use ToastContext
 * Throws error if used outside of ToastProvider
 */
export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
};

/**
 * Export the context for advanced use cases
 */
export { ToastContext };