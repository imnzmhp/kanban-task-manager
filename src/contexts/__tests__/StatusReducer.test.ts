/**
 * StatusReducer Tests
 * カスタムタスク状態管理システムのリデューサーテスト
 * 
 * Requirements: 1.1, 2.1, 3.2
 */

import {
  statusReducer,
  initialStatusState,
  getStatusesByDisplayOrder,
  getStatusById,
  getStatusByPosition,
  getNextDisplayOrder,
  hasStatusNameDuplicate,
  canDeleteStatus,
  validateAndRepairDisplayOrder,
  validateStatusArray
} from '../StatusReducer';
import { CustomStatus, StatusAction, StatusState } from '../../types/CustomStatus';

// テスト用のモックデータ
const mockStatus1: CustomStatus = {
  id: '1',
  name: 'TODO',
  displayOrder: 0,
  createdAt: new Date('2023-01-01')
};

const mockStatus2: CustomStatus = {
  id: '2',
  name: 'DOING',
  displayOrder: 1,
  createdAt: new Date('2023-01-02')
};

const mockStatus3: CustomStatus = {
  id: '3',
  name: 'DONE',
  displayOrder: 2,
  createdAt: new Date('2023-01-03')
};

const mockStatuses = [mockStatus1, mockStatus2, mockStatus3];

