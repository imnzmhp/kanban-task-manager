/**
 * App providers that combine all context providers
 * Requirements: 6.4, 7.5
 */

import React, { ReactNode } from 'react';
import { TaskProvider } from './TaskContext';
import { ToastProvider } from './ToastContext';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Combined provider component that wraps the app with all necessary contexts
 * Order matters: ToastProvider should be outside TaskProvider so toasts can be used by task operations
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ToastProvider>
      <TaskProvider>
        {children}
      </TaskProvider>
    </ToastProvider>
  );
};