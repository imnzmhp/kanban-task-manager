/**
 * KanbanBoard - Main kanban board component with dynamic CustomStatus support
 * Requirements: 2.2, 2.4, 3.1, 3.2, 7.2, 3.4, 6.5
 */

import React, { useState, useMemo } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { FiSettings } from 'react-icons/fi';
import { Task, TaskV2, TaskFormData } from '../types/Task';
import { useTask } from '../hooks/useTask';
import { useToastNotifications } from '../hooks/useToast';
import { useStatusContext } from '../contexts/StatusContext';
import { EnhancedColumn } from './EnhancedColumn';
import { StatusSettingsModal } from './StatusSettingsModal';
import { TaskForm } from './TaskForm';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import styles from './KanbanBoard.module.css';

/**
 * UI state for managing form and dialog visibility including settings modal
 */
interface KanbanBoardState {
  isTaskFormOpen: boolean;
  editingTask: Task | TaskV2 | null;
  isDeleteDialogOpen: boolean;
  deletingTaskId: string | null;
  deletingTaskTitle: string | null;
  isSettingsModalOpen: boolean;
}

/**
 * Initial state for the KanbanBoard component
 */
const initialState: KanbanBoardState = {
  isTaskFormOpen: false,
  editingTask: null,
  isDeleteDialogOpen: false,
  deletingTaskId: null,
  deletingTaskTitle: null,
  isSettingsModalOpen: false,
};

/**
 * KanbanBoard component that displays the main kanban board interface
 * with dynamic columns based on CustomStatus and drag-and-drop functionality
 * 
 * Note: Data loading is handled by AppInitializer component during app startup
 */
