/**
 * Toast container component that manages and displays all active toasts
 * Requirements: 6.4, 7.5
 */

import React from 'react';
import { useToast } from '../contexts';
import { Toast } from './Toast';
import styles from './Toast.module.css';

/**
 * ToastContainer component that renders all active toasts
 * Should be placed at the root level of the application
 */
export const ToastContainer: React.FC = () => {
  const { state, removeToast } = useToast();

  if (state.toasts.length === 0) {
    return null;
  }

  return (
    <div className={styles.toastContainer} aria-live="polite" aria-label="Notifications">
      {state.toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onClose={removeToast}
        />
      ))}
    </div>
  );
};