/**
 * SystemError types for comprehensive error handling and recovery
 * 
 * This module defines the error handling infrastructure for the custom task status manager,
 * providing classification, severity levels, and recovery mechanisms for different error types.
 */

/**
 * Error severity levels for classification and handling strategy
 */
export enum ErrorSeverity {
  /** Warning - Functionality can continue with degraded performance */
  WARNING = 'warning',
  /** Error - Specific functionality is blocked, but system remains operational */
  ERROR = 'error',
  /** Critical - Potential data corruption or system failure */
  CRITICAL = 'critical'
}

/**
 * Structured system error with classification and recovery capabilities
 */
export interface SystemError {
  /** Unique error code for identification and handling */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Error severity level */
  severity: ErrorSeverity;
  /** Additional context information for debugging */
  context: Record<string, unknown>;
  /** When the error occurred */
  timestamp: Date;
  /** Optional recovery action function */
  recoveryAction?: () => Promise<void>;
}

/**
 * Error codes for specific error types
 */
export const ErrorCodes = {
  // Data Integrity Errors
  DUPLICATE_STATUS_ID: 'DATA_INTEGRITY_DUPLICATE_ID',
  INVALID_DISPLAY_ORDER: 'DATA_INTEGRITY_INVALID_ORDER',
  ORPHANED_TASK_STATUS: 'DATA_INTEGRITY_ORPHANED_STATUS',
  CIRCULAR_STATUS_REFERENCE: 'DATA_INTEGRITY_CIRCULAR_REF',
  
  // Validation Errors
  DUPLICATE_STATUS_NAME: 'VALIDATION_DUPLICATE_NAME',
  INVALID_STATUS_NAME_LENGTH: 'VALIDATION_NAME_LENGTH',
  EMPTY_STATUS_NAME: 'VALIDATION_EMPTY_NAME',
  INVALID_STATUS_NAME_FORMAT: 'VALIDATION_NAME_FORMAT',
  MINIMUM_STATUS_VIOLATION: 'VALIDATION_MINIMUM_STATUS',
  
  // Storage Errors
  STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',
  STORAGE_ACCESS_DENIED: 'STORAGE_ACCESS_DENIED',
  STORAGE_DATA_CORRUPTION: 'STORAGE_DATA_CORRUPTION',
  STORAGE_SERIALIZATION_FAILED: 'STORAGE_SERIALIZATION_FAILED',
  STORAGE_DESERIALIZATION_FAILED: 'STORAGE_DESERIALIZATION_FAILED',
  
  // Migration Errors
  MIGRATION_VERSION_MISMATCH: 'MIGRATION_VERSION_MISMATCH',
  MIGRATION_DATA_LOSS: 'MIGRATION_DATA_LOSS',
  MIGRATION_BACKUP_FAILED: 'MIGRATION_BACKUP_FAILED',
  MIGRATION_ROLLBACK_FAILED: 'MIGRATION_ROLLBACK_FAILED',
  
  // Color System Errors
  COLOR_CONTRAST_INSUFFICIENT: 'COLOR_CONTRAST_INSUFFICIENT',
  COLOR_GENERATION_FAILED: 'COLOR_GENERATION_FAILED',
  COLOR_VALIDATION_FAILED: 'COLOR_VALIDATION_FAILED',
  
  // UI State Errors
  MODAL_STATE_INCONSISTENCY: 'UI_MODAL_STATE_INCONSISTENCY',
  DRAG_DROP_STATE_ERROR: 'UI_DRAG_DROP_STATE_ERROR',
  RENDER_STATE_CORRUPTION: 'UI_RENDER_STATE_CORRUPTION',
  
  // Network/External Errors (for future extensions)
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  EXTERNAL_SERVICE_UNAVAILABLE: 'EXTERNAL_SERVICE_UNAVAILABLE',
} as const;

/**
 * Type for error codes
 */
export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * Error context for different error types
 */
export interface DataIntegrityErrorContext extends Record<string, unknown> {
  statusId?: string;
  taskId?: string;
  displayOrder?: number;
  statusName?: string;
  duplicateIds?: string[];
  affectedEntities?: string[];
}

export interface ValidationErrorContext extends Record<string, unknown> {
  fieldName: string;
  inputValue: unknown;
  expectedFormat?: string;
  currentLength?: number;
  maxLength?: number;
  existingNames?: string[];
}

export interface StorageErrorContext extends Record<string, unknown> {
  operation: 'read' | 'write' | 'delete' | 'migrate';
  storageType: 'localStorage' | 'sessionStorage' | 'indexedDB';
  dataSize?: number;
  availableQuota?: number;
  corruptedKeys?: string[];
}

export interface MigrationErrorContext extends Record<string, unknown> {
  sourceVersion: string;
  targetVersion: string;
  migrationStep: string;
  originalData?: unknown;
  partiallyMigratedData?: unknown;
  backupLocation?: string;
}

export interface ColorSystemErrorContext extends Record<string, unknown> {
  statusPosition?: number;
  totalStatuses?: number;
  generatedColor?: string;
  contrastRatio?: number;
  targetRatio?: number;
  colorSpace?: string;
}

export interface UIStateErrorContext extends Record<string, unknown> {
  componentName: string;
  currentState?: unknown;
  expectedState?: unknown;
  userAction?: string;
  renderCycle?: number;
}

/**
 * Union type for all error contexts
 */
