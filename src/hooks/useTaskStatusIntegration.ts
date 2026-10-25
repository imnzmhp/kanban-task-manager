/**
 * Integration hook for TaskContext and StatusContext
 * Provides coordinated access to task and status management
 * 
 * Requirements: 7.2, 7.3
 */

import { useEffect, useRef } from 'react';
import { useTaskContext } from '../contexts/TaskContext';
import { useStatusContext } from '../contexts/StatusContext';

/**
 * Hook that establishes integration between TaskContext and StatusContext
 * This ensures proper dependency checking and data consistency
 */
/**
 * StatusContextにTaskContextの参照を受け渡すための任意の統合ポイント。
 * StatusContext側に実装されていない場合もあるためオプショナルとして扱う。
 */
type StatusContextWithIntegration = {
  setTaskContextRef?: (taskContext: unknown) => void;
};

export const useTaskStatusIntegration = () => {
  const taskContext = useTaskContext();
  const statusContext = useStatusContext();
  const integrationSetup = useRef(false);

  useEffect(() => {
    // Set up the integration only once
    const integration = statusContext as unknown as StatusContextWithIntegration;
    if (!integrationSetup.current && integration.setTaskContextRef) {
      integration.setTaskContextRef(taskContext);
      integrationSetup.current = true;
    }
  }, [taskContext, statusContext]);

  return {
    taskContext,
    statusContext,
    isIntegrated: integrationSetup.current
  };
};

/**
 * Hook that provides enhanced task operations with status integration
 */
export const useEnhancedTaskOperations = () => {
  const { taskContext, statusContext } = useTaskStatusIntegration();

  return {
    // Task operations
    ...taskContext,
    
    // Status operations
    statuses: statusContext.statuses,
    getStatusById: statusContext.getStatusById,
    getColorForStatus: statusContext.getColorForStatus,
    
    // Enhanced operations combining both contexts
    createTaskWithStatus: async (taskData: any, statusId: string) => {
      if (!taskContext.isV2Mode) {
        taskContext.enableV2Mode();
      }
      return taskContext.createTaskV2(taskData, statusId);
    },
    
    moveTaskToStatus: async (taskId: string, statusId: string) => {
      return taskContext.updateTaskStatus(taskId, statusId);
    },
    
    canDeleteStatusSafely: (statusId: string) => {
      return statusContext.canDeleteStatus(statusId);
    }
  };
};