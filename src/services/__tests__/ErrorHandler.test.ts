/**
 * Unit tests for ErrorHandler service
 */

import { ErrorHandler, ErrorHandling } from '../ErrorHandler';
import {
  ErrorSeverity,
  ErrorCodes,
  SystemError,
  SystemErrorFactory,
} from '../../types/SystemError';

// Mock window.dispatchEvent
const mockDispatchEvent = jest.fn();
Object.defineProperty(window, 'dispatchEvent', { value: mockDispatchEvent });

// Mock fetch for error reporting
global.fetch = jest.fn();

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    // Reset singleton instance
    (ErrorHandler as any).instance = undefined;
    errorHandler = ErrorHandler.getInstance({
      enableConsoleLogging: false, // Disable for tests
      enableUserNotifications: true,
      enableAutoRecovery: true,
      maxRecoveryAttempts: 3,
    });
    
    jest.clearAllMocks();
    mockDispatchEvent.mockClear();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const handler1 = ErrorHandler.getInstance();
      const handler2 = ErrorHandler.getInstance();
      
      expect(handler1).toBe(handler2);
    });
  });

  describe('handleError', () => {
    it('should log error and show notification', async () => {
      const error: SystemError = {
        code: ErrorCodes.DUPLICATE_STATUS_NAME,
        message: 'Test error',
        severity: ErrorSeverity.ERROR,
        context: { fieldName: 'name', inputValue: 'test' },
        timestamp: new Date(),
      };

      await errorHandler.handleError(error);

      // Should add to error log
      const errorLog = errorHandler.getErrorLog();
      expect(errorLog).toContainEqual(error);

      // Should dispatch notification event
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'system-error',
          detail: expect.objectContaining({
            message: 'この状態名は既に使用されています。別の名前を入力してください。',
            type: 'error',
            code: ErrorCodes.DUPLICATE_STATUS_NAME,
            severity: ErrorSeverity.ERROR,
          }),
        })
      );
    });

    it('should attempt recovery when recovery action is provided', async () => {
      const mockRecovery = jest.fn().mockResolvedValue(undefined);
      const error: SystemError = {
        code: ErrorCodes.DUPLICATE_STATUS_ID,
        message: 'Test error',
        severity: ErrorSeverity.CRITICAL,
        context: { statusId: 'test' },
        timestamp: new Date(),
        recoveryAction: mockRecovery,
      };

      const result = await errorHandler.handleError(error);

      expect(mockRecovery).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: `${ErrorCodes.DUPLICATE_STATUS_ID}の回復に成功しました`,
        followUpActions: [],
      });
    });

    it('should not attempt recovery when disabled', async () => {
      const handler = ErrorHandler.getInstance({
        enableAutoRecovery: false,
      });

      const mockRecovery = jest.fn().mockResolvedValue(undefined);
      const error: SystemError = {
        code: ErrorCodes.DUPLICATE_STATUS_ID,
        message: 'Test error',
        severity: ErrorSeverity.CRITICAL,
        context: { statusId: 'test' },
        timestamp: new Date(),
        recoveryAction: mockRecovery,
      };

      const result = await handler.handleError(error);

      expect(mockRecovery).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should limit recovery attempts', async () => {
      const mockRecovery = jest.fn()
        .mockRejectedValueOnce(new Error('Recovery failed'))
        .mockRejectedValueOnce(new Error('Recovery failed'))
        .mockRejectedValueOnce(new Error('Recovery failed'))
        .mockResolvedValue(undefined);

      const error: SystemError = {
        code: ErrorCodes.DUPLICATE_STATUS_ID,
        message: 'Test error',
        severity: ErrorSeverity.CRITICAL,
        context: { statusId: 'test' },
        timestamp: new Date(),
        recoveryAction: mockRecovery,
      };

      // First 3 attempts should try recovery
      await errorHandler.handleError(error);
      await errorHandler.handleError(error);
      await errorHandler.handleError(error);

      expect(mockRecovery).toHaveBeenCalledTimes(3);

      // 4th attempt should not try recovery (exceeds maxRecoveryAttempts)
      mockRecovery.mockClear();
      await errorHandler.handleError(error);
      expect(mockRecovery).not.toHaveBeenCalled();
    });
  });

  describe('getUserFriendlyMessage', () => {
    const testCases = [
      {
        code: ErrorCodes.DUPLICATE_STATUS_NAME,
        expected: 'この状態名は既に使用されています。別の名前を入力してください。',
      },
      {
        code: ErrorCodes.INVALID_STATUS_NAME_LENGTH,
        expected: '状態名は1文字以上50文字以下で入力してください。',
      },
      {
        code: ErrorCodes.EMPTY_STATUS_NAME,
        expected: '状態名を入力してください。',
      },
      {
        code: ErrorCodes.MINIMUM_STATUS_VIOLATION,
        expected: '最低1つの状態が必要です。この状態は削除できません。',
      },
      {
        code: ErrorCodes.STORAGE_QUOTA_EXCEEDED,
        expected: 'ストレージ容量が不足しています。古いデータを削除します。',
      },
      {
        code: ErrorCodes.STORAGE_DATA_CORRUPTION,
        expected: 'データが破損しています。バックアップから復旧します。',
      },
    ];

    testCases.forEach(({ code, expected }) => {
      it(`should return correct message for ${code}`, () => {
        const error: SystemError = {
          code,
          message: 'Original message',
          severity: ErrorSeverity.ERROR,
          context: {},
          timestamp: new Date(),
        };

        const message = errorHandler.getUserFriendlyMessage(error);
        expect(message).toBe(expected);
      });
    });

    it('should return original message for unknown error codes', () => {
      const error: SystemError = {
        code: 'UNKNOWN_ERROR_CODE' as any,
        message: 'Custom error message',
        severity: ErrorSeverity.ERROR,
        context: {},
        timestamp: new Date(),
      };

      const message = errorHandler.getUserFriendlyMessage(error);
      expect(message).toBe('Custom error message');
    });

    it('should return default message when no message is provided', () => {
      const error: SystemError = {
        code: 'UNKNOWN_ERROR_CODE' as any,
        message: '',
        severity: ErrorSeverity.ERROR,
        context: {},
        timestamp: new Date(),
      };

      const message = errorHandler.getUserFriendlyMessage(error);
      expect(message).toBe('予期しないエラーが発生しました。');
    });
  });

  describe('getErrorDisplayType', () => {
    it('should return correct display types', () => {
      expect(errorHandler.getErrorDisplayType(ErrorSeverity.CRITICAL)).toBe('error');
      expect(errorHandler.getErrorDisplayType(ErrorSeverity.ERROR)).toBe('error');
      expect(errorHandler.getErrorDisplayType(ErrorSeverity.WARNING)).toBe('warning');
    });
  });

  describe('error log management', () => {
    it('should maintain error log with size limit', async () => {
      // Add 105 errors to test the 100-error limit
      for (let i = 0; i < 105; i++) {
        const error: SystemError = {
          code: ErrorCodes.DUPLICATE_STATUS_NAME,
          message: `Error ${i}`,
          severity: ErrorSeverity.ERROR,
          context: { index: i },
          timestamp: new Date(),
        };
        await errorHandler.handleError(error);
      }

      const errorLog = errorHandler.getErrorLog();
      expect(errorLog).toHaveLength(100);
      
      // Should keep the most recent 100 errors
      expect(errorLog[0].context).toEqual({ index: 5 }); // Error 5 should be the oldest kept
      expect(errorLog[99].context).toEqual({ index: 104 }); // Error 104 should be the newest
    });

    it('should clear error log', async () => {
      const error: SystemError = {
        code: ErrorCodes.DUPLICATE_STATUS_NAME,
        message: 'Test error',
        severity: ErrorSeverity.ERROR,
        context: {},
        timestamp: new Date(),
      };
      
      await errorHandler.handleError(error);
      expect(errorHandler.getErrorLog()).toHaveLength(1);

      errorHandler.clearErrorLog();
      expect(errorHandler.getErrorLog()).toHaveLength(0);
    });
  });

  describe('convenience methods', () => {
    it('should handle data integrity errors', async () => {
      const result = await errorHandler.handleDataIntegrityError(
        ErrorCodes.DUPLICATE_STATUS_ID,
        'Test message',
        { statusId: 'test' }
      );

      const errorLog = errorHandler.getErrorLog();
      expect(errorLog).toHaveLength(1);
      expect(errorLog[0].severity).toBe(ErrorSeverity.CRITICAL);
    });

    it('should handle validation errors', async () => {
      const result = await errorHandler.handleValidationError(
        ErrorCodes.EMPTY_STATUS_NAME,
        'Test message',
        { fieldName: 'name', inputValue: '' }
      );

      const errorLog = errorHandler.getErrorLog();
      expect(errorLog).toHaveLength(1);
      expect(errorLog[0].severity).toBe(ErrorSeverity.ERROR);
    });

    it('should handle storage errors', async () => {
      const result = await errorHandler.handleStorageError(
        ErrorCodes.STORAGE_QUOTA_EXCEEDED,
        'Test message',
        { operation: 'write', storageType: 'localStorage' }
      );

      const errorLog = errorHandler.getErrorLog();
      expect(errorLog).toHaveLength(1);
      expect(errorLog[0].severity).toBe(ErrorSeverity.ERROR);
    });
  });
});

