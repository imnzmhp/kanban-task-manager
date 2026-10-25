/**
 * Migration System for Custom Task Status Manager
 * カスタムタスク状態管理システムのデータ移行システム
 * Enhanced with comprehensive error handling using SystemError framework
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 16.2
 * 
 * このファイルは、v1からv2への自動データ移行、バックアップ作成、
 * データ整合性チェック、エラーリカバリを提供します。
 */

import { Task, StoredData, TaskStatus } from '../types/Task';
import { 
  CustomStatus, 
  StoredDataV2, 
  TaskV2, 
  ValidationResult 
} from '../types/CustomStatus';
import { StatusRepository } from './TaskRepository';

/**
 * マイグレーション結果
 */
export interface MigrationResult {
  success: boolean;
  migratedStatuses: CustomStatus[];
  updatedTasks: TaskV2[];
  errors: MigrationError[];
  backupCreated: boolean;
  backupKey?: string;
}

/**
 * マイグレーションエラー
 */
export interface MigrationError {
  type: 'warning' | 'error' | 'critical';
  message: string;
  code: string;
  context?: Record<string, unknown>;
}

/**
 * レガシーデータ検出結果
 */
interface LegacyDataDetection {
  hasLegacyData: boolean;
  version: string;
  taskCount: number;
  needsMigration: boolean;
}

/**
 * MigrationSystem - v1からv2への自動データ移行システム
 * 
 * このクラスは以下の機能を提供します：
 * - レガシーデータの検出と分析
 * - 安全なv1→v2データ変換
 * - 自動バックアップ作成
 * - データ整合性の検証と修復
 * - エラーハンドリングとロールバック
 */
export class MigrationSystem {
  /** レガシーデータのキー */
  private static readonly LEGACY_DATA_KEY = 'kanban-tasks';
  
  /** マイグレーション完了フラグのキー */
  private static readonly MIGRATION_FLAG_KEY = 'kanban-migration-completed';
  
  /** デフォルトの状態マッピング（v1 → v2） */
  private static readonly DEFAULT_STATUS_MAPPING: Record<TaskStatus, CustomStatus> = {
    'TODO': {
      id: 'migrated-todo',
      name: 'TODO',
      displayOrder: 0,
      createdAt: new Date('2024-01-01T00:00:00Z')
    },
    'DOING': {
      id: 'migrated-doing',
      name: 'DOING',
      displayOrder: 1,
      createdAt: new Date('2024-01-01T00:00:00Z')
    },
    'DONE': {
      id: 'migrated-done',
      name: 'DONE',
      displayOrder: 2,
      createdAt: new Date('2024-01-01T00:00:00Z')
    }
  };

  /**
   * 自動マイグレーションを実行
   * アプリケーション起動時に呼び出される
   * 
   * @returns マイグレーション結果
   */
  static async migrateToV2(): Promise<MigrationResult> {
    const errors: MigrationError[] = [];

    try {
      // 1. レガシーデータの検出
      const detection = this.detectLegacyData();
      
      if (!detection.hasLegacyData) {
        // レガシーデータが存在しない場合はデフォルト状態を作成
        return this.createDefaultStatuses();
      }

      if (!detection.needsMigration) {
        // すでに移行済みの場合
        return this.loadExistingV2Data();
      }

      // 2. バックアップ作成
      const backupKey = await this.createBackup();

      // 3. レガシーデータの読み込み
      const legacyData = this.loadLegacyData();
      if (!legacyData) {
        throw new Error('Failed to load legacy data');
      }

      // 4. v1状態をv2カスタム状態に変換
      const migratedStatuses = this.convertLegacyStatuses();

      // 5. v1タスクをv2タスクに変換（レガシー形式のタスクのみを対象にする）
      const legacyTasks = legacyData.tasks.filter(
        (task): task is Task => !('statusId' in task)
      );
      const updatedTasks = this.convertLegacyTasks(legacyTasks, migratedStatuses);

      // 6. データ整合性チェック
      const validationResult = this.validateMigratedData(migratedStatuses, updatedTasks);
      if (!validationResult.isValid) {
        errors.push({
          type: 'warning',
          message: 'Data validation issues found during migration',
          code: 'VALIDATION_WARNING',
          context: { errors: validationResult.errors }
        });
      }

      // 7. v2データの保存
      await this.saveV2Data(migratedStatuses, updatedTasks);

      // 8. 移行完了フラグを設定
      this.markMigrationCompleted();

      return {
        success: true,
        migratedStatuses,
        updatedTasks,
        errors,
        backupCreated: true,
        backupKey
      };

    } catch (error) {
      errors.push({
        type: 'critical',
        message: error instanceof Error ? error.message : 'Unknown migration error',
        code: 'MIGRATION_FAILED',
        context: { error }
      });

      // 失敗時はデフォルト状態を作成
      const defaultResult = await this.createDefaultStatuses();
      return {
        ...defaultResult,
        errors: [...defaultResult.errors, ...errors],
        success: false
      };
    }
  }

