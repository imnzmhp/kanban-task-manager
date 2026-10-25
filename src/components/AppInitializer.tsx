/**
 * AppInitializer - Component responsible for application data initialization
 * Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.4, 7.5
 * 
 * This component handles:
 * - Data loading on app startup
 * - Automatic data migration from v1 to v2
 * - Loading states and error handling
 * - Fallback strategies for storage failures
 * - Migration error handling with user feedback
 */

import React, { useEffect, useState } from 'react';
import { useAppInitialization } from '../hooks';
import { useToast } from '../contexts/ToastContext';
import { MigrationSystem, MigrationResult } from '../services/MigrationSystem';
import styles from './AppInitializer.module.css';

/**
 * Props for AppInitializer component
 */
interface AppInitializerProps {
  children: React.ReactNode;
  onInitializationComplete?: (success: boolean) => void;
  onMigrationComplete?: (result: MigrationResult) => void;
}

/**
 * Migration state tracking
 */
interface MigrationState {
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: MigrationResult;
  error?: string;
}

/**
 * Loading screen component displayed during initialization and migration
 */
interface LoadingScreenProps {
  isMigrating?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ isMigrating = false }) => (
  <div className={styles.appLoading}>
    <div className={styles.loadingContainer}>
      <div className={styles.loadingSpinner}></div>
      <h2>カンバンタスク管理</h2>
      {isMigrating ? (
        <>
          <p>データを移行中...</p>
          <small>v1データをv2フォーマットに変換しています</small>
        </>
      ) : (
        <p>データを読み込み中...</p>
      )}
    </div>
  </div>
);

/**
 * Error screen component displayed when initialization fails critically
 */
interface ErrorScreenProps {
  error: string;
  onRetry: () => void;
  onContinue: () => void;
}

const ErrorScreen: React.FC<ErrorScreenProps> = ({ error, onRetry, onContinue }) => (
  <div className={styles.appError}>
    <div className={styles.errorContainer}>
      <div className={styles.errorIcon}>⚠️</div>
      <h2>初期化エラー</h2>
      <p className={styles.errorMessage}>{error}</p>
      <div className={styles.errorActions}>
        <button onClick={onRetry} className={styles.retryButton}>
          再試行
        </button>
        <button onClick={onContinue} className={styles.continueButton}>
          データなしで続行
        </button>
      </div>
    </div>
  </div>
);

/**
 * AppInitializer component that manages application startup sequence
 */
