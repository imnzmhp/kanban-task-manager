/**
 * Status Serialization Service for Custom Task Status Manager
 * カスタムタスク状態管理システムのシリアライゼーションサービス
 * 
 * Requirements: 10.1, 10.4, 10.5
 * 
 * このファイルは、カスタム状態設定のシリアライゼーション/デシリアライゼーション、
 * バージョンメタデータの管理、エラーハンドリングを提供します。
 */

import { 
  CustomStatus, 
  SerializedStatusConfig, 
  ValidationResult 
} from '../types/CustomStatus';

/**
 * シリアライゼーション結果
 */
interface SerializationResult {
  success: boolean;
  data?: string;
  error?: string;
}

/**
 * デシリアライゼーション結果
 */
interface DeserializationResult {
  success: boolean;
  data?: SerializedStatusConfig;
  error?: string;
}

/**
 * StatusSerializer - カスタム状態設定のシリアライゼーション管理
 * 
 * このクラスは以下の機能を提供します：
 * - JSON形式でのシリアライゼーション/デシリアライゼーション
 * - バージョンメタデータの管理
 * - ラウンドトリップ特性の保証
 * - エラーハンドリングとフォールバック
 */
export class StatusSerializer {
  /** 現在のシリアライゼーションバージョン */
  private static readonly CURRENT_VERSION = '2.0.0';
  
  /** デフォルトの状態設定（フォールバック用） */
  private static readonly DEFAULT_STATUSES: CustomStatus[] = [
    {
      id: 'default-todo',
      name: 'TODO',
      displayOrder: 0,
      createdAt: new Date()
    },
    {
      id: 'default-doing',
      name: 'DOING',
      displayOrder: 1,
      createdAt: new Date()
    },
    {
      id: 'default-done',
      name: 'DONE',
      displayOrder: 2,
      createdAt: new Date()
    }
  ];