  /**
   * レガシーデータの検出
   */
  private static detectLegacyData(): LegacyDataDetection {
    try {
      const data = localStorage.getItem(this.LEGACY_DATA_KEY);
      const migrationFlag = localStorage.getItem(this.MIGRATION_FLAG_KEY);

      if (!data) {
        return {
          hasLegacyData: false,
          version: '0.0.0',
          taskCount: 0,
          needsMigration: false
        };
      }

      const parsed = JSON.parse(data);
      const version = parsed.version || '1.0.0';
      const taskCount = parsed.tasks ? parsed.tasks.length : 0;
      const needsMigration = migrationFlag !== 'true';

      return {
        hasLegacyData: true,
        version,
        taskCount,
        needsMigration
      };
    } catch (error) {
      return {
        hasLegacyData: false,
        version: '0.0.0',
        taskCount: 0,
        needsMigration: false
      };
    }
  }

  /**
   * レガシーデータの読み込み
   */
  private static loadLegacyData(): StoredData | null {
    try {
      const data = localStorage.getItem(this.LEGACY_DATA_KEY);
      if (!data) return null;

      const parsed = JSON.parse(data);
      
      // 基本的な検証
      if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
        throw new Error('Invalid legacy data structure');
      }

      return parsed as StoredData;
    } catch (error) {
      console.warn('Failed to load legacy data:', error);
      return null;
    }
  }

  /**
   * レガシー状態をカスタム状態に変換
   */
  private static convertLegacyStatuses(): CustomStatus[] {
    return Object.values(this.DEFAULT_STATUS_MAPPING);
  }

  /**
   * レガシータスクをv2タスクに変換
   */
  private static convertLegacyTasks(
    legacyTasks: Task[], 
    migratedStatuses: CustomStatus[]
  ): TaskV2[] {
    const statusMapping = this.createStatusIdMapping(migratedStatuses);

    return legacyTasks.map(task => {
      const statusId = statusMapping[task.status] || migratedStatuses[0].id;

      return {
        id: task.id,
        title: task.title,
        description: task.description,
        statusId,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      };
    });
  }

  /**
   * 状態IDマッピングを作成
   */
  private static createStatusIdMapping(migratedStatuses: CustomStatus[]): Record<TaskStatus, string> {
    const mapping: Record<TaskStatus, string> = {} as Record<TaskStatus, string>;

    migratedStatuses.forEach(status => {
      if (status.name === 'TODO') {
        mapping['TODO'] = status.id;
      } else if (status.name === 'DOING') {
        mapping['DOING'] = status.id;
      } else if (status.name === 'DONE') {
        mapping['DONE'] = status.id;
      }
    });

    return mapping;
  }

  /**
   * 移行データの検証
   */
  private static validateMigratedData(
    statuses: CustomStatus[], 
    tasks: TaskV2[]
  ): ValidationResult {
    const errors: Array<{ field: string; message: string; code: string }> = [];

    // 状態の検証
    if (statuses.length === 0) {
      errors.push({
        field: 'statuses',
        message: '移行された状態が空です',
        code: 'EMPTY_MIGRATED_STATUSES'
      });
    }

    // タスクの状態参照検証
    const statusIds = new Set(statuses.map(s => s.id));
    tasks.forEach((task, index) => {
      if (!statusIds.has(task.statusId)) {
        errors.push({
          field: `tasks[${index}].statusId`,
          message: `無効な状態参照: ${task.statusId}`,
          code: 'INVALID_STATUS_REFERENCE'
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * v2データの保存
   */
  private static async saveV2Data(
    statuses: CustomStatus[], 
    tasks: TaskV2[]
  ): Promise<void> {
    try {
      // 状態設定を保存
      await StatusRepository.saveStatusConfig(statuses);

      // タスクデータをv2形式で保存
      const v2Data: StoredDataV2 = {
        version: '2.0.0',
        tasks: tasks as any[], // TaskV2をTaskにキャスト（一時的な互換性）
        lastSaved: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        customStatuses: statuses,
        migrationInfo: {
          migratedFrom: '1.0.0',
          migratedAt: new Date().toISOString(),
          backupKey: `${Date.now()}`
        }
      };

      localStorage.setItem('kanban-tasks-v2', JSON.stringify(v2Data));
    } catch (error) {
      throw new Error(`Failed to save v2 data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * バックアップ作成
   */
  private static async createBackup(): Promise<string> {
    try {
      const data = localStorage.getItem(this.LEGACY_DATA_KEY);
      if (!data) {
        throw new Error('No legacy data to backup');
      }

      const backupKey = `kanban-tasks-backup-${Date.now()}`;
      localStorage.setItem(backupKey, data);

      return backupKey;
    } catch (error) {
      throw new Error(`Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * デフォルト状態を作成
   */
  private static async createDefaultStatuses(): Promise<MigrationResult> {
    try {
      const defaultStatuses = Object.values(this.DEFAULT_STATUS_MAPPING);
      await StatusRepository.saveStatusConfig(defaultStatuses);

      return {
        success: true,
        migratedStatuses: defaultStatuses,
        updatedTasks: [],
        errors: [],
        backupCreated: false
      };
    } catch (error) {
      return {
        success: false,
        migratedStatuses: [],
        updatedTasks: [],
        errors: [{
          type: 'critical',
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'DEFAULT_CREATION_FAILED'
        }],
        backupCreated: false
      };
    }
  }

  /**
   * 既存のv2データを読み込み
   */
  private static async loadExistingV2Data(): Promise<MigrationResult> {
    try {
      const statusConfig = await StatusRepository.loadStatusConfig();

      return {
        success: true,
        migratedStatuses: statusConfig.statuses,
        updatedTasks: [],
        errors: [],
        backupCreated: false
      };
    } catch (error) {
      return {
        success: false,
        migratedStatuses: [],
        updatedTasks: [],
        errors: [{
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'V2_DATA_LOAD_FAILED'
        }],
        backupCreated: false
      };
    }
  }

  /**
   * 移行完了フラグを設定
   */
  private static markMigrationCompleted(): void {
    localStorage.setItem(this.MIGRATION_FLAG_KEY, 'true');
  }

  /**
   * 移行のロールバック
   */
  static async rollbackMigration(backupKey: string): Promise<boolean> {
    try {
      const backup = localStorage.getItem(backupKey);
      if (!backup) {
        throw new Error(`Backup not found: ${backupKey}`);
      }

      // レガシーデータを復元
      localStorage.setItem(this.LEGACY_DATA_KEY, backup);

      // v2データとフラグを削除
      localStorage.removeItem('kanban-tasks-v2');
      localStorage.removeItem('kanban-custom-statuses');
      localStorage.removeItem(this.MIGRATION_FLAG_KEY);

      return true;
    } catch (error) {
      console.error('Migration rollback failed:', error);
      return false;
    }
  }

  /**
   * 移行状態の確認
   */
  static getMigrationStatus(): {
    isV2: boolean;
    hasLegacyData: boolean;
    migrationCompleted: boolean;
    lastMigration?: string;
  } {
    const migrationFlag = localStorage.getItem(this.MIGRATION_FLAG_KEY);
    const v2Data = localStorage.getItem('kanban-tasks-v2');
    const legacyData = localStorage.getItem(this.LEGACY_DATA_KEY);

    let lastMigration: string | undefined;
    if (v2Data) {
      try {
        const parsed = JSON.parse(v2Data);
        lastMigration = parsed.migrationInfo?.migratedAt;
      } catch {
        // Ignore parsing errors
      }
    }

    return {
      isV2: Boolean(v2Data),
      hasLegacyData: Boolean(legacyData),
      migrationCompleted: migrationFlag === 'true',
      lastMigration
    };
  }
}
