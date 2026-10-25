/**
 * Unit tests for SystemError types and factory functions
 */

import {
  ErrorSeverity,
  ErrorCodes,
  SystemErrorFactory,
  RecoveryActions,
  SystemError,
  DataIntegrityErrorContext,
  ValidationErrorContext,
  StorageErrorContext,
} from '../SystemError';

describe('SystemError Types', () => {
  describe('ErrorSeverity enum', () => {
    it('should have correct severity levels', () => {
      expect(ErrorSeverity.WARNING).toBe('warning');
      expect(ErrorSeverity.ERROR).toBe('error');
      expect(ErrorSeverity.CRITICAL).toBe('critical');
    });
  });

  describe('ErrorCodes', () => {
    it('should have data integrity error codes', () => {
      expect(ErrorCodes.DUPLICATE_STATUS_ID).toBe('DATA_INTEGRITY_DUPLICATE_ID');
      expect(ErrorCodes.INVALID_DISPLAY_ORDER).toBe('DATA_INTEGRITY_INVALID_ORDER');
      expect(ErrorCodes.ORPHANED_TASK_STATUS).toBe('DATA_INTEGRITY_ORPHANED_STATUS');
    });

    it('should have validation error codes', () => {
      expect(ErrorCodes.DUPLICATE_STATUS_NAME).toBe('VALIDATION_DUPLICATE_NAME');
      expect(ErrorCodes.INVALID_STATUS_NAME_LENGTH).toBe('VALIDATION_NAME_LENGTH');
      expect(ErrorCodes.EMPTY_STATUS_NAME).toBe('VALIDATION_EMPTY_NAME');
    });

    it('should have storage error codes', () => {
      expect(ErrorCodes.STORAGE_QUOTA_EXCEEDED).toBe('STORAGE_QUOTA_EXCEEDED');
      expect(ErrorCodes.STORAGE_ACCESS_DENIED).toBe('STORAGE_ACCESS_DENIED');
      expect(ErrorCodes.STORAGE_DATA_CORRUPTION).toBe('STORAGE_DATA_CORRUPTION');
    });
  });

  describe('SystemErrorFactory', () => {
    const mockRecoveryAction = jest.fn().mockResolvedValue(undefined);

    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('createDataIntegrityError', () => {
      it('should create a critical severity data integrity error', () => {
        const context: DataIntegrityErrorContext = {
          statusId: 'test-status',
          duplicateIds: ['id1', 'id2'],
        };

        const error = SystemErrorFactory.createDataIntegrityError(
          ErrorCodes.DUPLICATE_STATUS_ID,
          'Duplicate status ID detected',
          context,
          mockRecoveryAction
        );

        expect(error).toEqual({
          code: ErrorCodes.DUPLICATE_STATUS_ID,
          message: 'Duplicate status ID detected',
          severity: ErrorSeverity.CRITICAL,
          context,
          timestamp: expect.any(Date),
          recoveryAction: mockRecoveryAction,
        });
      });

      it('should create error without recovery action', () => {
        const context: DataIntegrityErrorContext = {
          statusId: 'test-status',
        };

        const error = SystemErrorFactory.createDataIntegrityError(
          ErrorCodes.DUPLICATE_STATUS_ID,
          'Test error',
          context
        );

        expect(error.recoveryAction).toBeUndefined();
      });
    });

    describe('createValidationError', () => {
      it('should create an error severity validation error', () => {
        const context: ValidationErrorContext = {
          fieldName: 'statusName',
          inputValue: '',
          maxLength: 50,
        };

        const error = SystemErrorFactory.createValidationError(
          ErrorCodes.EMPTY_STATUS_NAME,
          'Status name cannot be empty',
          context,
          mockRecoveryAction
        );

        expect(error.severity).toBe(ErrorSeverity.ERROR);
        expect(error.code).toBe(ErrorCodes.EMPTY_STATUS_NAME);
        expect(error.context).toEqual(context);
      });
    });

    describe('createStorageError', () => {
      it('should create critical severity for data corruption', () => {
        const context: StorageErrorContext = {
          operation: 'read' as const,
          storageType: 'localStorage' as const,
          corruptedKeys: ['key1', 'key2'],
        };

        const error = SystemErrorFactory.createStorageError(
          ErrorCodes.STORAGE_DATA_CORRUPTION,
          'Data corruption detected',
          context
        );

        expect(error.severity).toBe(ErrorSeverity.CRITICAL);
      });

      it('should create error severity for other storage issues', () => {
        const context: StorageErrorContext = {
          operation: 'write' as const,
          storageType: 'localStorage' as const,
          dataSize: 1024000,
        };

        const error = SystemErrorFactory.createStorageError(
          ErrorCodes.STORAGE_QUOTA_EXCEEDED,
          'Storage quota exceeded',
          context
        );

        expect(error.severity).toBe(ErrorSeverity.ERROR);
      });
    });

    describe('createColorSystemError', () => {
      it('should create warning severity for color errors', () => {
        const context = {
          statusPosition: 1,
          totalStatuses: 5,
          contrastRatio: 3.2,
          targetRatio: 4.5,
        };

        const error = SystemErrorFactory.createColorSystemError(
          ErrorCodes.COLOR_CONTRAST_INSUFFICIENT,
          'Insufficient color contrast',
          context
        );

        expect(error.severity).toBe(ErrorSeverity.WARNING);
      });
    });
  });

  describe('RecoveryActions', () => {
    describe('compressStorageData', () => {
      beforeEach(() => {
        // Set up mock data in localStorage
        localStorage.setItem('kanban-tasks', '{"version":"2.0.0"}');
        localStorage.setItem('kanban-tasks-backup-001', '{"old":"data1"}');
        localStorage.setItem('kanban-tasks-backup-002', '{"old":"data2"}');
        localStorage.setItem('kanban-tasks-backup-003', '{"old":"data3"}');
        localStorage.setItem('kanban-tasks-backup-004', '{"old":"data4"}');
        localStorage.setItem('kanban-tasks-backup-005', '{"old":"data5"}');
        localStorage.setItem('other-key', 'other-data');

        // Spy on removeItem to track calls
        jest.spyOn(localStorage, 'removeItem');
      });

      afterEach(() => {
        jest.restoreAllMocks();
      });

      it('should remove old backup files keeping only the 3 most recent', async () => {
        await RecoveryActions.compressStorageData();

        // Should remove kanban-tasks-backup-001, 002 (keep only the 3 most recent)
        expect(localStorage.removeItem).toHaveBeenCalledWith('kanban-tasks-backup-001');
        expect(localStorage.removeItem).toHaveBeenCalledWith('kanban-tasks-backup-002');
        expect(localStorage.removeItem).toHaveBeenCalledTimes(2);

        // Verify the kept items are still there
        expect(localStorage.getItem('kanban-tasks-backup-003')).toBeTruthy();
        expect(localStorage.getItem('kanban-tasks-backup-004')).toBeTruthy();
        expect(localStorage.getItem('kanban-tasks-backup-005')).toBeTruthy();
      });
    });

    describe('restoreFromBackup', () => {
      beforeEach(() => {
        localStorage.setItem('backup-key', '{"version":"2.0.0","tasks":[]}');
        jest.spyOn(localStorage, 'getItem');
        jest.spyOn(localStorage, 'setItem');
      });

      afterEach(() => {
        jest.restoreAllMocks();
      });

      it('should restore data from existing backup', async () => {
        await RecoveryActions.restoreFromBackup('backup-key');

        expect(localStorage.getItem).toHaveBeenCalledWith('backup-key');
        expect(localStorage.setItem).toHaveBeenCalledWith('kanban-tasks', '{"version":"2.0.0","tasks":[]}');
      });

      it('should throw error for non-existent backup', async () => {
        await expect(
          RecoveryActions.restoreFromBackup('non-existent-key')
        ).rejects.toThrow('Backup not found: non-existent-key');
      });
    });
  });

  describe('Error Context Types', () => {
    it('should accept valid data integrity context', () => {
      const context: DataIntegrityErrorContext = {
        statusId: 'test-status',
        taskId: 'test-task',
        displayOrder: 1,
        statusName: 'Test Status',
        duplicateIds: ['id1', 'id2'],
        affectedEntities: ['entity1', 'entity2'],
      };

      expect(context.statusId).toBe('test-status');
      expect(context.duplicateIds).toEqual(['id1', 'id2']);
    });

    it('should accept valid validation context', () => {
      const context: ValidationErrorContext = {
        fieldName: 'statusName',
        inputValue: 'test value',
        expectedFormat: 'string',
        currentLength: 10,
        maxLength: 50,
        existingNames: ['Status 1', 'Status 2'],
      };

      expect(context.fieldName).toBe('statusName');
      expect(context.existingNames).toEqual(['Status 1', 'Status 2']);
    });

    it('should accept valid storage context', () => {
      const context: StorageErrorContext = {
        operation: 'write' as const,
        storageType: 'localStorage' as const,
        dataSize: 1024,
        availableQuota: 5120,
        corruptedKeys: ['key1'],
      };

      expect(context.operation).toBe('write');
      expect(context.storageType).toBe('localStorage');
    });
  });
});