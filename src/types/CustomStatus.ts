/**
 * Custom Status Data Models for the Kanban Task Manager
 * カスタムタスク状態管理システムのデータモデル
 * 
 * Requirements: 1.1, 1.2, 10.1
 * 
 * このファイルは、カスタムタスク状態管理システムの基盤となるデータ構造を定義します。
 * 既存のTask.tsとの互換性を保ちながら、拡張可能な状態管理を実現します。
 */

import { Task, StoredData } from './Task';

/**
 * カスタム状態のコアインターフェース
 * ユーザーが定義可能なタスク状態を表現します
 */
export interface CustomStatus {
  /** UUID形式の一意識別子 */
  id: string;
  
  /** 状態名（1-50文字の制限） */
  name: string;
  
  /** 表示順序（0から始まる整数、カンバンボードでの列順序を決定） */
  displayOrder: number;
  
  /** 作成日時 */
  createdAt: Date;
}

/**
 * 状態の視覚的色情報
 * LAB色空間を用いた位置ベースの色生成により、WCAG AA準拠のコントラスト比を保証
 */
export interface StatusColor {
  /** 背景色（HEX形式、例: "#f0f8ff"） */
  backgroundColor: string;
  
  /** アクセント色（HEX形式、例: "#1e90ff"） */
  accentColor: string;
  
  /** コントラスト比（4.5以上でWCAG AA準拠） */
  contrastRatio: number;
}

/**
 * バリデーション結果
 * 状態名やその他の入力値の検証結果を表現
 */
export interface ValidationResult {
  /** バリデーションが成功したかどうか */
  isValid: boolean;
  
  /** エラーメッセージのリスト */
  errors: ValidationError[];
}

/**
 * バリデーションエラーの詳細情報
 */
export interface ValidationError {
  /** エラーが発生したフィールド名 */
  field: string;
  
  /** ユーザーフレンドリーなエラーメッセージ */
  message: string;
  
  /** プログラム的に処理可能なエラーコード */
  code: string;
}

/**
 * v2形式の拡張されたストレージデータ
 * 既存のStoredDataを拡張し、カスタム状態とマイグレーション情報を追加
 */
export interface StoredDataV2 extends Omit<StoredData, 'version'> {
  /** データフォーマットバージョン */
  version: '2.0.0';
  
  /** カスタム状態のリスト */
  customStatuses: CustomStatus[];
  
  /** 最終更新日時 */
  lastModified: string;
  
  /** マイグレーション情報（v1からの移行時に設定） */
  migrationInfo?: {
    /** 移行元のバージョン */
    migratedFrom: string;
    
    /** 移行実行日時 */
    migratedAt: string;
    
    /** バックアップデータのキー */
    backupKey: string;
  };
}

/**
 * v2形式のタスク
 * statusフィールドをstatusIdに変更し、CustomStatusへの参照に変更
 */
export interface TaskV2 extends Omit<Task, 'status'> {
  /** カスタム状態のIDを参照 */
  statusId: string;
}

/**
 * 状態管理のコンテキスト状態
 * Redux風のステート管理で使用される状態構造
 */
export interface StatusState {
  /** カスタム状態のリスト */
  statuses: CustomStatus[];
  
  /** ローディング状態 */
  loading: boolean;
  
  /** エラーメッセージ（nullの場合はエラーなし） */
  error: string | null;
  
  /** 色キャッシュ（パフォーマンス最適化のため） */
  colorCache: Map<string, StatusColor>;
  
  /** バリデーションキャッシュ（繰り返し検証の最適化） */
  validationCache: Map<string, ValidationResult>;
}

/**
 * 状態管理のアクション
 * StatusReducerで処理される全てのアクション型
 */
export type StatusAction =
  | { type: 'LOAD_STATUSES_START' }
  | { type: 'LOAD_STATUSES_SUCCESS'; payload: CustomStatus[] }
  | { type: 'LOAD_STATUSES_ERROR'; payload: string }
  | { type: 'CREATE_STATUS'; payload: CustomStatus }
  | { type: 'UPDATE_STATUS'; payload: { id: string; updates: Partial<CustomStatus> } }
  | { type: 'DELETE_STATUS'; payload: string }
  | { type: 'REORDER_STATUSES'; payload: { fromIndex: number; toIndex: number } }
  | { type: 'REORDER_ALL_STATUSES' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'INVALIDATE_CACHE'; payload?: string }
  | { type: 'CLEAR_STATUSES' };

/**
 * 切り詰め表示の結果
 * レスポンシブな状態名表示で使用
 */
export interface TruncatedDisplayResult {
  /** 表示用のテキスト（切り詰められている可能性がある） */
  displayText: string;
  
  /** ツールチップを表示すべきかどうか */
  shouldShowTooltip: boolean;
  
  /** 完全なテキスト（ツールチップ用） */
  fullText: string;
}

/**
 * 削除可能性チェックの結果
 * 状態削除時の依存関係チェックで使用
 */
export interface DeletionCheckResult {
  /** 削除可能かどうか */
  canDelete: boolean;
  
  /** 削除できない場合の理由 */
  reason?: string;
  
  /** 関連するタスク数 */
  relatedTaskCount?: number;
}

/**
 * StatusContextのコンテキスト値
 * StatusProviderが提供する状態と操作のインターフェース
 */
export interface StatusContextValue {
  /** カスタム状態のリスト */
  statuses: CustomStatus[];

  /** ローディング状態 */
  loading: boolean;

  /** エラーメッセージ（nullの場合はエラーなし） */
  error: string | null;

  /** 新しい状態を作成 */
  createStatus: (name: string) => Promise<CustomStatus>;

  /** 既存の状態を更新 */
  updateStatus: (id: string, updates: Partial<CustomStatus>) => Promise<void>;

  /** 状態を削除 */
  deleteStatus: (id: string) => Promise<void>;

  /** 状態の表示順序を変更 */
  reorderStatuses: (fromIndex: number, toIndex: number) => Promise<void>;

  /** 全状態をクリア（デモ用） */
  clearStatuses: () => Promise<void>;

  /** IDで状態を取得 */
  getStatusById: (id: string) => CustomStatus | undefined;

  /** 状態の色情報を取得 */
  getColorForStatus: (statusId: string) => StatusColor;

  /** 状態が削除可能かチェック */
  canDeleteStatus: (id: string) => DeletionCheckResult;
}

/**
 * 状態設定のシリアライゼーション用インターフェース
 * ローカルストレージへの保存・読み込み用
 */
export interface SerializedStatusConfig {
  /** 状態リスト */
  statuses: CustomStatus[];
  
  /** メタデータ */
  metadata: {
    version: string;
    createdAt: string;
    lastModified: string;
  };
}