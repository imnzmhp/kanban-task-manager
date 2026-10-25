/**
 * App providers that combine all context providers
 * Requirements: 6.4, 7.1, 7.5
 */

import React, { ReactNode } from 'react';
import { TaskProvider } from './TaskContext';
import { ToastProvider } from './ToastContext';
import { StatusProvider } from './StatusContext';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Combined provider component that wraps the app with all necessary contexts
 * 
 * Provider hierarchy (outer to inner):
 * 1. ToastProvider - Outermost for global error/success notifications
 * 2. StatusProvider - Status management must be available to TaskProvider
 * 3. TaskProvider - Task management with status integration
 * 
 * This order ensures:
 * - Toast notifications are available throughout the app
 * - Status context is available to task operations
 * - Task operations can use both status and toast functionality
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ToastProvider>
      <StatusProvider>
        <TaskProvider>
          {children}
        </TaskProvider>
      </StatusProvider>
    </ToastProvider>
  );
};
