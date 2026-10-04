/**
 * AppInitializer - Component responsible for application data initialization
 * Requirements: 6.1, 6.2, 6.3, 6.4
 * 
 * This component handles:
 * - Data loading on app startup
 * - Loading states and error handling
 * - Fallback strategies for storage failures
 */

import React, { useEffect, useState } from 'react';
import { useAppInitialization } from '../hooks';
import styles from './AppInitializer.module.css';

/**
 * Props for AppInitializer component
 */
interface AppInitializerProps {
  children: React.ReactNode;
  onInitializationComplete?: (success: boolean) => void;
}

/**
 * Loading screen component displayed during initialization
 */
const LoadingScreen: React.FC = () => (
  <div className={styles.appLoading}>
    <div className={styles.loadingContainer}>
      <div className={styles.loadingSpinner}></div>
      <h2>カンバンタスク管理</h2>
      <p>データを読み込み中...</p>
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
  onInitializationComplete 
}) => {
  const { isInitialized, storageHealth, initializeData } = useAppInitialization();
  const [initializationState, setInitializationState] = useState<'loading' | 'success' | 'error' | 'fallback'>('loading');
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [retryAttempts, setRetryAttempts] = useState(0);

  /**
   * Handle initialization process
   */
  useEffect(() => {
    const performInitialization = async () => {
      try {
        setInitializationState('loading');
        setInitializationError(null);

        // Perform data initialization
        await initializeData();
        
        // Check if storage is healthy
        if (!storageHealth.isAvailable) {
          console.warn('Storage not available, running in fallback mode');
          setInitializationState('fallback');
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
  }, [initializeData, isInitialized, storageHealth.isAvailable, onInitializationComplete, retryAttempts]);

  /**
   * Handle retry attempt
   */
  const handleRetry = () => {
    setRetryAttempts(prev => prev + 1);
    setInitializationState('loading');
  };

  /**
   * Handle continue without data
   */
  const handleContinue = () => {
    setInitializationState('fallback');
    onInitializationComplete?.(true);
  };

  // Show loading screen during initialization
  if (initializationState === 'loading') {
    return <LoadingScreen />;
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
    setInitializationState('fallback');
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