/**
 * Unit tests for CustomStatus data models
 * カスタムステータスデータモデルのユニットテスト
 */

import type {
  CustomStatus,
  StatusColor,
  ValidationResult,
  ValidationError,
  StoredDataV2,
  TaskV2,
  StatusState,
  StatusAction,
  TruncatedDisplayResult,
  DeletionCheckResult,
  SerializedStatusConfig,
} from '../CustomStatus';

describe('CustomStatus Data Models', () => {
  describe('CustomStatus interface', () => {
    it('should create a valid CustomStatus object', () => {
      const status: CustomStatus = {
        id: 'test-id-123',
        name: 'In Progress',
        displayOrder: 1,
        createdAt: new Date('2024-01-01T00:00:00Z'),
      };

      expect(status.id).toBe('test-id-123');
      expect(status.name).toBe('In Progress');
      expect(status.displayOrder).toBe(1);
      expect(status.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('StatusColor interface', () => {
    it('should create a valid StatusColor object', () => {
      const color: StatusColor = {
        backgroundColor: '#f0f8ff',
        accentColor: '#1e90ff',
        contrastRatio: 5.2,
      };

      expect(color.backgroundColor).toBe('#f0f8ff');
      expect(color.accentColor).toBe('#1e90ff');
      expect(color.contrastRatio).toBeGreaterThan(4.5); // WCAG AA compliant
    });
  });

  describe('ValidationResult interface', () => {
    it('should create a valid ValidationResult for success case', () => {
      const result: ValidationResult = {
        isValid: true,
        errors: [],
      };

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should create a valid ValidationResult for error case', () => {
      const error: ValidationError = {
        field: 'name',
        message: 'Status name is required',
        code: 'REQUIRED_FIELD',
      };

      const result: ValidationResult = {
        isValid: false,
        errors: [error],
      };

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('name');
      expect(result.errors[0].message).toBe('Status name is required');
      expect(result.errors[0].code).toBe('REQUIRED_FIELD');
    });
  });

  describe('StoredDataV2 interface', () => {
    it('should extend base StoredData with custom statuses', () => {
      const data: StoredDataV2 = {
        version: '2.0.0',
        tasks: [],
        lastSaved: '2024-01-01T00:00:00Z',
        customStatuses: [
          {
            id: 'status-1',
            name: 'To Do',
            displayOrder: 0,
            createdAt: new Date(),
          },
        ],
        migrationInfo: {
          migratedFrom: '1.0.0',
          migratedAt: '2024-01-01T00:00:00Z',
          backupKey: 'backup-key-123',
        },
      };

      expect(data.version).toBe('2.0.0');
      expect(data.customStatuses).toHaveLength(1);
      expect(data.migrationInfo?.migratedFrom).toBe('1.0.0');
    });
  });

  describe('TaskV2 interface', () => {
    it('should use statusId instead of status field', () => {
      const task: TaskV2 = {
        id: 'task-123',
        title: 'Test Task',
        description: 'Test Description',
        statusId: 'custom-status-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(task.statusId).toBe('custom-status-id');
      // Ensure the old 'status' field is not present
      expect('status' in task).toBe(false);
    });
  });

  describe('StatusAction union type', () => {
    it('should handle LOAD_STATUSES_SUCCESS action', () => {
      const action: StatusAction = {
        type: 'LOAD_STATUSES_SUCCESS',
        payload: [
          {
            id: 'status-1',
            name: 'To Do',
            displayOrder: 0,
            createdAt: new Date(),
          },
        ],
      };

      expect(action.type).toBe('LOAD_STATUSES_SUCCESS');
      expect(action.payload).toHaveLength(1);
    });

    it('should handle UPDATE_STATUS action', () => {
      const action: StatusAction = {
        type: 'UPDATE_STATUS',
        payload: {
          id: 'status-1',
          updates: { name: 'Updated Name' },
        },
      };

      expect(action.type).toBe('UPDATE_STATUS');
      expect(action.payload.id).toBe('status-1');
      expect(action.payload.updates.name).toBe('Updated Name');
    });

    it('should handle REORDER_STATUSES action', () => {
      const action: StatusAction = {
        type: 'REORDER_STATUSES',
        payload: {
          fromIndex: 0,
          toIndex: 2,
        },
      };

      expect(action.type).toBe('REORDER_STATUSES');
      expect(action.payload.fromIndex).toBe(0);
      expect(action.payload.toIndex).toBe(2);
    });
  });

  describe('TruncatedDisplayResult interface', () => {
    it('should handle non-truncated display', () => {
      const result: TruncatedDisplayResult = {
        displayText: 'Short Name',
        shouldShowTooltip: false,
        fullText: 'Short Name',
      };

      expect(result.displayText).toBe('Short Name');
      expect(result.shouldShowTooltip).toBe(false);
      expect(result.fullText).toBe('Short Name');
    });

    it('should handle truncated display', () => {
      const result: TruncatedDisplayResult = {
        displayText: 'Very Long Status Name That Gets Trun...',
        shouldShowTooltip: true,
        fullText: 'Very Long Status Name That Gets Truncated',
      };

      expect(result.displayText).toContain('...');
      expect(result.shouldShowTooltip).toBe(true);
      expect(result.fullText).toBe('Very Long Status Name That Gets Truncated');
    });
  });

  describe('DeletionCheckResult interface', () => {
    it('should allow deletion when no tasks are related', () => {
      const result: DeletionCheckResult = {
        canDelete: true,
        relatedTaskCount: 0,
      };

      expect(result.canDelete).toBe(true);
      expect(result.relatedTaskCount).toBe(0);
      expect(result.reason).toBeUndefined();
    });

    it('should prevent deletion when tasks are related', () => {
      const result: DeletionCheckResult = {
        canDelete: false,
        reason: 'このステータスを使用しているタスクが5つあります',
        relatedTaskCount: 5,
      };

      expect(result.canDelete).toBe(false);
      expect(result.reason).toContain('5つ');
      expect(result.relatedTaskCount).toBe(5);
    });
  });

  describe('SerializedStatusConfig interface', () => {
    it('should serialize status configuration', () => {
      const config: SerializedStatusConfig = {
        statuses: [
          {
            id: 'status-1',
            name: 'To Do',
            displayOrder: 0,
            createdAt: new Date('2024-01-01T00:00:00Z'),
          },
        ],
        metadata: {
          version: '2.0.0',
          createdAt: '2024-01-01T00:00:00Z',
          lastModified: '2024-01-01T12:00:00Z',
        },
      };

      expect(config.statuses).toHaveLength(1);
      expect(config.metadata.version).toBe('2.0.0');
      expect(config.metadata.createdAt).toBeTruthy();
      expect(config.metadata.lastModified).toBeTruthy();
    });
  });
});