export type ErrorContext = 
  | DataIntegrityErrorContext 
  | ValidationErrorContext 
  | StorageErrorContext 
  | MigrationErrorContext
  | ColorSystemErrorContext
  | UIStateErrorContext
  | Record<string, unknown>;

/**
 * Error recovery strategies
 */
export interface RecoveryStrategy {
  /** Strategy identifier */
  id: string;
  /** Human-readable description */
  description: string;
  /** Whether this strategy can recover automatically */
  isAutomatic: boolean;
  /** Recovery function */
  execute: () => Promise<RecoveryResult>;
}

/**
 * Result of a recovery attempt
 */
export interface RecoveryResult {
  /** Whether recovery was successful */
  success: boolean;
  /** Message describing the result */
  message: string;
  /** Any data recovered or corrected */
  recoveredData?: unknown;
  /** Follow-up actions needed */
  followUpActions?: string[];
}

/**
 * Error handler configuration
 */
export interface ErrorHandlerConfig {
  /** Whether to log errors to console */
  enableConsoleLogging: boolean;
  /** Whether to show user notifications */
  enableUserNotifications: boolean;
  /** Whether to attempt automatic recovery */
  enableAutoRecovery: boolean;
  /** Custom error reporting endpoint */
  reportingEndpoint?: string;
  /** Maximum number of recovery attempts */
  maxRecoveryAttempts: number;
}

/**
 * Factory functions for creating specific error types
 */
export class SystemErrorFactory {
  /**
   * Creates a data integrity error
   */
  static createDataIntegrityError(
    code: ErrorCode,
    message: string,
    context: DataIntegrityErrorContext,
    recoveryAction?: () => Promise<void>
  ): SystemError {
    return {
      code,
      message,
      severity: ErrorSeverity.CRITICAL,
      context,
      timestamp: new Date(),
      recoveryAction
    };
  }

  /**
   * Creates a validation error
   */
  static createValidationError(
    code: ErrorCode,
    message: string,
    context: ValidationErrorContext,
    recoveryAction?: () => Promise<void>
  ): SystemError {
    return {
      code,
      message,
      severity: ErrorSeverity.ERROR,
      context,
      timestamp: new Date(),
      recoveryAction
    };
  }

  /**
   * Creates a storage error
   */
  static createStorageError(
    code: ErrorCode,
    message: string,
    context: StorageErrorContext,
    recoveryAction?: () => Promise<void>
  ): SystemError {
    const severity = code === ErrorCodes.STORAGE_DATA_CORRUPTION 
      ? ErrorSeverity.CRITICAL 
      : ErrorSeverity.ERROR;

    return {
      code,
      message,
      severity,
      context,
      timestamp: new Date(),
      recoveryAction
    };
  }

  /**
   * Creates a migration error
   */
  static createMigrationError(
    code: ErrorCode,
    message: string,
    context: MigrationErrorContext,
    recoveryAction?: () => Promise<void>
  ): SystemError {
    return {
      code,
      message,
      severity: ErrorSeverity.CRITICAL,
      context,
      timestamp: new Date(),
      recoveryAction
    };
  }

  /**
   * Creates a color system error
   */
  static createColorSystemError(
    code: ErrorCode,
    message: string,
    context: ColorSystemErrorContext,
    recoveryAction?: () => Promise<void>
  ): SystemError {
    return {
      code,
      message,
      severity: ErrorSeverity.WARNING,
      context,
      timestamp: new Date(),
      recoveryAction
    };
  }

  /**
   * Creates a UI state error
   */
  static createUIStateError(
    code: ErrorCode,
    message: string,
    context: UIStateErrorContext,
    recoveryAction?: () => Promise<void>
  ): SystemError {
    return {
      code,
      message,
      severity: ErrorSeverity.ERROR,
      context,
      timestamp: new Date(),
      recoveryAction
    };
  }
}

/**
 * Predefined recovery actions for common error scenarios
 */
export class RecoveryActions {
  /**
   * Regenerates UUID for duplicate status ID
   */
  static async regenerateStatusId(_statusId: string): Promise<void> {
    // This will be implemented by the status management system
    throw new Error('Recovery action must be implemented by status manager');
  }

  /**
   * Reorders display orders to fix gaps/duplicates
   */
  static async reorderStatuses(): Promise<void> {
    // This will be implemented by the status management system
    throw new Error('Recovery action must be implemented by status manager');
  }

  /**
   * Moves orphaned tasks to default status
   */
  static async moveOrphanedTasks(_taskIds: string[]): Promise<void> {
    // This will be implemented by the task management system
    throw new Error('Recovery action must be implemented by task manager');
  }

  /**
   * Compresses data and removes old backups
   */
  static async compressStorageData(): Promise<void> {
    // Get all localStorage keys that match backup pattern
    const backupKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('kanban-tasks-backup-')) {
        backupKeys.push(key);
      }
    }
    
    // Keep only the 3 most recent backups
    const sortedBackups = backupKeys
      .sort()
      .slice(0, -3);
    
    for (const key of sortedBackups) {
      localStorage.removeItem(key);
    }
  }

  /**
   * Falls back to session storage
   */
  static async fallbackToSessionStorage(): Promise<void> {
    // This will be implemented by the storage service
    throw new Error('Recovery action must be implemented by storage service');
  }

  /**
   * Restores from backup
   */
  static async restoreFromBackup(backupKey: string): Promise<void> {
    const backup = localStorage.getItem(backupKey);
    if (backup) {
      localStorage.setItem('kanban-tasks', backup);
    } else {
      throw new Error(`Backup not found: ${backupKey}`);
    }
  }
}