/**
 * ErrorHandler Service - Centralized error handling and recovery
 * 
 * Provides comprehensive error handling capabilities including:
 * - Error classification and severity assessment
 * - User-friendly message generation
 * - Automatic recovery mechanisms
 * - Error reporting and logging
 * 
 * Requirements: Task 16.2 - Comprehensive error handling implementation
 */

import * as React from 'react';
import {
  SystemError,
  ErrorSeverity,
  ErrorCodes,
  ErrorHandlerConfig,
  RecoveryResult,
  SystemErrorFactory,
  RecoveryActions,
  DataIntegrityErrorContext,
  ValidationErrorContext,
  StorageErrorContext,
  MigrationErrorContext,
  ColorSystemErrorContext,
  UIStateErrorContext
} from '../types/SystemError';

/**
 * User-friendly error messages for different error codes
 */
const ERROR_MESSAGES: Record<string, string> = {
  // Data Integrity Errors
  [ErrorCodes.DUPLICATE_STATUS_ID]: 'システムで重複する状態IDが検出されました。自動修復を行います。',
  [ErrorCodes.INVALID_DISPLAY_ORDER]: '状態の表示順序に不整合が発見されました。順序を修正しています。',
  [ErrorCodes.ORPHANED_TASK_STATUS]: '無効な状態を参照するタスクが見つかりました。デフォルト状態に移動します。',
  [ErrorCodes.CIRCULAR_STATUS_REFERENCE]: '状態の循環参照が検出されました。データ構造を修正します。',
  
  // Validation Errors
  [ErrorCodes.DUPLICATE_STATUS_NAME]: 'この状態名は既に使用されています。別の名前を入力してください。',
  [ErrorCodes.INVALID_STATUS_NAME_LENGTH]: '状態名は1文字以上50文字以下で入力してください。',
  [ErrorCodes.EMPTY_STATUS_NAME]: '状態名を入力してください。',
  [ErrorCodes.INVALID_STATUS_NAME_FORMAT]: '状態名に使用できない文字が含まれています。',
  [ErrorCodes.MINIMUM_STATUS_VIOLATION]: '最低1つの状態が必要です。この状態は削除できません。',
  
  // Storage Errors
  [ErrorCodes.STORAGE_QUOTA_EXCEEDED]: 'ストレージ容量が不足しています。古いデータを圧縮して容量を確保します。',
  [ErrorCodes.STORAGE_ACCESS_DENIED]: 'ストレージへのアクセスが拒否されました。一時的なストレージに切り替えます。',
  [ErrorCodes.STORAGE_DATA_CORRUPTION]: 'データの破損が検出されました。バックアップから復旧を試行します。',
  [ErrorCodes.STORAGE_SERIALIZATION_FAILED]: 'データの保存に失敗しました。再試行します。',
  [ErrorCodes.STORAGE_DESERIALIZATION_FAILED]: 'データの読み込みに失敗しました。デフォルト設定を使用します。',
  
  // Migration Errors
  [ErrorCodes.MIGRATION_VERSION_MISMATCH]: 'データ形式のバージョンが一致しません。移行処理を実行します。',
  [ErrorCodes.MIGRATION_DATA_LOSS]: '移行中にデータ損失が発生しました。バックアップから復旧します。',
  [ErrorCodes.MIGRATION_BACKUP_FAILED]: 'バックアップの作成に失敗しました。移行を中止します。',
  [ErrorCodes.MIGRATION_ROLLBACK_FAILED]: '移行のロールバックに失敗しました。手動での復旧が必要です。',
  
  // Color System Errors
  [ErrorCodes.COLOR_CONTRAST_INSUFFICIENT]: '色のコントラスト比が不足しています。アクセシブルな色に調整します。',
  [ErrorCodes.COLOR_GENERATION_FAILED]: '色の生成に失敗しました。デフォルト色を使用します。',
  [ErrorCodes.COLOR_VALIDATION_FAILED]: '色の検証に失敗しました。安全な色に置き換えます。',
  
  // UI State Errors
  [ErrorCodes.MODAL_STATE_INCONSISTENCY]: 'モーダルの状態に不整合があります。初期状態にリセットします。',
  [ErrorCodes.DRAG_DROP_STATE_ERROR]: 'ドラッグ&ドロップの状態エラーです。操作をキャンセルします。',
  [ErrorCodes.RENDER_STATE_CORRUPTION]: '画面の表示状態が破損しています。再描画します。',
  
  // Network/External Errors
  [ErrorCodes.NETWORK_TIMEOUT]: 'ネットワークタイムアウトが発生しました。',
  [ErrorCodes.EXTERNAL_SERVICE_UNAVAILABLE]: '外部サービスが利用できません。'
};

/**
 * Default error handler configuration
 */
