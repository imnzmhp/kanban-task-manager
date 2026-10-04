/**
 * usePersistence - Hook for managing data persistence integration
 * Requirements: 6.1, 6.2, 6.3, 6.4
 * 
 * This hook handles:
 * - Application startup data loading
 * - Automatic saving on operations
 * - Error fallback handling
 * - Storage health monitoring
 */

import { useEffect, useCallback, useRef } from 'react';
import { useTaskContext } from '../contexts/TaskContext';
import { useToastNotifications } from './useToast';
import { LocalStorageService } from '../services/LocalStorageService';

/**
 * Storage health status
 */
export interface StorageHealth {
  isAvailable: boolean;
  hasData: boolean;
  dataSize: number;
  lastSaved: string | null;
  isHealthy: boolean;
}

/**
 * Persistence configuration options
 */
export interface PersistenceConfig {
  autoLoadOnMount?: boolean;
  showLoadingNotifications?: boolean;
  showErrorNotifications?: boolean;
  fallbackToMemoryOnly?: boolean;
}

/**
 * Default persistence configuration
 */
const defaultConfig: PersistenceConfig = {
  autoLoadOnMount: true,
  showLoadingNotifications: true,
  showErrorNotifications: true,
  fallbackToMemoryOnly: true
};

/**
 * Hook for managing data persistence throughout the application lifecycle
 */