export const AppInitializer: React.FC<AppInitializerProps> = ({ 
  children, 
  onInitializationComplete,
  onMigrationComplete 
}) => {
  const { isInitialized, storageHealth, initializeData } = useAppInitialization();
  const toast = useToast();
  const [initializationState, setInitializationState] = useState<'loading' | 'success' | 'error' | 'fallback'>('loading');
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [migrationState, setMigrationState] = useState<MigrationState>({ status: 'pending' });

  /**
   * Handle data migration process
   */
  const performMigration = async (): Promise<MigrationResult> => {
    setMigrationState({ status: 'running' });
    
    try {
      console.log('Starting data migration...');
      const migrationResult = await MigrationSystem.migrateToV2();
      
      setMigrationState({ 
        status: migrationResult.success ? 'completed' : 'failed', 
        result: migrationResult,
        error: migrationResult.success ? undefined : 'Migration completed with errors'
      });

      // Notify parent component about migration completion
      onMigrationComplete?.(migrationResult);

      // Show toast notifications based on migration result
      if (migrationResult.success) {
        if (migrationResult.migratedStatuses.length > 0) {
          toast.showSuccess(
            'データ移行完了', 
            `${migrationResult.migratedStatuses.length}個の状態とタスクをv2フォーマットに移行しました`
          );
        }
        
        // Show backup notification if backup was created
        if (migrationResult.backupCreated) {
          toast.showInfo(
            'バックアップ作成済み', 
            '既存データのバックアップが作成されました'
          );
        }
      } else {
        toast.showWarning(
          'データ移行警告', 
          'データ移行中に問題が発生しましたが、デフォルト設定で継続します'
        );
      }

      // Show any migration warnings or errors
      migrationResult.errors.forEach(error => {
        if (error.type === 'warning') {
          toast.showWarning('移行警告', error.message);
        } else if (error.type === 'error' || error.type === 'critical') {
          toast.showError('移行エラー', error.message);
        }
      });

      return migrationResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
      console.error('Migration failed:', error);
      
      setMigrationState({ 
        status: 'failed', 
        error: errorMessage 
      });

      toast.showError('移行失敗', `データ移行中にエラーが発生しました: ${errorMessage}`);
      
      // Return a failed migration result
      return {
        success: false,
        migratedStatuses: [],
        updatedTasks: [],
        errors: [{
          type: 'critical',
          message: errorMessage,
          code: 'MIGRATION_EXCEPTION'
        }],
        backupCreated: false
      };
    }
  };

  /**
   * Handle initialization process including migration
   */
  useEffect(() => {
    const performInitialization = async () => {
      try {
        setInitializationState('loading');
        setInitializationError(null);

        // Step 1: Check migration status and perform migration if needed
        const migrationStatus = MigrationSystem.getMigrationStatus();
        console.log('Migration status:', migrationStatus);

        let migrationResult: MigrationResult;
        
        if (!migrationStatus.migrationCompleted || (!migrationStatus.isV2 && migrationStatus.hasLegacyData)) {
          // Migration is needed
          migrationResult = await performMigration();
        } else {
          // Migration already completed
          console.log('Migration already completed, loading existing v2 data...');
          migrationResult = {
            success: true,
            migratedStatuses: [],
            updatedTasks: [],
            errors: [],
            backupCreated: false
          };
          setMigrationState({ status: 'completed', result: migrationResult });
        }

        // Step 2: Perform standard data initialization
        await initializeData();
        
        // Step 3: Check storage health and set appropriate state
        if (!storageHealth.isAvailable) {
          console.warn('Storage not available, running in fallback mode');
          setInitializationState('fallback');
          toast.showWarning(
            'ストレージ警告', 
            'ローカルストレージが利用できません。データは一時的にメモリに保存されます。'
          );
        } else {
          setInitializationState('success');
        }

        onInitializationComplete?.(true);

      } catch (error) {
        console.error('Initialization failed:', error);
        
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'アプリケーションの初期化中にエラーが発生しました。';
        
        setInitializationError(errorMessage);
        setInitializationState('error');
        
        toast.showError('初期化エラー', errorMessage);
        onInitializationComplete?.(false);
      }
    };

    // Only initialize once, unless explicitly retrying
    if (!isInitialized || retryAttempts > 0) {
      performInitialization();
    } else {
      // Already initialized successfully
      setInitializationState('success');
      onInitializationComplete?.(true);
    }
  }, [
    initializeData, 
    isInitialized, 
    storageHealth.isAvailable, 
    onInitializationComplete,
    onMigrationComplete,
    retryAttempts,
    toast
  ]);

  /**
   * Handle retry attempt with migration reset
   */
  const handleRetry = () => {
    setRetryAttempts(prev => prev + 1);
    setInitializationState('loading');
    setMigrationState({ status: 'pending' }); // Reset migration state for retry
  };

  /**
   * Handle continue without data - includes fallback migration if needed
   */
  const handleContinue = async () => {
    try {
      // Ensure we have at least default statuses even in fallback mode
      if (migrationState.status === 'failed' || migrationState.status === 'pending') {
        const fallbackResult = await MigrationSystem.migrateToV2(); // This will create default statuses
        setMigrationState({ status: 'completed', result: fallbackResult });
      }
      
      setInitializationState('fallback');
      onInitializationComplete?.(true);
      
      toast.showInfo('フォールバックモード', 'デフォルト設定で継続します');
    } catch (error) {
      console.error('Fallback initialization failed:', error);
      toast.showError('フォールバックエラー', '既定設定での初期化に失敗しました');
      setInitializationState('fallback'); // Continue anyway
      onInitializationComplete?.(false);
    }
  };

  // Show loading screen during initialization or migration
  if (initializationState === 'loading') {
    return <LoadingScreen isMigrating={migrationState.status === 'running'} />;
  }

  // Show error screen if initialization failed and we haven't exceeded retry attempts
  if (initializationState === 'error' && retryAttempts < 3) {
    return (
      <ErrorScreen
        error={initializationError || '不明なエラーが発生しました'}
        onRetry={handleRetry}
        onContinue={handleContinue}
      />
    );
  }

  // If we've exceeded retry attempts, force fallback mode
  if (initializationState === 'error' && retryAttempts >= 3) {
    console.warn('Maximum retry attempts reached, forcing fallback mode');
    handleContinue(); // This will set the state to fallback
  }

  // Show a subtle notification for fallback mode
  if (initializationState === 'fallback') {
    console.warn('Running in fallback mode - data may not persist');
  }

  // Render the main application
  return <>{children}</>;
};

/**
 * Storage health indicator component for development/debugging
 */
export const StorageHealthIndicator: React.FC = () => {
  const { storageHealth } = useAppInitialization();
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className={styles.storageHealthIndicator}>
      <div className={`${styles.healthStatus} ${storageHealth.isHealthy ? styles.healthy : styles.unhealthy}`}>
        <span className={styles.statusDot}></span>
        <span className={styles.statusText}>
          Storage: {storageHealth.isAvailable ? 'Available' : 'Unavailable'}
          {storageHealth.dataSize > 0 && ` (${Math.round(storageHealth.dataSize / 1024)}KB)`}
        </span>
      </div>
    </div>
  );
};