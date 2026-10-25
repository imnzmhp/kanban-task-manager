/**
 * CustomStatus データモデルのテスト
 * インターフェースとタイプ定義の統合性確認
 */

import { 
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
  SerializedStatusConfig
} from '../../types/CustomStatus';

describe('CustomStatus データモデル', () => {
  describe('基本インターフェースの型チェック', () => {
    test('CustomStatus インターフェースが正しく定義されている', () => {
      const status: CustomStatus = {
        id: 'test-id',
        name: 'Test Status',
        displayOrder: 0,
        createdAt: new Date()
      };
      
      expect(status.id).toBe('test-id');
      expect(status.name).toBe('Test Status');
      expect(status.displayOrder).toBe(0);
      expect(status.createdAt).toBeInstanceOf(Date);
    });

    test('StatusColor インターフェースが正しく定義されている', () => {
      const color: StatusColor = {
        backgroundColor: '#f0f8ff',
        accentColor: '#1e90ff',
        contrastRatio: 5.2
      };
      
      expect(color.backgroundColor).toBe('#f0f8ff');
      expect(color.accentColor).toBe('#1e90ff');
      expect(color.contrastRatio).toBe(5.2);
    });

    test('ValidationResult インターフェースが正しく定義されている', () => {
      const validResult: ValidationResult = {
        isValid: true,
        errors: []
      };
      
      const invalidResult: ValidationResult = {
        isValid: false,
        errors: [
          {
            field: 'name',
            message: 'エラーメッセージ',
            code: 'ERROR_CODE'
          }
        ]
      };
      
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toHaveLength(1);
    });
  });

  describe('拡張データ型の定義', () => {
    test('StoredDataV2 が正しく拡張されている', () => {
      const storedData: StoredDataV2 = {
        version: '2.0.0',
        tasks: [],
        customStatuses: [
          {
            id: 'status-1',
            name: 'Custom Status',
            displayOrder: 0,
            createdAt: new Date()
          }
        ],
        migrationInfo: {
          migratedFrom: '1.0.0',
          migratedAt: new Date().toISOString(),
          backupKey: 'backup-key-123'
        }
      };
      
      expect(storedData.version).toBe('2.0.0');
      expect(storedData.customStatuses).toBeDefined();
      expect(storedData.migrationInfo).toBeDefined();
    });

    test('TaskV2 が正しく定義されている', () => {
      const taskV2: TaskV2 = {
        id: 'task-1',
        title: 'Test Task',
        description: 'Test Description',
        statusId: 'status-1', // statusの代わりにstatusIdを使用
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      expect(taskV2.statusId).toBe('status-1');
      expect(taskV2).not.toHaveProperty('status'); // 古いstatusプロパティがないことを確認
    });
  });

  describe('状態管理の型定義', () => {
    test('StatusState が正しく定義されている', () => {
      const state: StatusState = {
        statuses: [],
        loading: false,
        error: null,
        colorCache: new Map(),
        validationCache: new Map()
      };
      
      expect(state.statuses).toBeDefined();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.colorCache).toBeInstanceOf(Map);
      expect(state.validationCache).toBeInstanceOf(Map);
    });

    test('StatusAction の全タイプが定義されている', () => {
      const loadStart: StatusAction = { type: 'LOAD_STATUSES_START' };
      const loadSuccess: StatusAction = { 
        type: 'LOAD_STATUSES_SUCCESS', 
        payload: [] 
      };
      const loadError: StatusAction = { 
        type: 'LOAD_STATUSES_ERROR', 
        payload: 'エラーメッセージ' 
      };
      const create: StatusAction = { 
        type: 'CREATE_STATUS', 
        payload: {
          id: 'new-id',
          name: 'New Status',
          displayOrder: 0,
          createdAt: new Date()
        }
      };
      const update: StatusAction = { 
        type: 'UPDATE_STATUS', 
        payload: { id: 'id', updates: { name: 'Updated' } } 
      };
      const deleteAction: StatusAction = { 
        type: 'DELETE_STATUS', 
        payload: 'delete-id' 
      };
      const reorder: StatusAction = { 
        type: 'REORDER_STATUSES', 
        payload: { fromIndex: 0, toIndex: 1 } 
      };
      const clearError: StatusAction = { type: 'CLEAR_ERROR' };
      const invalidateCache: StatusAction = { 
        type: 'INVALIDATE_CACHE', 
        payload: 'cache-key' 
      };
      
      // 全てのアクションが正しく型定義されていることを確認
      expect(loadStart.type).toBe('LOAD_STATUSES_START');
      expect(loadSuccess.type).toBe('LOAD_STATUSES_SUCCESS');
      expect(loadError.type).toBe('LOAD_STATUSES_ERROR');
      expect(create.type).toBe('CREATE_STATUS');
      expect(update.type).toBe('UPDATE_STATUS');
      expect(deleteAction.type).toBe('DELETE_STATUS');
      expect(reorder.type).toBe('REORDER_STATUSES');
      expect(clearError.type).toBe('CLEAR_ERROR');
      expect(invalidateCache.type).toBe('INVALIDATE_CACHE');
    });
  });

  describe('ユーティリティ型の定義', () => {
    test('TruncatedDisplayResult が正しく定義されている', () => {
      const result: TruncatedDisplayResult = {
        displayText: '短縮テキスト...',
        shouldShowTooltip: true,
        fullText: '完全な長いテキストがここに表示されます'
      };
      
      expect(result.displayText).toBeDefined();
      expect(result.shouldShowTooltip).toBe(true);
      expect(result.fullText).toBeDefined();
    });

    test('DeletionCheckResult が正しく定義されている', () => {
      const cannotDelete: DeletionCheckResult = {
        canDelete: false,
        reason: '関連するタスクが存在します',
        relatedTaskCount: 5
      };
      
      const canDelete: DeletionCheckResult = {
        canDelete: true
      };
      
      expect(cannotDelete.canDelete).toBe(false);
      expect(cannotDelete.reason).toBeDefined();
      expect(cannotDelete.relatedTaskCount).toBe(5);
      expect(canDelete.canDelete).toBe(true);
    });

    test('SerializedStatusConfig が正しく定義されている', () => {
      const config: SerializedStatusConfig = {
        statuses: [],
        metadata: {
          version: '2.0.0',
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString()
        }
      };
      
      expect(config.statuses).toBeDefined();
      expect(config.metadata.version).toBe('2.0.0');
      expect(config.metadata.createdAt).toBeDefined();
      expect(config.metadata.lastModified).toBeDefined();
    });
  });

  describe('型の互換性チェック', () => {
    test('既存のTaskとTaskV2の互換性', () => {
      // TaskV2がTaskの適切な拡張であることを確認
      const taskV2: TaskV2 = {
        id: 'task-1',
        title: 'Test Task',
        description: 'Description',
        statusId: 'status-id',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // 基本プロパティが存在することを確認
      expect(taskV2.id).toBeDefined();
      expect(taskV2.title).toBeDefined();
      expect(taskV2.statusId).toBeDefined(); // 新しいプロパティ
    });

    test('ValidationError の詳細構造', () => {
      const error: ValidationError = {
        field: 'name',
        message: 'ユーザーフレンドリーなメッセージ',
        code: 'PROGRAMMATIC_ERROR_CODE'
      };
      
      expect(error.field).toBe('name');
      expect(error.message).toBeDefined();
      expect(error.code).toBeDefined();
    });
  });

  describe('Date型の処理', () => {
    test('createdAt フィールドがDate型として正しく動作する', () => {
      const now = new Date();
      const status: CustomStatus = {
        id: 'test',
        name: 'Test',
        displayOrder: 0,
        createdAt: now
      };
      
      expect(status.createdAt).toBeInstanceOf(Date);
      expect(status.createdAt.getTime()).toBe(now.getTime());
    });
  });
});