export const usePersistence = (config: PersistenceConfig = {}) => {
  const finalConfig = { ...defaultConfig, ...config };
  const { loadTasks, state } = useTaskContext();
  const toast = useToastNotifications();
  const initializationAttempted = useRef(false);
  const lastSaveTime = useRef<number>(0);

  /**
   * Check storage health and return status information
   */
  const checkStorageHealth = useCallback((): StorageHealth => {
    const storageInfo = LocalStorageService.getStorageInfo();
    
    return {
      isAvailable: storageInfo.isAvailable,
      hasData: storageInfo.hasData,
      dataSize: storageInfo.dataSize,
      lastSaved: storageInfo.lastSaved,
      isHealthy: storageInfo.isAvailable && storageInfo.dataSize < 5 * 1024 * 1024 // 5MB threshold
    };
  }, []);

  /**
   * Initialize data loading on app startup
   */
  const initializeData = useCallback(async () => {
    if (initializationAttempted.current) {
      return;
    }
    
    initializationAttempted.current = true;

    try {
      // Check storage health first
      const health = checkStorageHealth();
      
      if (!health.isAvailable) {
        if (finalConfig.showErrorNotifications) {
          toast.showDataWarning(
            'ローカルストレージが利用できません。データは一時的にメモリに保存されます。'
          );
        }
        
        if (finalConfig.fallbackToMemoryOnly) {
          console.warn('Storage not available, running in memory-only mode');
          return;
        }
      }

      if (!health.isHealthy) {
        if (finalConfig.showErrorNotifications) {
          toast.showDataWarning(
            'ストレージ容量が不足している可能性があります。一部のデータが保存されない場合があります。'
          );
        }
      }

      // Show loading notification if enabled
      if (finalConfig.showLoadingNotifications && health.hasData) {
        toast.showInfo('データ読み込み中', 'タスクデータを読み込んでいます...');
      }

      // Load data from storage
      await loadTasks();

      // Show success notification if data was loaded
      if (finalConfig.showLoadingNotifications && health.hasData) {
        const tasksCount = state.tasks.length;
        if (tasksCount > 0) {
          toast.showTaskSuccess('読み込み', `${tasksCount}件のタスク`);
        }
      }

    } catch (error) {
      console.error('Failed to initialize data:', error);
      
      if (finalConfig.showErrorNotifications) {
        const errorMessage = error instanceof Error ? error.message : 'データの初期化に失敗しました';
        toast.showTaskError('初期化', errorMessage);
      }

      // If fallback is enabled, continue with empty state
      if (finalConfig.fallbackToMemoryOnly) {
        console.warn('Continuing with empty state due to initialization failure');
      } else {
        throw error;
      }
    }
  }, [
    loadTasks, 
    state.tasks.length, 
    toast, 
    checkStorageHealth, 
    finalConfig.showLoadingNotifications,
    finalConfig.showErrorNotifications,
    finalConfig.fallbackToMemoryOnly
  ]);

  /**
   * Handle storage errors with appropriate fallback strategies
   */
  const handleStorageError = useCallback((error: Error, operation: string) => {
    console.error(`Storage error during ${operation}:`, error);
    
    const health = checkStorageHealth();
    
    if (!health.isAvailable) {
      if (finalConfig.showErrorNotifications) {
        toast.showTaskError(operation, `ローカルストレージが利用できません`);
      }
    } else if (!health.isHealthy) {
      if (finalConfig.showErrorNotifications) {
        toast.showDataWarning(
          `${operation}に失敗しました：ストレージ容量が不足している可能性があります`
        );
      }
    } else {
      if (finalConfig.showErrorNotifications) {
        const errorMessage = error.message || `${operation}中にエラーが発生しました`;
        toast.showTaskError(operation, errorMessage);
      }
    }
  }, [checkStorageHealth, toast, finalConfig.showErrorNotifications]);

  /**
   * Debounced auto-save functionality to prevent excessive storage operations
   */
  const scheduleAutoSave = useCallback(() => {
    const now = Date.now();
    const timeSinceLastSave = now - lastSaveTime.current;
    
    // Debounce: only save if it's been at least 500ms since last save
    if (timeSinceLastSave >= 500) {
      lastSaveTime.current = now;
      
      try {
        // The actual saving is handled by individual operations in TaskContext
        // This is just for monitoring and health checks
        const health = checkStorageHealth();
        
        if (!health.isHealthy) {
          handleStorageError(
            new Error('ストレージが不健全な状態です'), 
            'ヘルスチェック'
          );
        }
      } catch (error) {
        handleStorageError(error as Error, '自動保存ヘルスチェック');
      }
    }
  }, [checkStorageHealth, handleStorageError]);

  /**
   * Manual data refresh from storage
   */
  const refreshData = useCallback(async () => {
    try {
      if (finalConfig.showLoadingNotifications) {
        toast.showInfo('更新中', 'データを再読み込みしています...');
      }
      
      await loadTasks();
      
      if (finalConfig.showLoadingNotifications) {
        toast.showTaskSuccess('更新', 'データを正常に更新しました');
      }
    } catch (error) {
      handleStorageError(error as Error, 'データ更新');
      throw error;
    }
  }, [loadTasks, toast, handleStorageError, finalConfig.showLoadingNotifications]);

  /**
   * Export data for backup purposes
   */
  const exportData = useCallback(() => {
    try {
      const data = {
        tasks: state.tasks,
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = `kanban-tasks-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.showTaskSuccess('エクスポート', 'データをエクスポートしました');
    } catch (error) {
      handleStorageError(error as Error, 'データエクスポート');
    }
  }, [state.tasks, toast, handleStorageError]);

  // Initialize data on mount
  useEffect(() => {
    if (finalConfig.autoLoadOnMount) {
      initializeData();
    }
  }, [initializeData, finalConfig.autoLoadOnMount]);

  // Monitor task changes for auto-save health checks
  useEffect(() => {
    if (state.tasks.length > 0 && !state.loading) {
      scheduleAutoSave();
    }
  }, [state.tasks, state.loading, scheduleAutoSave]);

  // Handle storage errors from the task context
  useEffect(() => {
    if (state.error) {
      handleStorageError(new Error(state.error), 'タスク操作');
    }
  }, [state.error, handleStorageError]);

  return {
    // Status information
    isInitialized: initializationAttempted.current,
    storageHealth: checkStorageHealth(),
    
    // Operations
    initializeData,
    refreshData,
    exportData,
    
    // Utilities
    handleStorageError,
    checkStorageHealth
  };
};

/**
 * Hook specifically for initialization during app startup
 */
export const useAppInitialization = () => {
  const persistence = usePersistence({
    autoLoadOnMount: true,
    showLoadingNotifications: false, // Reduce noise on startup
    showErrorNotifications: true,
    fallbackToMemoryOnly: true
  });

  return {
    isInitialized: persistence.isInitialized,
    storageHealth: persistence.storageHealth,
    initializeData: persistence.initializeData
  };
};

/**
 * Hook for storage monitoring and health reporting
 */
export const useStorageMonitor = () => {
  const { checkStorageHealth } = usePersistence({
    autoLoadOnMount: false,
    showLoadingNotifications: false,
    showErrorNotifications: false
  });

  return {
    checkStorageHealth,
    getStorageReport: () => {
      const health = checkStorageHealth();
      return {
        ...health,
        storageQuotaUsage: health.dataSize / (5 * 1024 * 1024), // Percentage of 5MB
        recommendations: health.isHealthy 
          ? [] 
          : ['ストレージ容量を確認してください', 'ブラウザキャッシュをクリアしてください']
      };
    }
  };
};