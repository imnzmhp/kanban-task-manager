/**
 * StatusReducer - State management logic for custom status operations
 * カスタムタスク状態管理システムのステート管理ロジック
 * 
 * Requirements: 1.1, 2.1, 3.2
 * 
 * このファイルは、カスタムタスク状態の全CRUD操作、並び替え、
 * エラーハンドリング、キャッシュ管理を処理するリデューサーを提供します。
 */

import { 
  StatusState, 
  StatusAction, 
  CustomStatus, 
  ValidationResult, 
  StatusColor 
} from '../types/CustomStatus';

/**
 * StatusReducerの初期状態
 * 既定のstatusesでデモ用データを提供
 */
export const initialStatusState: StatusState = {
  statuses: [
    {
      id: 'default-todo',
      name: 'To Do',
      displayOrder: 0,
      createdAt: new Date('2024-01-01')
    },
    {
      id: 'default-doing',
      name: 'Doing',
      displayOrder: 1,
      createdAt: new Date('2024-01-01')
    },
    {
      id: 'default-done',
      name: 'Done',
      displayOrder: 2,
      createdAt: new Date('2024-01-01')
    }
  ],
  loading: false,
  error: null,
  colorCache: new Map<string, StatusColor>(),
  validationCache: new Map<string, ValidationResult>()
};

/**
 * カスタム状態関連の全ての状態変更を処理するリデューサー関数
 * Redux風のパターンを採用し、不変性を保持しながら状態を更新
 */
export const statusReducer = (state: StatusState, action: StatusAction): StatusState => {
  switch (action.type) {
    case 'LOAD_STATUSES_START':
      return {
        ...state,
        loading: true,
        error: null
      };

    case 'LOAD_STATUSES_SUCCESS':
      return {
        ...state,
        loading: false,
        error: null,
        statuses: action.payload,
        // 新しいステータスリストの読み込み時はキャッシュをクリア
        colorCache: new Map<string, StatusColor>(),
        validationCache: new Map<string, ValidationResult>()
      };

    case 'LOAD_STATUSES_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
        // エラー時は安全な状態にリセット
        statuses: [],
        colorCache: new Map<string, StatusColor>(),
        validationCache: new Map<string, ValidationResult>()
      };

    case 'CREATE_STATUS': {
      const newStatus = action.payload;
      
      return {
        ...state,
        error: null,
        statuses: [...state.statuses, newStatus],
        // 新しいステータス追加時は関連キャッシュを無効化
        colorCache: new Map<string, StatusColor>(),
        validationCache: new Map<string, ValidationResult>()
      };
    }

    case 'UPDATE_STATUS': {
      const { id, updates } = action.payload;
      
      return {
        ...state,
        error: null,
        statuses: state.statuses.map(status =>
          status.id === id
            ? { ...status, ...updates }
            : status
        ),
        // 更新されたステータスのキャッシュをクリア
        colorCache: new Map(Array.from(state.colorCache).filter(([key]) => key !== id)),
        validationCache: new Map<string, ValidationResult>()
      };
    }

    case 'DELETE_STATUS': {
      const statusIdToDelete = action.payload;
      const remainingStatuses = state.statuses.filter(status => status.id !== statusIdToDelete);
      
      // 削除後のdisplayOrderを自動調整（0から始まる連続した整数）
      const reorderedStatuses = remainingStatuses
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((status, index) => ({
          ...status,
          displayOrder: index
        }));
      
      return {
        ...state,
        error: null,
        statuses: reorderedStatuses,
        // 削除時は全キャッシュをクリア（順序変更により色が変わる可能性）
        colorCache: new Map<string, StatusColor>(),
        validationCache: new Map<string, ValidationResult>()
      };
    }

    case 'REORDER_STATUSES': {
      const { fromIndex, toIndex } = action.payload;
      
      // 配列の境界チェック
      if (fromIndex < 0 || fromIndex >= state.statuses.length || 
          toIndex < 0 || toIndex >= state.statuses.length ||
          fromIndex === toIndex) {
        return state;
      }
      
      // 現在の順序でソートされたステータスリストを作成
      const sortedStatuses = [...state.statuses].sort((a, b) => a.displayOrder - b.displayOrder);
      
      // 並び替え実行（配列要素の移動）
      const reorderedStatuses = [...sortedStatuses];
      const [movedStatus] = reorderedStatuses.splice(fromIndex, 1);
      reorderedStatuses.splice(toIndex, 0, movedStatus);
      
      // 新しいdisplayOrderを割り当て（0から始まる連続した整数）
      const updatedStatuses = reorderedStatuses.map((status, index) => ({
        ...status,
        displayOrder: index
      }));
      
      return {
        ...state,
        error: null,
        statuses: updatedStatuses,
        // 並び替え時は位置依存のキャッシュを全クリア
        colorCache: new Map<string, StatusColor>(),
        validationCache: new Map<string, ValidationResult>()
      };
    }

    case 'REORDER_ALL_STATUSES': {
      // Fix display order inconsistencies by reordering all statuses
      const repairedStatuses = validateAndRepairDisplayOrder(state.statuses);
      
      return {
        ...state,
        error: null,
        statuses: repairedStatuses,
        // Clear all caches as positions may have changed
        colorCache: new Map<string, StatusColor>(),
        validationCache: new Map<string, ValidationResult>()
      };
    }

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };

    case 'INVALIDATE_CACHE': {
      const statusId = action.payload;
      
      if (statusId) {
        // 特定のステータスのキャッシュのみ無効化
        const newColorCache = new Map(state.colorCache);
        newColorCache.delete(statusId);
        
        return {
          ...state,
          colorCache: newColorCache,
          // バリデーションキャッシュは名前の変更で影響を受ける可能性があるため全クリア
          validationCache: new Map<string, ValidationResult>()
        };
      } else {
        // 全キャッシュを無効化
        return {
          ...state,
          colorCache: new Map<string, StatusColor>(),
          validationCache: new Map<string, ValidationResult>()
        };
      }
    }

    case 'CLEAR_STATUSES':
      return {
        ...state,
        error: null,
        statuses: [],
        colorCache: new Map<string, StatusColor>(),
        validationCache: new Map<string, ValidationResult>()
      };

    default:
      return state;
  }
};

