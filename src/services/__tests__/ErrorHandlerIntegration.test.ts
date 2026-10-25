/**
 * Integration tests for ErrorHandler with SystemError framework
 * Task 16.2 - Comprehensive error handling implementation verification
 */

import { ErrorHandler } from '../ErrorHandler';
import { ErrorCodes, ErrorSeverity } from '../../types/SystemError';

describe('ErrorHandler Integration Tests', () => {
  beforeEach(() => {
    // Clear error history
    ErrorHandler.clearErrorHistory();
  });

  describe('Data Integrity Error Handling', () => {
    it('should handle duplicate status ID errors', async () => {
      const result = await ErrorHandler.handleDataIntegrityError(
        'DUPLICATE_STATUS_ID',
        'Duplicate status IDs detected',
        {
          statusId: 'test-id',
          duplicateIds: ['test-id', 'test-id-2'],
          affectedEntities: ['status-1', 'status-2']
        }
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('重複する状態ID');
      
      const history = ErrorHandler.getErrorHistory();
      expect(history).toHaveLength(1);
      expect(history[0].code).toBe(ErrorCodes.DUPLICATE_STATUS_ID);
      expect(history[0].severity).toBe(ErrorSeverity.CRITICAL);
    });

    it('should handle invalid display order errors', async () => {
      const result = await ErrorHandler.handleDataIntegrityError(
        'INVALID_DISPLAY_ORDER',
        'Display order inconsistency detected',
        {
          displayOrder: -1,
          affectedEntities: ['status-1', 'status-2']
        }
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('表示順序に不整合');
      
      const history = ErrorHandler.getErrorHistory();
      expect(history).toHaveLength(1);
      expect(history[0].code).toBe(ErrorCodes.INVALID_DISPLAY_ORDER);
    });

    it('should handle orphaned task status errors', async () => {
      const result = await ErrorHandler.handleDataIntegrityError(
        'ORPHANED_TASK_STATUS',
        'Tasks reference non-existent status',
        {
          taskId: 'task-1',
          statusId: 'invalid-status-id',
          affectedEntities: ['task-1', 'task-2']
        }
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('無効な状態を参照');
      
      const history = ErrorHandler.getErrorHistory();
      expect(history).toHaveLength(1);
      expect(history[0].code).toBe(ErrorCodes.ORPHANED_TASK_STATUS);
    });
  });

  describe('Validation Error Handling', () => {
    it('should handle duplicate status name errors', async () => {
      const result = await ErrorHandler.handleValidationError(
        'DUPLICATE_STATUS_NAME',
        'Status name already exists',
        {
          fieldName: 'name',
          inputValue: 'To Do',
          existingNames: ['To Do', 'Doing', 'Done']
        }
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('既に使用されています');
      
      const history = ErrorHandler.getErrorHistory();
      expect(history).toHaveLength(1);
      expect(history[0].code).toBe(ErrorCodes.DUPLICATE_STATUS_NAME);
      expect(history[0].severity).toBe(ErrorSeverity.ERROR);
    });

    it('should handle invalid status name length errors', async () => {
      const result = await ErrorHandler.handleValidationError(
        'INVALID_STATUS_NAME_LENGTH',
        'Status name too long',
        {
          fieldName: 'name',
          inputValue: 'A'.repeat(60),
          currentLength: 60,
          maxLength: 50
        }
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('1文字以上50文字以下');
      
      const history = ErrorHandler.getErrorHistory();
      expect(history).toHaveLength(1);
      expect(history[0].code).toBe(ErrorCodes.INVALID_STATUS_NAME_LENGTH);
    });

    it('should handle empty status name errors', async () => {
      const result = await ErrorHandler.handleValidationError(
        'EMPTY_STATUS_NAME',
        'Status name is empty',
        {
          fieldName: 'name',
          inputValue: ''
        }
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('状態名を入力してください');
      
      const history = ErrorHandler.getErrorHistory();
      expect(history).toHaveLength(1);
      expect(history[0].code).toBe(ErrorCodes.EMPTY_STATUS_NAME);
    });

    it('should handle minimum status violation errors', async () => {
      const result = await ErrorHandler.handleValidationError(
        'MINIMUM_STATUS_VIOLATION',
        'Cannot delete last status',
        {
          fieldName: 'statusId',
          inputValue: 'last-status-id'
        }
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('最低1つの状態が必要');
      
      const history = ErrorHandler.getErrorHistory();
      expect(history).toHaveLength(1);
      expect(history[0].code).toBe(ErrorCodes.MINIMUM_STATUS_VIOLATION);
    });
  });

  describe('Storage Error Handling', () => {
    it('should handle storage quota exceeded errors', async () => {
      const result = await ErrorHandler.handleStorageError(
        'STORAGE_QUOTA_EXCEEDED',
        'Storage quota limit reached',
        {
          operation: 'write',
          storageType: 'localStorage',
          dataSize: 5000000,
          availableQuota: 1000000
        }
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('ストレージ容量が不足');
      
      const history = ErrorHandler.getErrorHistory();
      expect(history).toHaveLength(1);
      expect(history[0].code).toBe(ErrorCodes.STORAGE_QUOTA_EXCEEDED);
      expect(history[0].severity).toBe(ErrorSeverity.ERROR);
    });

    it('should handle storage access denied errors', async () => {
      const result = await ErrorHandler.handleStorageError(
        'STORAGE_ACCESS_DENIED',
        'Cannot access localStorage',
        {
          operation: 'read',
          storageType: 'localStorage'
        }
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('アクセスが拒否');
      
      const history = ErrorHandler.getErrorHistory();
      expect(history).toHaveLength(1);
      expect(history[0].code).toBe(ErrorCodes.STORAGE_ACCESS_DENIED);
    });

    it('should handle storage data corruption errors', async () => {
      const result = await ErrorHandler.handleStorageError(
        'STORAGE_DATA_CORRUPTION',
        'Data corruption detected',
        {
          operation: 'read',
          storageType: 'localStorage',
          corruptedKeys: ['kanban-tasks', 'user-preferences']
        }
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('データの破損が検出');
      
      const history = ErrorHandler.getErrorHistory();
      expect(history).toHaveLength(1);
      expect(history[0].code).toBe(ErrorCodes.STORAGE_DATA_CORRUPTION);
      expect(history[0].severity).toBe(ErrorSeverity.CRITICAL);
    });
  });

  describe('Color System Error Handling', () => {
    it('should handle color contrast insufficient errors', async () => {
      const result = await ErrorHandler.handleColorSystemError(
        'COLOR_CONTRAST_INSUFFICIENT',
        'Generated color has insufficient contrast',
        {
          statusPosition: 1,
          totalStatuses: 3,
          generatedColor: '#fafafa',
          contrastRatio: 3.2,
          targetRatio: 4.5
        }
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('コントラスト比が不足');
      
      const history = ErrorHandler.getErrorHistory();
      expect(history).toHaveLength(1);
      expect(history[0].code).toBe(ErrorCodes.COLOR_CONTRAST_INSUFFICIENT);
      expect(history[0].severity).toBe(ErrorSeverity.WARNING);
    });

    it('should handle color generation failed errors', async () => {
      const result = await ErrorHandler.handleColorSystemError(
        'COLOR_GENERATION_FAILED',
        'Failed to generate color for status',
        {
          statusPosition: -1,
          totalStatuses: 0
        }
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('色の生成に失敗');
      
      const history = ErrorHandler.getErrorHistory();
      expect(history).toHaveLength(1);
      expect(history[0].code).toBe(ErrorCodes.COLOR_GENERATION_FAILED);
    });
  });

  describe('UI State Error Handling', () => {
    it('should handle modal state inconsistency errors', async () => {
      const result = await ErrorHandler.handleUIStateError(
        'MODAL_STATE_INCONSISTENCY',
        'Modal state is inconsistent',
        {
          componentName: 'StatusSettingsModal',
          currentState: { isOpen: true, editingId: null },
          expectedState: { isOpen: true, editingId: 'status-1' },
          userAction: 'edit_status'
        }
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('モーダルの状態に不整合');
      
      const history = ErrorHandler.getErrorHistory();
      expect(history).toHaveLength(1);
      expect(history[0].code).toBe(ErrorCodes.MODAL_STATE_INCONSISTENCY);
      expect(history[0].severity).toBe(ErrorSeverity.ERROR);
    });

    it('should handle drag drop state errors', async () => {
      const result = await ErrorHandler.handleUIStateError(
        'DRAG_DROP_STATE_ERROR',
        'Drag and drop operation failed',
        {
          componentName: 'StatusSettingsModal',
          currentState: { draggedId: 'status-1', targetId: null },
          userAction: 'drag_reorder'
        }
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('ドラッグ&ドロップの状態エラー');
      
      const history = ErrorHandler.getErrorHistory();
      expect(history).toHaveLength(1);
      expect(history[0].code).toBe(ErrorCodes.DRAG_DROP_STATE_ERROR);
    });
  });

  describe('System Health Monitoring', () => {
    it('should track system health status', () => {
      const initialHealth = ErrorHandler.getSystemHealth();
      expect(initialHealth.status).toBe('healthy');
      expect(initialHealth.errorCount).toBe(0);
      expect(initialHealth.criticalErrorCount).toBe(0);
    });

    it('should update system health after errors', async () => {
      // Add some errors
      await ErrorHandler.handleValidationError('EMPTY_STATUS_NAME', 'Test error', {
        fieldName: 'test',
        inputValue: ''
      });
      
      await ErrorHandler.handleDataIntegrityError('DUPLICATE_STATUS_ID', 'Critical error', {
        statusId: 'test',
        duplicateIds: ['test']
      });

      const health = ErrorHandler.getSystemHealth();
      expect(health.status).toBe('critical');
      expect(health.errorCount).toBe(2);
      expect(health.criticalErrorCount).toBe(1);
      expect(health.lastError).toBeDefined();
    });

    it('should clear error history', () => {
      ErrorHandler.clearErrorHistory();
      const history = ErrorHandler.getErrorHistory();
      expect(history).toHaveLength(0);
      
      const health = ErrorHandler.getSystemHealth();
      expect(health.status).toBe('healthy');
    });
  });

  describe('Error Recovery Attempts', () => {
    it('should limit recovery attempts', async () => {
      const mockRecovery = jest.fn().mockRejectedValue(new Error('Recovery failed'));

      // Attempt recovery multiple times
      for (let i = 0; i < 5; i++) {
        await ErrorHandler.handleValidationError(
          'EMPTY_STATUS_NAME',
          'Test error',
          {
            fieldName: 'test',
            inputValue: 'test'
          },
          mockRecovery
        );
      }

      // Recovery should be attempted max 3 times (default limit)
      expect(mockRecovery).toHaveBeenCalledTimes(3);
    });

    it('should reset attempt counter on successful recovery', async () => {
      let callCount = 0;
      const mockRecovery = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          return Promise.resolve(); // Succeed on second attempt
        }
        return Promise.reject(new Error('Recovery failed'));
      });

      // First error - recovery fails
      await ErrorHandler.handleValidationError(
        'EMPTY_STATUS_NAME',
        'Test error 1',
        {
          fieldName: 'test1',
          inputValue: 'test1'
        },
        mockRecovery
      );

      // Second error - recovery succeeds
      await ErrorHandler.handleValidationError(
        'EMPTY_STATUS_NAME',
        'Test error 2',
        {
          fieldName: 'test2',
          inputValue: 'test2'
        },
        mockRecovery
      );

      // Third error - should allow recovery again (counter was reset)
      await ErrorHandler.handleValidationError(
        'EMPTY_STATUS_NAME',
        'Test error 3',
        {
          fieldName: 'test3',
          inputValue: 'test3'
        },
        mockRecovery
      );

      expect(mockRecovery).toHaveBeenCalledTimes(3);
    });
  });
});