export const KanbanBoard: React.FC = () => {
  const [uiState, setUiState] = useState<KanbanBoardState>(initialState);
  const { 
    loading, 
    error, 
    deleteTask,
    getTaskById,
    getTaskStats,
    updateTaskStatus
  } = useTask();
  const { 
    statuses, 
    loading: statusLoading, 
    error: statusError 
  } = useStatusContext();
  const toast = useToastNotifications();

  /**
   * Generate sorted statuses for dynamic column rendering
   * Sorted by displayOrder to maintain consistent column arrangement
   */
  const sortedStatuses = useMemo(() => {
    return [...statuses].sort((a, b) => a.displayOrder - b.displayOrder);
  }, [statuses]);

  /**
   * Calculate dynamic stats based on current statuses
   * TODO: This will need to be updated when TaskContext supports TaskV2 with statusId
   */
  const dynamicStats = useMemo(() => {
    const stats = getTaskStats();
    
    // Debug: Log the actual stats structure
    console.log('KanbanBoard - getTaskStats result:', stats);
    console.log('KanbanBoard - sortedStatuses:', sortedStatuses.map(s => ({ id: s.id, name: s.name })));
    
    // Get task count for each status by checking both statusId (V2) and legacy name mapping
    const statusStats = sortedStatuses.map(status => {
      let taskCount = 0;
      
      // Try to get count by statusId first (for V2 tasks and custom statuses)
      if (stats.byStatus[status.id]) {
        taskCount = stats.byStatus[status.id];
      }
      
      // For default statuses, also check by default status IDs
      if (!taskCount && ['To Do', 'Doing', 'Done'].includes(status.name)) {
        const defaultIdMap: Record<string, string> = {
          'To Do': 'default-todo',
          'Doing': 'default-doing', 
          'Done': 'default-done'
        };
        const defaultId = defaultIdMap[status.name];
        if (defaultId && stats.byStatus[defaultId]) {
          taskCount = stats.byStatus[defaultId];
        }
      }
      
      // Fallback: check legacy TaskStatus for backward compatibility  
      if (!taskCount) {
        // Map current status names to legacy TaskStatus values
        const nameToLegacyMap: Record<string, string> = {
          'To Do': 'TODO',
          'Doing': 'DOING', 
          'Done': 'DONE'
        };
        
        const legacyKey = nameToLegacyMap[status.name];
        if (legacyKey && stats.byStatus[legacyKey]) {
          taskCount = stats.byStatus[legacyKey];
        }
      }
      
      return {
        status,
        count: taskCount
      };
    });

    return {
      statusStats,
      total: stats.total
    };
  }, [sortedStatuses, getTaskStats]);

  /**
   * Handle drag end event for task movement between columns
   * Updated to work with CustomStatus IDs
   */
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // If dropped outside droppable area or same position, do nothing
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }

    const task = getTaskById(draggableId);
    if (!task) {
      toast.showError('エラー', 'タスクが見つかりませんでした');
      return;
    }

    // Find the target status by ID
    const targetStatus = sortedStatuses.find(status => status.id === destination.droppableId);
    if (!targetStatus) {
      toast.showError('エラー', '無効な移動先です');
      return;
    }

    
    // Use V2 method to update task status by statusId
    // This works with all CustomStatus types, not just legacy ones
    try {
      await updateTaskStatus(draggableId, targetStatus.id);
      toast.showSuccess('成功', `タスクを${targetStatus.name}に移動しました`);
    } catch (err) {
      console.error('Failed to move task:', err);
      toast.showError('エラー', 'タスクの移動に失敗しました');
    }
  };

  /**
   * Handle opening settings modal
   */
  const handleOpenSettings = () => {
    setUiState(prev => ({
      ...prev,
      isSettingsModalOpen: true,
    }));
  };

  /**
   * Handle closing settings modal
   */
  const handleCloseSettings = () => {
    setUiState(prev => ({
      ...prev,
      isSettingsModalOpen: false,
    }));
  };

  /**
   * Handle opening task form for adding new task
   * Updated to work with CustomStatus IDs
   */
  const handleAddTask = (_statusId: string) => {
    // For now, all new tasks are created with TODO status regardless of column
    // This maintains compatibility with the existing TaskContext
    // TODO: Update when TaskV2 with statusId support is implemented
    setUiState({
      ...initialState,
      isTaskFormOpen: true,
      editingTask: null,
    });
  };

  /**
   * Handle opening task form for editing existing task
   */
  const handleEditTask = (taskId: string) => {
    const task = getTaskById(taskId);
    if (!task) {
      toast.showError('エラー', 'タスクが見つかりませんでした');
      return;
    }

    setUiState({
      ...initialState,
      isTaskFormOpen: true,
      editingTask: task,
    });
  };

  /**
   * Handle opening delete confirmation dialog
   */
  const handleDeleteTask = (taskId: string) => {
    const task = getTaskById(taskId);
    if (!task) {
      toast.showError('エラー', 'タスクが見つかりませんでした');
      return;
    }

    setUiState({
      ...initialState,
      isDeleteDialogOpen: true,
      deletingTaskId: taskId,
      deletingTaskTitle: task.title,
    });
  };

  /**
   * Handle task form close
   */
  const handleTaskFormClose = () => {
    setUiState(prev => ({
      ...prev,
      isTaskFormOpen: false,
      editingTask: null,
    }));
  };

  /**
   * Handle task form save
   */
  const handleTaskFormSave = (taskData: TaskFormData) => {
    // TaskForm handles the actual save operation through its own context
    // Just close the form and show success message
    const operation = uiState.editingTask ? '更新' : '作成';
    toast.showSuccess('成功', `タスク「${taskData.title}」を${operation}しました`);
    handleTaskFormClose();
  };

  /**
   * Handle confirmed task deletion
   */
  const handleConfirmDelete = async () => {
    if (!uiState.deletingTaskId) {
      return;
    }

    try {
      await deleteTask(uiState.deletingTaskId);
      toast.showSuccess('成功', 'タスクを削除しました');
      handleDeleteDialogClose();
    } catch (err) {
      console.error('Failed to delete task:', err);
      toast.showError('エラー', 'タスクの削除に失敗しました');
    }
  };

  /**
   * Handle delete dialog close
   */
  const handleDeleteDialogClose = () => {
    setUiState(prev => ({
      ...prev,
      isDeleteDialogOpen: false,
      deletingTaskId: null,
      deletingTaskTitle: null,
    }));
  };

  // Show loading state
  if (loading || statusLoading) {
    return (
      <div className={styles.kanbanBoard}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>ボードを読み込み中...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || statusError) {
    return (
      <div className={styles.kanbanBoard}>
        <div className={styles.errorState}>
          <h3>エラーが発生しました</h3>
          <p>{error || statusError}</p>
          <p>アプリケーションを再読み込みしてください。</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.kanbanBoard} data-testid="kanban-board">
      {/* Board Header */}
      <div className={styles.boardHeader}>
        <h2 className={styles.boardTitle}>カンバンボード</h2>
        <div className={styles.headerActions}>
          <div className={styles.boardStats}>
            <span className={styles.statItem}>
              合計: <strong>{dynamicStats.total}</strong>
            </span>
            {dynamicStats.statusStats.map(({ status, count }) => (
              <span key={status.id} className={styles.statItem}>
                {status.name}: <strong>{count}</strong>
              </span>
            ))}
          </div>
          <button
            className={styles.settingsButton}
            onClick={handleOpenSettings}
            title="設定"
            aria-label="ステータス設定を開く"
            data-testid="settings-button"
          >
            <FiSettings size={20} />
          </button>
        </div>
      </div>

      {/* Drag and Drop Context */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className={styles.boardColumns} data-testid="board-columns">
          {/* Dynamic Enhanced Columns based on CustomStatus */}
          {sortedStatuses.map((status) => (
            <EnhancedColumn
              key={status.id}
              status={status}
              onAddTask={handleAddTask}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
            />
          ))}
          
          {/* Empty State when no statuses exist */}
          {sortedStatuses.length === 0 && (
            <div className={styles.noStatusesState}>
              <div className={styles.noStatusesContent}>
                <h3>ステータスがありません</h3>
                <p>ステータス設定からカスタムステータスを作成してください</p>
                <button
                  className={styles.createStatusButton}
                  onClick={handleOpenSettings}
                  data-testid="create-first-status"
                >
                  ステータスを作成
                </button>
              </div>
            </div>
          )}
        </div>
      </DragDropContext>

      {/* Task Form Modal */}
      <TaskForm
        isOpen={uiState.isTaskFormOpen}
        task={uiState.editingTask || undefined}
        onSave={handleTaskFormSave}
        onCancel={handleTaskFormClose}
      />

      {/* Status Settings Modal */}
      <StatusSettingsModal
        isOpen={uiState.isSettingsModalOpen}
        onClose={handleCloseSettings}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={uiState.isDeleteDialogOpen}
        taskTitle={uiState.deletingTaskTitle || ''}
        onConfirm={handleConfirmDelete}
        onCancel={handleDeleteDialogClose}
      />



    </div>
  );
};

export default KanbanBoard;