  /**
   * カスタム状態設定をJSON文字列にシリアライゼーション
   * 
   * @param statuses シリアライゼーションする状態リスト
   * @returns シリアライゼーション結果
   */
  static serialize(statuses: CustomStatus[]): SerializationResult {
    try {
      // 状態配列の検証
      const validation = this.validateStatusesForSerialization(statuses);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.map(e => e.message).join(', ')}`
        };
      }

      // シリアライゼーション用設定を作成
      const config: SerializedStatusConfig = {
        statuses: this.normalizeStatusesForSerialization(statuses),
        metadata: {
          version: this.CURRENT_VERSION,
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString()
        }
      };

      // JSON文字列に変換
      const jsonString = JSON.stringify(config, null, 2);

      return {
        success: true,
        data: jsonString
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown serialization error'
      };
    }
  }

  /**
   * JSON文字列からカスタム状態設定をデシリアライゼーション
   * 
   * @param jsonString デシリアライゼーションするJSON文字列
   * @returns デシリアライゼーション結果
   */
  static deserialize(jsonString: string): DeserializationResult {
    try {
      // JSON解析
      const parsed = JSON.parse(jsonString);
      
      // 基本構造の検証
      if (!this.isValidSerializedConfig(parsed)) {
        throw new Error('Invalid serialized config structure');
      }

      // バージョン互換性チェック
      const version = parsed.metadata?.version || '1.0.0';
      if (!this.isCompatibleVersion(version)) {
        throw new Error(`Unsupported version: ${version}`);
      }

      // 状態リストの復元
      const restoredStatuses = this.restoreStatusesFromSerialized(parsed.statuses);
      
      // 復元されたデータの検証
      const validation = this.validateStatusesForSerialization(restoredStatuses);
      if (!validation.isValid) {
        throw new Error(`Restored data validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      const result: SerializedStatusConfig = {
        statuses: restoredStatuses,
        metadata: {
          version: this.CURRENT_VERSION,
          createdAt: parsed.metadata?.createdAt || new Date().toISOString(),
          lastModified: new Date().toISOString()
        }
      };

      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown deserialization error'
      };
    }
  }

  /**
   * デフォルトの状態設定を取得
   * デシリアライゼーションが失敗した場合のフォールバック
   * 
   * @returns デフォルトの状態設定
   */
  static getDefaultConfig(): SerializedStatusConfig {
    return {
      statuses: [...this.DEFAULT_STATUSES],
      metadata: {
        version: this.CURRENT_VERSION,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    };
  }

  /**
   * ラウンドトリップテスト（シリアライゼーション→デシリアライゼーション）
   * 正確性プロパティの検証用
   * 
   * @param statuses テスト対象の状態リスト
   * @returns ラウンドトリップが成功したかどうか
   */
  static testRoundTrip(statuses: CustomStatus[]): boolean {
    try {
      // シリアライゼーション
      const serialized = this.serialize(statuses);
      if (!serialized.success || !serialized.data) {
        return false;
      }

      // デシリアライゼーション
      const deserialized = this.deserialize(serialized.data);
      if (!deserialized.success || !deserialized.data) {
        return false;
      }

      // 元データと復元データの比較
      return this.areStatusesEquivalent(statuses, deserialized.data.statuses);
    } catch {
      return false;
    }
  }

  /**
   * シリアライゼーション用の状態配列検証
   */
  private static validateStatusesForSerialization(statuses: CustomStatus[]): ValidationResult {
    const errors: Array<{ field: string; message: string; code: string }> = [];

    // 最低1つの状態が必要
    if (statuses.length === 0) {
      errors.push({
        field: 'statuses',
        message: '最低1つのステータスが必要です',
        code: 'EMPTY_STATUS_ARRAY'
      });
    }

    // ID重複チェック
    const ids = statuses.map(s => s.id);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      errors.push({
        field: 'statuses',
        message: 'ステータスIDに重複があります',
        code: 'DUPLICATE_STATUS_ID'
      });
    }

    // 名前重複チェック
    const names = statuses.map(s => s.name.trim().toLowerCase());
    const uniqueNames = new Set(names);
    if (names.length !== uniqueNames.size) {
      errors.push({
        field: 'statuses',
        message: 'ステータス名に重複があります',
        code: 'DUPLICATE_STATUS_NAME'
      });
    }

    // 各ステータスの基本検証
    statuses.forEach((status, index) => {
      if (!status.id || status.id.trim() === '') {
        errors.push({
          field: `statuses[${index}].id`,
          message: `ステータスID（位置${index}）が空です`,
          code: 'EMPTY_STATUS_ID'
        });
      }

      if (!status.name || status.name.trim() === '') {
        errors.push({
          field: `statuses[${index}].name`,
          message: `ステータス名（位置${index}）が空です`,
          code: 'EMPTY_STATUS_NAME'
        });
      }

      if (typeof status.displayOrder !== 'number') {
        errors.push({
          field: `statuses[${index}].displayOrder`,
          message: `displayOrder（位置${index}）が数値ではありません`,
          code: 'INVALID_DISPLAY_ORDER'
        });
      }

      if (!(status.createdAt instanceof Date) && typeof status.createdAt !== 'string') {
        errors.push({
          field: `statuses[${index}].createdAt`,
          message: `createdAt（位置${index}）が無効な日付です`,
          code: 'INVALID_CREATED_AT'
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * シリアライゼーション用に状態を正規化
   */
  private static normalizeStatusesForSerialization(statuses: CustomStatus[]): CustomStatus[] {
    return statuses.map(status => ({
      ...status,
      name: status.name.trim(),
      createdAt: status.createdAt instanceof Date ? status.createdAt : new Date(status.createdAt)
    }));
  }

  /**
   * シリアライゼーション設定の構造検証
   */
  private static isValidSerializedConfig(obj: any): obj is SerializedStatusConfig {
    return (
      obj &&
      typeof obj === 'object' &&
      Array.isArray(obj.statuses) &&
      obj.metadata &&
      typeof obj.metadata === 'object' &&
      typeof obj.metadata.version === 'string'
    );
  }

  /**
   * バージョン互換性チェック
   */
  private static isCompatibleVersion(version: string): boolean {
    const supportedVersions = ['1.0.0', '2.0.0'];
    return supportedVersions.includes(version);
  }

  /**
   * シリアライゼーションされた状態を復元
   */
  private static restoreStatusesFromSerialized(serializedStatuses: any[]): CustomStatus[] {
    return serializedStatuses.map(status => ({
      id: status.id,
      name: status.name,
      displayOrder: status.displayOrder,
      createdAt: new Date(status.createdAt)
    }));
  }

  /**
   * 2つの状態配列が等価かどうかを比較
   * ラウンドトリップテスト用
   */
  private static areStatusesEquivalent(
    original: CustomStatus[], 
    restored: CustomStatus[]
  ): boolean {
    if (original.length !== restored.length) {
      return false;
    }

    // displayOrderでソートして比較
    const sortedOriginal = [...original].sort((a, b) => a.displayOrder - b.displayOrder);
    const sortedRestored = [...restored].sort((a, b) => a.displayOrder - b.displayOrder);

    return sortedOriginal.every((originalStatus, index) => {
      const restoredStatus = sortedRestored[index];
      
      return (
        originalStatus.id === restoredStatus.id &&
        originalStatus.name === restoredStatus.name &&
        originalStatus.displayOrder === restoredStatus.displayOrder &&
        Math.abs(originalStatus.createdAt.getTime() - restoredStatus.createdAt.getTime()) < 1000 // 1秒の誤差許容
      );
    });
  }

  /**
   * デバッグ用：シリアライゼーション詳細情報を取得
   */
  static getSerializationInfo(statuses: CustomStatus[]): {
    statusCount: number;
    estimatedSize: string;
    version: string;
    isValid: boolean;
  } {
    const serialized = this.serialize(statuses);
    const estimatedSizeBytes = serialized.data ? new Blob([serialized.data]).size : 0;
    
    return {
      statusCount: statuses.length,
      estimatedSize: `${estimatedSizeBytes} bytes`,
      version: this.CURRENT_VERSION,
      isValid: serialized.success
    };
  }
}