describe('StatusReducer', () => {
  describe('Initial State', () => {
    it('should have correct initial state', () => {
      expect(initialStatusState).toEqual({
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
        colorCache: new Map(),
        validationCache: new Map()
      });
    });
  });

  describe('LOAD_STATUSES Actions', () => {
    it('should handle LOAD_STATUSES_START', () => {
      const action: StatusAction = { type: 'LOAD_STATUSES_START' };
      const state = statusReducer(initialStatusState, action);

      expect(state.loading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should handle LOAD_STATUSES_SUCCESS', () => {
      const action: StatusAction = {
        type: 'LOAD_STATUSES_SUCCESS',
        payload: mockStatuses
      };
      const state = statusReducer(initialStatusState, action);

      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
      expect(state.statuses).toEqual(mockStatuses);
      expect(state.colorCache).toEqual(new Map());
      expect(state.validationCache).toEqual(new Map());
    });

    it('should handle LOAD_STATUSES_ERROR', () => {
      const errorMessage = 'Failed to load statuses';
      const action: StatusAction = {
        type: 'LOAD_STATUSES_ERROR',
        payload: errorMessage
      };
      const state = statusReducer(initialStatusState, action);

      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMessage);
      expect(state.statuses).toEqual([]);
    });
  });

  describe('CREATE_STATUS Action', () => {
    it('should add new status and clear caches', () => {
      const initialState: StatusState = {
        ...initialStatusState,
        statuses: [mockStatus1]
      };

      const newStatus: CustomStatus = {
        id: '4',
        name: 'REVIEW',
        displayOrder: 1,
        createdAt: new Date()
      };

      const action: StatusAction = {
        type: 'CREATE_STATUS',
        payload: newStatus
      };

      const state = statusReducer(initialState, action);

      expect(state.statuses).toHaveLength(2);
      expect(state.statuses).toContain(newStatus);
      expect(state.error).toBe(null);
    });
  });

  describe('UPDATE_STATUS Action', () => {
    it('should update existing status and clear relevant caches', () => {
      const initialState: StatusState = {
        ...initialStatusState,
        statuses: mockStatuses
      };

      const updates = { name: 'IN PROGRESS' };
      const action: StatusAction = {
        type: 'UPDATE_STATUS',
        payload: { id: '2', updates }
      };

      const state = statusReducer(initialState, action);

      const updatedStatus = state.statuses.find(s => s.id === '2');
      expect(updatedStatus?.name).toBe('IN PROGRESS');
      expect(state.error).toBe(null);
    });

    it('should not modify other statuses', () => {
      const initialState: StatusState = {
        ...initialStatusState,
        statuses: mockStatuses
      };

      const updates = { name: 'IN PROGRESS' };
      const action: StatusAction = {
        type: 'UPDATE_STATUS',
        payload: { id: '2', updates }
      };

      const state = statusReducer(initialState, action);

      expect(state.statuses.find(s => s.id === '1')).toEqual(mockStatus1);
      expect(state.statuses.find(s => s.id === '3')).toEqual(mockStatus3);
    });
  });

  describe('DELETE_STATUS Action', () => {
    it('should remove status and reorder remaining statuses', () => {
      const initialState: StatusState = {
        ...initialStatusState,
        statuses: mockStatuses
      };

      const action: StatusAction = {
        type: 'DELETE_STATUS',
        payload: '2'
      };

      const state = statusReducer(initialState, action);

      expect(state.statuses).toHaveLength(2);
      expect(state.statuses.find(s => s.id === '2')).toBeUndefined();
      
      // Check that displayOrder is reordered
      const sortedStatuses = state.statuses.sort((a, b) => a.displayOrder - b.displayOrder);
      expect(sortedStatuses[0].displayOrder).toBe(0);
      expect(sortedStatuses[1].displayOrder).toBe(1);
    });
  });

  describe('REORDER_STATUSES Action', () => {
    it('should reorder statuses correctly', () => {
      const initialState: StatusState = {
        ...initialStatusState,
        statuses: mockStatuses
      };

      const action: StatusAction = {
        type: 'REORDER_STATUSES',
        payload: { fromIndex: 0, toIndex: 2 }
      };

      const state = statusReducer(initialState, action);

      const sortedStatuses = state.statuses.sort((a, b) => a.displayOrder - b.displayOrder);
      expect(sortedStatuses[0].name).toBe('DOING');
      expect(sortedStatuses[1].name).toBe('DONE');
      expect(sortedStatuses[2].name).toBe('TODO');
    });

    it('should handle invalid indices gracefully', () => {
      const initialState: StatusState = {
        ...initialStatusState,
        statuses: mockStatuses
      };

      const action: StatusAction = {
        type: 'REORDER_STATUSES',
        payload: { fromIndex: -1, toIndex: 5 }
      };

      const state = statusReducer(initialState, action);
      expect(state.statuses).toEqual(mockStatuses);
    });

    it('should handle same indices', () => {
      const initialState: StatusState = {
        ...initialStatusState,
        statuses: mockStatuses
      };

      const action: StatusAction = {
        type: 'REORDER_STATUSES',
        payload: { fromIndex: 1, toIndex: 1 }
      };

      const state = statusReducer(initialState, action);
      expect(state.statuses).toEqual(mockStatuses);
    });
  });

  describe('CLEAR_ERROR Action', () => {
    it('should clear error state', () => {
      const initialState: StatusState = {
        ...initialStatusState,
        error: 'Some error'
      };

      const action: StatusAction = { type: 'CLEAR_ERROR' };
      const state = statusReducer(initialState, action);

      expect(state.error).toBe(null);
    });
  });

  describe('INVALIDATE_CACHE Action', () => {
    it('should clear all caches when no payload provided', () => {
      const initialState: StatusState = {
        ...initialStatusState,
        colorCache: new Map([['1', { backgroundColor: '#fff', accentColor: '#000', contrastRatio: 21 }]]),
        validationCache: new Map([['test', { isValid: true, errors: [] }]])
      };

      const action: StatusAction = { type: 'INVALIDATE_CACHE' };
      const state = statusReducer(initialState, action);

      expect(state.colorCache.size).toBe(0);
      expect(state.validationCache.size).toBe(0);
    });

    it('should clear specific cache when statusId provided', () => {
      const colorCache = new Map([
        ['1', { backgroundColor: '#fff', accentColor: '#000', contrastRatio: 21 }],
        ['2', { backgroundColor: '#eee', accentColor: '#111', contrastRatio: 15 }]
      ]);
      
      const initialState: StatusState = {
        ...initialStatusState,
        colorCache,
        validationCache: new Map([['test', { isValid: true, errors: [] }]])
      };

      const action: StatusAction = { type: 'INVALIDATE_CACHE', payload: '1' };
      const state = statusReducer(initialState, action);

      expect(state.colorCache.has('1')).toBe(false);
      expect(state.colorCache.has('2')).toBe(true);
      expect(state.validationCache.size).toBe(0); // Always cleared
    });
  });
});