describe('ErrorHandling convenience functions', () => {
  beforeEach(() => {
    // Reset singleton instance
    (ErrorHandler as any).instance = undefined;
    jest.clearAllMocks();
  });

  describe('handleStatusValidation', () => {
    it('should handle status validation errors', async () => {
      await ErrorHandling.handleStatusValidation(
        'statusName',
        'invalid-value',
        'Invalid status name'
      );

      const handler = ErrorHandler.getInstance();
      const errorLog = handler.getErrorLog();
      
      expect(errorLog).toHaveLength(1);
      expect(errorLog[0].code).toBe(ErrorCodes.INVALID_STATUS_NAME_FORMAT);
      expect(errorLog[0].context).toEqual({
        fieldName: 'statusName',
        inputValue: 'invalid-value',
      });
    });
  });

  describe('handleDuplicateStatus', () => {
    it('should handle duplicate status name errors', async () => {
      await ErrorHandling.handleDuplicateStatus(
        'Test Status',
        ['Existing Status', 'Test Status']
      );

      const handler = ErrorHandler.getInstance();
      const errorLog = handler.getErrorLog();
      
      expect(errorLog).toHaveLength(1);
      expect(errorLog[0].code).toBe(ErrorCodes.DUPLICATE_STATUS_NAME);
      expect(errorLog[0].context).toEqual({
        fieldName: 'name',
        inputValue: 'Test Status',
        existingNames: ['Existing Status', 'Test Status'],
      });
    });
  });

  describe('handleStorageQuotaExceeded', () => {
    const originalLocalStorage = window.localStorage;

    beforeEach(() => {
      // Mock localStorage with backup data
      const mockStorage: { [key: string]: string } = {
        'kanban-tasks-backup-001': '{"old":"data1"}',
        'kanban-tasks-backup-002': '{"old":"data2"}',
        'kanban-tasks-backup-003': '{"old":"data3"}',
        'kanban-tasks-backup-004': '{"old":"data4"}',
      };

      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn((key: string) => mockStorage[key] || null),
          removeItem: jest.fn((key: string) => {
            delete mockStorage[key];
          }),
          key: jest.fn((index: number) => {
            const keys = Object.keys(mockStorage);
            return keys[index] || null;
          }),
          get length() {
            return Object.keys(mockStorage).length;
          },
        },
        writable: true,
      });

      // Mock Object.keys to return localStorage keys
      jest.spyOn(Object, 'keys').mockImplementation((obj) => {
        if (obj === localStorage) {
          return Object.keys(mockStorage);
        }
        return Object.keys(obj);
      });
    });

    afterEach(() => {
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        writable: true,
      });
      jest.restoreAllMocks();
    });

    it('should handle storage quota exceeded with recovery', async () => {
      const result = await ErrorHandling.handleStorageQuotaExceeded('write', 1024000);

      const handler = ErrorHandler.getInstance();
      const errorLog = handler.getErrorLog();
      
      expect(errorLog).toHaveLength(1);
      expect(errorLog[0].code).toBe(ErrorCodes.STORAGE_QUOTA_EXCEEDED);
      expect(errorLog[0].context).toEqual({
        operation: 'write',
        dataSize: 1024000,
        storageType: 'localStorage',
      });

      // Should have attempted recovery (removing old backups)
      expect(result?.success).toBe(true);
      expect(localStorage.removeItem).toHaveBeenCalledWith('kanban-tasks-backup-001');
    });
  });

  describe('handleDataCorruption', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn((key: string) => {
            if (key === 'backup-key') return '{"restored":"data"}';
            return null;
          }),
          setItem: jest.fn(),
        },
        writable: true,
      });
    });

    it('should handle data corruption with backup restoration', async () => {
      const result = await ErrorHandling.handleDataCorruption(
        ['corrupted-key1', 'corrupted-key2'],
        'backup-key'
      );

      const handler = ErrorHandler.getInstance();
      const errorLog = handler.getErrorLog();
      
      expect(errorLog).toHaveLength(1);
      expect(errorLog[0].code).toBe(ErrorCodes.STORAGE_DATA_CORRUPTION);
      expect(errorLog[0].context).toEqual({
        operation: 'read',
        storageType: 'localStorage',
        corruptedKeys: ['corrupted-key1', 'corrupted-key2'],
      });

      // Should have attempted recovery (restore from backup)
      expect(result?.success).toBe(true);
      expect(localStorage.getItem).toHaveBeenCalledWith('backup-key');
      expect(localStorage.setItem).toHaveBeenCalledWith('kanban-tasks', '{"restored":"data"}');
    });

    it('should handle data corruption without backup', async () => {
      const result = await ErrorHandling.handleDataCorruption(
        ['corrupted-key1'],
        undefined
      );

      expect(result?.success).toBe(true); // Still succeeds but no recovery action performed
    });
  });
});