const DEFAULT_CONFIG: ErrorHandlerConfig = {
  enableConsoleLogging: process.env.NODE_ENV === 'development',
  enableUserNotifications: true,
  enableAutoRecovery: true,
  maxRecoveryAttempts: 3
};

/**
 * Centralized error handler service
 */
export class ErrorHandler {
  private static config: ErrorHandlerConfig = DEFAULT_CONFIG;
  private static errorHistory: SystemError[] = [];
  private static recoveryAttempts: Map<string, number> = new Map();

  /**
   * Configure the error handler
   */
  static configure(config: Partial<ErrorHandlerConfig>): void {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Handle a system error with automatic recovery
   */
  static async handleError(error: SystemError): Promise<RecoveryResult> {
    // Log the error
    this.logError(error);
    
    // Add to error history
    this.errorHistory.push(error);
    
    // Check recovery attempt count
    const attemptKey = `${error.code}-${error.context}`;
    const currentAttempts = this.recoveryAttempts.get(attemptKey) || 0;
    
    if (currentAttempts >= this.config.maxRecoveryAttempts) {
      return {
        success: false,
        message: 'Maximum recovery attempts exceeded',
        followUpActions: ['Manual intervention required']
      };
    }

    // Increment attempt counter
    this.recoveryAttempts.set(attemptKey, currentAttempts + 1);

    // Attempt automatic recovery if enabled and available
    if (this.config.enableAutoRecovery && error.recoveryAction) {
      try {
        await error.recoveryAction();
        
        // Reset attempt counter on successful recovery
        this.recoveryAttempts.delete(attemptKey);
        
        return {
          success: true,
          message: `Automatically recovered from ${error.code}`,
          followUpActions: []
        };
      } catch (recoveryError) {
        console.error('Recovery failed:', recoveryError);
        return {
          success: false,
          message: `Recovery failed: ${recoveryError instanceof Error ? recoveryError.message : 'Unknown error'}`,
          followUpActions: ['Manual intervention may be required']
        };
      }
    }

    // Return appropriate message for manual handling
    return {
      success: false,
      message: this.getUserFriendlyMessage(error),
      followUpActions: this.getFollowUpActions(error)
    };
  }

  /**
   * Create and handle data integrity errors
   */
  static async handleDataIntegrityError(
    code: keyof typeof ErrorCodes,
    message: string,
    context: DataIntegrityErrorContext,
    recoveryAction?: () => Promise<void>
  ): Promise<RecoveryResult> {
    const error = SystemErrorFactory.createDataIntegrityError(
      ErrorCodes[code],
      message,
      context,
      recoveryAction
    );
    return this.handleError(error);
  }

  /**
   * Create and handle validation errors
   */
  static async handleValidationError(
    code: keyof typeof ErrorCodes,
    message: string,
    context: ValidationErrorContext,
    recoveryAction?: () => Promise<void>
  ): Promise<RecoveryResult> {
    const error = SystemErrorFactory.createValidationError(
      ErrorCodes[code],
      message,
      context,
      recoveryAction
    );
    return this.handleError(error);
  }

  /**
   * Create and handle storage errors
   */
  static async handleStorageError(
    code: keyof typeof ErrorCodes,
    message: string,
    context: StorageErrorContext,
    recoveryAction?: () => Promise<void>
  ): Promise<RecoveryResult> {
    const error = SystemErrorFactory.createStorageError(
      ErrorCodes[code],
      message,
      context,
      recoveryAction
    );
    return this.handleError(error);
  }

  /**
   * Create and handle migration errors
   */
  static async handleMigrationError(
    code: keyof typeof ErrorCodes,
    message: string,
    context: MigrationErrorContext,
    recoveryAction?: () => Promise<void>
  ): Promise<RecoveryResult> {
    const error = SystemErrorFactory.createMigrationError(
      ErrorCodes[code],
      message,
      context,
      recoveryAction
    );
    return this.handleError(error);
  }

  /**
   * Create and handle color system errors
   */
  static async handleColorSystemError(
    code: keyof typeof ErrorCodes,
    message: string,
    context: ColorSystemErrorContext,
    recoveryAction?: () => Promise<void>
  ): Promise<RecoveryResult> {
    const error = SystemErrorFactory.createColorSystemError(
      ErrorCodes[code],
      message,
      context,
      recoveryAction
    );
    return this.handleError(error);
  }

  /**
   * Create and handle UI state errors
   */
  static async handleUIStateError(
    code: keyof typeof ErrorCodes,
    message: string,
    context: UIStateErrorContext,
    recoveryAction?: () => Promise<void>
  ): Promise<RecoveryResult> {
    const error = SystemErrorFactory.createUIStateError(
      ErrorCodes[code],
      message,
      context,
      recoveryAction
    );
    return this.handleError(error);
  }

  /**
   * Get user-friendly error message
   */
  private static getUserFriendlyMessage(error: SystemError): string {
    return ERROR_MESSAGES[error.code] || error.message || 'An unexpected error occurred';
  }

  /**
   * Get follow-up actions for an error
   */
  private static getFollowUpActions(error: SystemError): string[] {
    switch (error.severity) {
      case ErrorSeverity.WARNING:
        return ['Monitor system behavior', 'Contact support if issue persists'];
      
      case ErrorSeverity.ERROR:
        return ['Try refreshing the page', 'Contact support if issue persists'];
      
      case ErrorSeverity.CRITICAL:
        return [
          'Restart the application',
          'Check for data corruption',
          'Contact support immediately'
        ];
      
      default:
        return ['Contact support'];
    }
  }

  /**
   * Log error to appropriate channels
   */
  private static logError(error: SystemError): void {
    if (this.config.enableConsoleLogging) {
      console.group(`🚨 ${error.severity.toUpperCase()}: ${error.code}`);
      console.error('Message:', error.message);
      console.error('Context:', error.context);
      console.error('Timestamp:', error.timestamp);
      if (error.recoveryAction) {
        console.info('Recovery action available');
      }
      console.groupEnd();
    }
  }

  /**
   * Get error history for debugging
   */
  static getErrorHistory(): SystemError[] {
    return [...this.errorHistory];
  }

  /**
   * Clear error history
   */
  static clearErrorHistory(): void {
    this.errorHistory = [];
    this.recoveryAttempts.clear();
  }

  /**
   * Check if system is in error state
   */
  static hasErrors(): boolean {
    return this.errorHistory.some(
      error => error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.ERROR
    );
  }

  /**
   * Get current system health status
   */
  static getSystemHealth(): {
    status: 'healthy' | 'degraded' | 'critical';
    errorCount: number;
    criticalErrorCount: number;
    lastError?: SystemError;
  } {
    const criticalErrors = this.errorHistory.filter(e => e.severity === ErrorSeverity.CRITICAL);
    const allErrors = this.errorHistory.filter(e => e.severity !== ErrorSeverity.WARNING);
    
    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
    
    if (criticalErrors.length > 0) {
      status = 'critical';
    } else if (allErrors.length > 0) {
      status = 'degraded';
    }

    return {
      status,
      errorCount: allErrors.length,
      criticalErrorCount: criticalErrors.length,
      lastError: this.errorHistory[this.errorHistory.length - 1]
    };
  }

  /**
   * Predefined recovery actions for common scenarios
   */
  static readonly RecoveryActions = {
    /**
     * Fix duplicate status IDs by regenerating UUIDs
     */
    async fixDuplicateStatusIds(statusIds: string[]): Promise<void> {
      // This will be implemented by StatusContext
      await RecoveryActions.regenerateStatusId(statusIds[0]);
    },

    /**
     * Fix display order inconsistencies
     */
    async fixDisplayOrder(): Promise<void> {
      // This will be implemented by StatusContext
      await RecoveryActions.reorderStatuses();
    },

    /**
     * Move orphaned tasks to default status
     */
    async fixOrphanedTasks(taskIds: string[]): Promise<void> {
      // This will be implemented by TaskContext
      await RecoveryActions.moveOrphanedTasks(taskIds);
    },

    /**
     * Handle storage quota issues
     */
    async handleStorageQuota(): Promise<void> {
      await RecoveryActions.compressStorageData();
    },

    /**
     * Fallback to session storage
     */
    async fallbackStorage(): Promise<void> {
      await RecoveryActions.fallbackToSessionStorage();
    },

    /**
     * Restore from backup
     */
    async restoreFromBackup(backupKey: string): Promise<void> {
      await RecoveryActions.restoreFromBackup(backupKey);
    }
  };
}

/**
 * Higher-order component for error boundary integration
 */
export function withErrorHandling<T extends object>(
  WrappedComponent: React.ComponentType<T>
): React.ComponentType<T> {
  return function ErrorHandledComponent(props: T) {
    const handleError = React.useCallback(async (error: Error) => {
      const systemError = SystemErrorFactory.createUIStateError(
        ErrorCodes.RENDER_STATE_CORRUPTION,
        error.message,
        {
          componentName: WrappedComponent.name || 'Unknown',
          currentState: props,
          userAction: 'component_render'
        }
      );
      
      await ErrorHandler.handleError(systemError);
    }, [props]);

    // Use React error boundary pattern
    React.useEffect(() => {
      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        handleError(new Error(event.reason));
      };

      window.addEventListener('unhandledrejection', handleUnhandledRejection);
      
      return () => {
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      };
    }, [handleError]);

    return React.createElement(WrappedComponent, props);
  };
}