describe('Selector Functions', () => {
  describe('getStatusesByDisplayOrder', () => {
    it('should return statuses sorted by displayOrder', () => {
      const unorderedStatuses = [mockStatus3, mockStatus1, mockStatus2];
      const result = getStatusesByDisplayOrder(unorderedStatuses);

      expect(result).toEqual([mockStatus1, mockStatus2, mockStatus3]);
    });
  });

  describe('getStatusById', () => {
    it('should return status by id', () => {
      const result = getStatusById(mockStatuses, '2');
      expect(result).toEqual(mockStatus2);
    });

    it('should return undefined for non-existent id', () => {
      const result = getStatusById(mockStatuses, 'non-existent');
      expect(result).toBeUndefined();
    });
  });

  describe('getStatusByPosition', () => {
    it('should return status at specified position', () => {
      const result = getStatusByPosition(mockStatuses, 1);
      expect(result).toEqual(mockStatus2);
    });

    it('should return undefined for out-of-bounds position', () => {
      const result = getStatusByPosition(mockStatuses, 5);
      expect(result).toBeUndefined();
    });
  });

  describe('getNextDisplayOrder', () => {
    it('should return 0 for empty array', () => {
      const result = getNextDisplayOrder([]);
      expect(result).toBe(0);
    });

    it('should return max + 1 for non-empty array', () => {
      const result = getNextDisplayOrder(mockStatuses);
      expect(result).toBe(3);
    });
  });

  describe('hasStatusNameDuplicate', () => {
    it('should detect duplicates', () => {
      const result = hasStatusNameDuplicate(mockStatuses, 'TODO');
      expect(result).toBe(true);
    });

    it('should be case insensitive', () => {
      const result = hasStatusNameDuplicate(mockStatuses, 'todo');
      expect(result).toBe(true);
    });

    it('should handle whitespace', () => {
      const result = hasStatusNameDuplicate(mockStatuses, ' TODO ');
      expect(result).toBe(true);
    });

    it('should exclude specified id', () => {
      const result = hasStatusNameDuplicate(mockStatuses, 'TODO', '1');
      expect(result).toBe(false);
    });

    it('should return false for unique names', () => {
      const result = hasStatusNameDuplicate(mockStatuses, 'UNIQUE');
      expect(result).toBe(false);
    });
  });

  describe('canDeleteStatus', () => {
    it('should prevent deletion when only one status exists', () => {
      const result = canDeleteStatus([mockStatus1], '1');
      expect(result.canDelete).toBe(false);
      expect(result.reason).toBe('最低1つのステータスが必要です');
    });

    it('should prevent deletion of non-existent status', () => {
      const result = canDeleteStatus(mockStatuses, 'non-existent');
      expect(result.canDelete).toBe(false);
      expect(result.reason).toBe('指定されたステータスが見つかりません');
    });

    it('should allow deletion when multiple statuses exist', () => {
      const result = canDeleteStatus(mockStatuses, '2');
      expect(result.canDelete).toBe(true);
      expect(result.reason).toBeUndefined();
    });
  });

  describe('validateAndRepairDisplayOrder', () => {
    it('should repair discontinuous displayOrder', () => {
      const brokenStatuses: CustomStatus[] = [
        { ...mockStatus1, displayOrder: 0 },
        { ...mockStatus2, displayOrder: 5 },
        { ...mockStatus3, displayOrder: 10 }
      ];

      const result = validateAndRepairDisplayOrder(brokenStatuses);

      expect(result[0].displayOrder).toBe(0);
      expect(result[1].displayOrder).toBe(1);
      expect(result[2].displayOrder).toBe(2);
    });

    it('should handle duplicate displayOrder by using createdAt', () => {
      const duplicateOrderStatuses: CustomStatus[] = [
        { ...mockStatus1, displayOrder: 1 },
        { ...mockStatus2, displayOrder: 1 },
        { ...mockStatus3, displayOrder: 1 }
      ];

      const result = validateAndRepairDisplayOrder(duplicateOrderStatuses);

      expect(result[0].displayOrder).toBe(0);
      expect(result[1].displayOrder).toBe(1);
      expect(result[2].displayOrder).toBe(2);
      // Should be ordered by createdAt when displayOrder is same
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
      expect(result[2].id).toBe('3');
    });
  });

  describe('validateStatusArray', () => {
    it('should pass validation for valid array', () => {
      const result = validateStatusArray(mockStatuses);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for empty array', () => {
      const result = validateStatusArray([]);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'statuses',
        message: '最低1つのステータスが必要です',
        code: 'EMPTY_STATUS_ARRAY'
      });
    });

    it('should detect duplicate IDs', () => {
      const duplicateIdStatuses = [
        mockStatus1,
        { ...mockStatus2, id: '1' } // Duplicate ID
      ];

      const result = validateStatusArray(duplicateIdStatuses);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'statuses',
        message: '重複するIDが検出されました',
        code: 'DUPLICATE_STATUS_ID'
      });
    });

    it('should detect duplicate names', () => {
      const duplicateNameStatuses = [
        mockStatus1,
        { ...mockStatus2, name: 'TODO' } // Duplicate name
      ];

      const result = validateStatusArray(duplicateNameStatuses);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'statuses',
        message: '重複する名前が検出されました',
        code: 'DUPLICATE_STATUS_NAME'
      });
    });
  });
});