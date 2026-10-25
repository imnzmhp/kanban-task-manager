/**
 * StatusContext - Global state management for custom statuses
 * Complete implementation with LocalStorage persistence
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { 
  CustomStatus, 
  StatusContextValue,
  DeletionCheckResult 
} from '../types/CustomStatus';
import { statusReducer, initialStatusState } from './StatusReducer';
import { StatusValidator } from '../utils/StatusValidator';
import { ColorPalette } from '../utils/ColorPalette';

/**
 * StatusContext
 */
const StatusContext = createContext<StatusContextValue | undefined>(undefined);

/**
 * Props for StatusProvider
 */
interface StatusProviderProps {
  children: React.ReactNode;
}

/**
 * StatusProvider with complete LocalStorage integration
 */
export const StatusProvider: React.FC<StatusProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(statusReducer, initialStatusState);

  /**
   * Save statuses to LocalStorage
   */
  const saveStatusesToStorage = useCallback((statuses: CustomStatus[]) => {
    try {
      const dataToStore = {
        statuses: statuses.map(status => ({
          ...status,
          createdAt: status.createdAt.toISOString()
        })),
        metadata: {
          version: '2.0.0',
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString()
        }
      };
      
      localStorage.setItem('kanban-custom-statuses', JSON.stringify(dataToStore, null, 2));
      console.log('StatusContext: Saved statuses to localStorage:', statuses.length);
    } catch (error) {
      console.error('Failed to save statuses to localStorage:', error);
    }
  }, []);

  /**
   * Load statuses from LocalStorage on mount
   */
  useEffect(() => {
    const loadStatusesFromStorage = () => {
      try {
        const storedData = localStorage.getItem('kanban-custom-statuses');
        if (storedData) {
          const parsed = JSON.parse(storedData);
          if (parsed && parsed.statuses && Array.isArray(parsed.statuses)) {
            const statuses = parsed.statuses.map((status: any) => ({
              ...status,
              createdAt: new Date(status.createdAt)
            }));
            
            console.log('StatusContext: Loading statuses from localStorage:', statuses.length);
            dispatch({ type: 'LOAD_STATUSES_SUCCESS', payload: statuses });
            return;
          }
        }
        
        // If no data in localStorage, use initial state and save it
        console.log('StatusContext: No localStorage data, using initial state');
        saveStatusesToStorage(initialStatusState.statuses);
      } catch (error) {
        console.error('Failed to load statuses from localStorage:', error);
        // Use initial state on error
        saveStatusesToStorage(initialStatusState.statuses);
      }
    };

    loadStatusesFromStorage();
  }, [saveStatusesToStorage]);

    /**
   * Auto-save to localStorage when statuses change
   */
  useEffect(() => {
    if (state.statuses.length > 0) {
      const dataToStore = {
        statuses: state.statuses.map(status => ({
          ...status,
          createdAt: status.createdAt.toISOString()
        })),
        metadata: {
          version: "2.0.0",
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString()
        }
      };
      
      localStorage.setItem("kanban-custom-statuses", JSON.stringify(dataToStore, null, 2));
      console.log("StatusContext: Auto-saved statuses to localStorage:", state.statuses.length);
    }
  }, [state.statuses]);


  /**
   * Auto-save when statuses change
   */
  useEffect(() => {
    if (state.statuses.length > 0) {
      saveStatusesToStorage(state.statuses);
    }
  }, [state.statuses, saveStatusesToStorage]);

  /**
   * Get status by ID
   */
  const getStatusById = useCallback((id: string): CustomStatus | undefined => {
    return state.statuses.find(status => status.id === id);
  }, [state.statuses]);

  /**
   * Create a new status
   */
  const createStatus = useCallback(async (name: string): Promise<CustomStatus> => {
    try {
      // Validate the status name
      const validation = StatusValidator.validateStatusName(name, state.statuses);
      if (!validation.isValid) {
        const errorMessage = StatusValidator.getErrorMessage(validation.errors);
        throw new Error(errorMessage);
      }

      // Generate unique ID
      const newId = `status-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Calculate next display order
      const maxOrder = state.statuses.length > 0 ? 
        Math.max(...state.statuses.map(s => s.displayOrder)) : -1;
      
      const newStatus: CustomStatus = {
        id: newId,
        name: StatusValidator.formatStatusName(name),
        displayOrder: maxOrder + 1,
        createdAt: new Date()
      };

      dispatch({ type: 'CREATE_STATUS', payload: newStatus });
      return newStatus;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create status';
      dispatch({ type: 'LOAD_STATUSES_ERROR', payload: errorMessage });
      throw error;
    }
  }, [state.statuses]);

  /**
   * Update a status
   */
  const updateStatus = useCallback(async (id: string, updates: Partial<CustomStatus>) => {
    try {
      const existingStatus = getStatusById(id);
      if (!existingStatus) {
        throw new Error('Status not found');
      }

      // Validate name if being updated
      if (updates.name) {
        const validation = StatusValidator.validateStatusName(updates.name, state.statuses, id);
        if (!validation.isValid) {
          const errorMessage = StatusValidator.getErrorMessage(validation.errors);
          throw new Error(errorMessage);
        }
        updates.name = StatusValidator.formatStatusName(updates.name);
      }

      dispatch({ type: 'UPDATE_STATUS', payload: { id, updates } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update status';
      dispatch({ type: 'LOAD_STATUSES_ERROR', payload: errorMessage });
      throw error;
    }
  }, [state.statuses, getStatusById]);

  /**
   * Delete a status
   */
  const deleteStatus = useCallback(async (id: string) => {
    try {
      // Check if status can be deleted
      if (state.statuses.length <= 1) {
        throw new Error('Cannot delete the last status');
      }

      const statusExists = state.statuses.some(s => s.id === id);
      if (!statusExists) {
        throw new Error('Status not found');
      }

      dispatch({ type: 'DELETE_STATUS', payload: id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete status';
      dispatch({ type: 'LOAD_STATUSES_ERROR', payload: errorMessage });
      throw error;
    }
  }, [state.statuses]);

  /**
   * Reorder statuses
   */
  const reorderStatuses = useCallback(async (fromIndex: number, toIndex: number) => {
    try {
      if (fromIndex === toIndex || 
          fromIndex < 0 || fromIndex >= state.statuses.length ||
          toIndex < 0 || toIndex >= state.statuses.length) {
        return;
      }

      dispatch({ type: 'REORDER_STATUSES', payload: { fromIndex, toIndex } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reorder statuses';
      dispatch({ type: 'LOAD_STATUSES_ERROR', payload: errorMessage });
      throw error;
    }
  }, [state.statuses]);

  /**
   * Get color for status
   */
  const getColorForStatus = useCallback((statusId: string) => {
    const position = state.statuses.findIndex(s => s.id === statusId);
    if (position === -1) {
      return { backgroundColor: '#f5f5f5', accentColor: '#666666', contrastRatio: 4.5 };
    }
    
    return ColorPalette.generateStatusColors(state.statuses.length, position);
  }, [state.statuses]);

  /**
   * Check if status can be deleted
   */
  const canDeleteStatus = useCallback((id: string): DeletionCheckResult => {
    if (state.statuses.length <= 1) {
      return {
        canDelete: false,
        reason: 'Cannot delete the last status',
        relatedTaskCount: 0
      };
    }

    const statusExists = state.statuses.some(s => s.id === id);
    if (!statusExists) {
      return {
        canDelete: false,
        reason: 'Status not found',
        relatedTaskCount: 0
      };
    }

    return {
      canDelete: true,
      reason: '',
      relatedTaskCount: 0 // TODO: Implement task counting
    };
  }, [state.statuses]);

  /**
   * Clear all statuses (for demo purposes)
   */
  const clearStatuses = useCallback(async () => {
    try {
      localStorage.removeItem('kanban-custom-statuses');
      dispatch({ type: 'CLEAR_STATUSES' });
      // Restore initial state
      saveStatusesToStorage(initialStatusState.statuses);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear statuses';
      dispatch({ type: 'LOAD_STATUSES_ERROR', payload: errorMessage });
      throw error;
    }
  }, [saveStatusesToStorage]);

  const contextValue: StatusContextValue = {
    // State
    statuses: state.statuses,
    loading: state.loading,
    error: state.error,
    
    // Actions
    createStatus,
    updateStatus,
    deleteStatus,
    reorderStatuses,
    clearStatuses,
    
    // Getters
    getStatusById,
    getColorForStatus,
    canDeleteStatus
  };

  return (
    <StatusContext.Provider value={contextValue}>
      {children}
    </StatusContext.Provider>
  );
};

/**
 * Hook to use StatusContext
 */
export const useStatusContext = (): StatusContextValue => {
  const context = useContext(StatusContext);
  if (context === undefined) {
    throw new Error('useStatusContext must be used within a StatusProvider');
  }
  return context;
};

export { StatusContext };
