/**
 * Custom hook for toast notifications with convenient methods
 * Requirements: 6.4, 7.5
 */

import { useCallback } from 'react';
import { useToast as useToastContext } from '../contexts';
import { ToastOptions } from '../types';

/**
 * Enhanced hook that provides convenient methods for showing toasts
 * with common use cases for the Kanban application
 */
export const useToastNotifications = () => {
  const toast = useToastContext();

  /**
   * Show success message for task operations
   */
  const showTaskSuccess = useCallback((operation: string, taskTitle?: string) => {
    const message = taskTitle 
      ? `タスク「${taskTitle}」を${operation}しました`
      : `タスクを${operation}しました`;
    
    return toast.showSuccess('成功', message);
  }, [toast]);

  /**
   * Show error message for task operations
   */
  const showTaskError = useCallback((operation: string, error?: string) => {
    const message = error 
      ? `タスクの${operation}に失敗しました: ${error}`
      : `タスクの${operation}に失敗しました`;
    
    return toast.showError('エラー', message, { duration: 5000 });
  }, [toast]);

  /**
   * Show warning for data operations
   */
  const showDataWarning = useCallback((message: string) => {
    return toast.showWarning('注意', message, { duration: 4000 });
  }, [toast]);

  /**
   * Show success for data operations
   */
  const showDataSuccess = useCallback((message: string) => {
    return toast.showSuccess('成功', message, { duration: 3000 });
  }, [toast]);

  /**
   * Show error for data operations
   */
  const showDataError = useCallback((message: string) => {
    return toast.showError('データエラー', message, { duration: 5000 });
  }, [toast]);

  /**
   * Show storage error with fallback information
   */
  const showStorageError = useCallback((error?: string) => {
    const message = error
      ? `データの保存に失敗しました: ${error}。変更は一時的にのみ保存されます。`
      : 'データの保存に失敗しました。変更は一時的にのみ保存されます。';
    
    return toast.showError('保存エラー', message, { persistent: true });
  }, [toast]);

  /**
   * Show validation error
   */
  const showValidationError = useCallback((field: string, message: string) => {
    return toast.showError(
      '入力エラー', 
      `${field}: ${message}`, 
      { duration: 4000 }
    );
  }, [toast]);

  /**
   * Show info message for user guidance
   */
  const showInfo = useCallback((title: string, message: string, options?: ToastOptions) => {
    return toast.showInfo(title, message, options);
  }, [toast]);

  return {
    // Direct access to context methods
    ...toast,
    
    // Convenient methods for common scenarios
    showTaskSuccess,
    showTaskError,
    showDataWarning,
    showDataSuccess,
    showDataError,
    showStorageError,
    showValidationError,
    showInfo
  };
};