/**
 * セレクター関数群
 * 状態から特定のデータを取得するためのヘルパー関数
 */

/**
 * 表示順序でソートされたステータスリストを取得
 * @param statuses ステータス配列
 * @returns 表示順序でソートされたステータス配列
 */
export const getStatusesByDisplayOrder = (statuses: CustomStatus[]): CustomStatus[] => {
  return [...statuses].sort((a, b) => a.displayOrder - b.displayOrder);
};

/**
 * IDでステータスを検索
 * @param statuses ステータス配列
 * @param statusId 検索するステータスID
 * @returns 見つかったステータスまたはundefined
 */
export const getStatusById = (statuses: CustomStatus[], statusId: string): CustomStatus | undefined => {
  return statuses.find(status => status.id === statusId);
};

/**
 * 表示位置でステータスを検索
 * @param statuses ステータス配列
 * @param position 表示位置（0から始まる）
 * @returns 指定位置のステータスまたはundefined
 */
export const getStatusByPosition = (statuses: CustomStatus[], position: number): CustomStatus | undefined => {
  const sortedStatuses = getStatusesByDisplayOrder(statuses);
  return sortedStatuses[position];
};

/**
 * 次の表示順序値を取得
 * 新しいステータス作成時に使用
 * @param statuses 現在のステータス配列
 * @returns 次に使用すべきdisplayOrder値
 */
export const getNextDisplayOrder = (statuses: CustomStatus[]): number => {
  if (statuses.length === 0) {
    return 0;
  }
  
  const maxOrder = Math.max(...statuses.map(status => status.displayOrder));
  return maxOrder + 1;
};

/**
 * ステータス名の重複をチェック
 * @param statuses 現在のステータス配列
 * @param name チェックする名前
 * @param excludeId 除外するステータスID（編集時に自分自身を除外）
 * @returns 重複がある場合true
 */
export const hasStatusNameDuplicate = (
  statuses: CustomStatus[], 
  name: string, 
  excludeId?: string
): boolean => {
  const trimmedName = name.trim().toLowerCase();
  
  return statuses.some(status => 
    status.id !== excludeId && 
    status.name.trim().toLowerCase() === trimmedName
  );
};

/**
 * ステータスが削除可能かどうかをチェック
 * （実際のタスク依存関係チェックは上位層で実装）
 * @param statuses 現在のステータス配列
 * @param statusId チェックするステータスID
 * @returns 削除可能性と理由
 */
export const canDeleteStatus = (statuses: CustomStatus[], statusId: string): { canDelete: boolean; reason?: string } => {
  // 最後のステータスの削除を防止
  if (statuses.length <= 1) {
    return {
      canDelete: false,
      reason: '最低1つのステータスが必要です'
    };
  }
  
  // ステータスの存在確認
  const statusExists = statuses.some(status => status.id === statusId);
  if (!statusExists) {
    return {
      canDelete: false,
      reason: '指定されたステータスが見つかりません'
    };
  }
  
  return {
    canDelete: true
  };
};

/**
 * displayOrderの整合性をチェックし、必要に応じて修復
 * @param statuses ステータス配列
 * @returns 修復されたステータス配列
 */
export const validateAndRepairDisplayOrder = (statuses: CustomStatus[]): CustomStatus[] => {
  const sortedStatuses = [...statuses].sort((a, b) => {
    // displayOrderが同じ場合はcreatedAtで決定論的にソート
    if (a.displayOrder === b.displayOrder) {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return a.displayOrder - b.displayOrder;
  });
  
  // 0から始まる連続した整数に再番号付け
  return sortedStatuses.map((status, index) => ({
    ...status,
    displayOrder: index
  }));
};

/**
 * ステータス配列が有効な状態かどうかを検証
 * @param statuses 検証するステータス配列
 * @returns 検証結果
 */
export const validateStatusArray = (statuses: CustomStatus[]): ValidationResult => {
  const errors: Array<{ field: string; message: string; code: string }> = [];
  
  // 空の配列チェック
  if (statuses.length === 0) {
    errors.push({
      field: 'statuses',
      message: '最低1つのステータスが必要です',
      code: 'EMPTY_STATUS_ARRAY'
    });
  }
  
  // ID重複チェック
  const ids = statuses.map(status => status.id);
  const uniqueIds = new Set(ids);
  if (ids.length !== uniqueIds.size) {
    errors.push({
      field: 'statuses',
      message: '重複するIDが検出されました',
      code: 'DUPLICATE_STATUS_ID'
    });
  }
  
  // 名前重複チェック
  const names = statuses.map(status => status.name.trim().toLowerCase());
  const uniqueNames = new Set(names);
  if (names.length !== uniqueNames.size) {
    errors.push({
      field: 'statuses',
      message: '重複する名前が検出されました',
      code: 'DUPLICATE_STATUS_NAME'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};