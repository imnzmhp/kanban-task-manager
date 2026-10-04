/**
 * KanbanBoard - Main kanban board component
 * Requirements: 2.2, 2.4, 3.1, 3.2, 7.2
 */

import React, { useState } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { TaskStatus, Task, TaskFormData } from '../types/Task';
import { useTask } from '../hooks/useTask';
import { useToastNotifications } from '../hooks/useToast';
import { Column } from './Column';
import { TaskForm } from './TaskForm';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import styles from './KanbanBoard.module.css';

/**
 * UI state for managing form and dialog visibility
 */
interface KanbanBoardState {
  isTaskFormOpen: boolean;
  editingTask: Task | null;
  isDeleteDialogOpen: boolean;
  deletingTaskId: string | null;
  deletingTaskTitle: string | null;
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
};

/**
 * KanbanBoard component that displays the main kanban board interface
 * with three columns (TODO, DOING, DONE) and drag-and-drop functionality
 * 
 * Note: Data loading is handled by AppInitializer component during app startup
 */
export const KanbanBoard: React.FC = () => {
  const [uiState, setUiState] = useState<KanbanBoardState>(initialState);
  const { 
    loading, 
    error, 
    moveTask, 
    deleteTask,
    getTaskById,
    getTaskStats
  } = useTask();
  const toast = useToastNotifications();

  /**
   * Handle drag end event for task movement between columns
   */
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // If dropped outside droppable area or same position, do nothing
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }

    const newStatus = destination.droppableId as TaskStatus;
    const task = getTaskById(draggableId);

    if (!task) {
      toast.showTaskError('移動', 'タスクが見つかりませんでした');
      return;
    }

    // Only move if status actually changed
    if (task.status === newStatus) {
      return;
    }

    try {
      await moveTask(draggableId, newStatus);
      toast.showTaskSuccess('移動', `タスクを${getStatusDisplayName(newStatus)}に移動しました`);
    } catch (err) {
      console.error('Failed to move task:', err);
      toast.showTaskError('移動', 'タスクの移動に失敗しました');
    }
  };

  /**
   * Get display name for status
   */
  const getStatusDisplayName = (status: TaskStatus): string => {
    switch (status) {
      case 'TODO':
        return 'TODO';
      case 'DOING':
        return 'DOING';
      case 'DONE':
        return 'DONE';
      default:
        return status;
    }
  };

  /**
   * Handle opening task form for adding new task
   */
  const handleAddTask = (_status: TaskStatus) => {
    // Note: We ignore the status parameter since all new tasks are created with TODO status
    // and users can drag them to the desired column
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
      toast.showTaskError('編集', 'タスクが見つかりませんでした');
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
      toast.showTaskError('削除', 'タスクが見つかりませんでした');
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
    toast.showTaskSuccess(operation, taskData.title);
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
      toast.showTaskSuccess('削除', 'タスクを削除しました');
      handleDeleteDialogClose();
    } catch (err) {
      console.error('Failed to delete task:', err);
      toast.showTaskError('削除', 'タスクの削除に失敗しました');
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

  /**
   * Get task statistics for display
   */
  const stats = getTaskStats();

  // Show loading state
  if (loading) {
    return (
      <div className={styles.kanbanBoard}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>タスクを読み込み中...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={styles.kanbanBoard}>
        <div className={styles.errorState}>
          <h3>エラーが発生しました</h3>
          <p>{error}</p>
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
        <div className={styles.boardStats}>
          <span className={styles.statItem}>
            合計: <strong>{stats.total}</strong>
          </span>
          <span className={styles.statItem}>
            TODO: <strong>{stats.todo}</strong>
          </span>
          <span className={styles.statItem}>
            DOING: <strong>{stats.doing}</strong>
          </span>
          <span className={styles.statItem}>
            DONE: <strong>{stats.done}</strong>
          </span>
        </div>
      </div>

      {/* Drag and Drop Context */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className={styles.boardColumns} data-testid="board-columns">
          {/* TODO Column */}
          <Column
            status="TODO"
            onAddTask={handleAddTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
          />

          {/* DOING Column */}
          <Column
            status="DOING"
            onAddTask={handleAddTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
          />

          {/* DONE Column */}
          <Column
            status="DONE"
            onAddTask={handleAddTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
          />
        </div>
      </DragDropContext>

      {/* Task Form Modal */}
      <TaskForm
        isOpen={uiState.isTaskFormOpen}
        task={uiState.editingTask || undefined}
        onSave={handleTaskFormSave}
        onCancel={handleTaskFormClose}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={uiState.isDeleteDialogOpen}
        taskTitle={uiState.deletingTaskTitle || ''}
        onConfirm={handleConfirmDelete}
        onCancel={handleDeleteDialogClose}
      />

      {/* Empty State */}
      {stats.total === 0 && (
        <div className={styles.emptyBoardState}>
          <div className={styles.emptyStateContent}>
            <h3>まだタスクがありません</h3>
            <p>新しいタスクを作成して始めましょう</p>
            <button
              className={styles.createFirstTaskButton}
              onClick={() => handleAddTask('TODO')}
              data-testid="create-first-task"
            >
              最初のタスクを作成
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;