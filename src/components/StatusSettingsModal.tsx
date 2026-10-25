/**
 * StatusSettingsModal - Modal for managing custom status settings with drag & drop
 * カスタムタスクステータス管理用モーダルコンポーネント（ドラッグ&ドロップ対応）
 * Enhanced with comprehensive error handling using SystemError framework
 * 
 * Requirements: 6.1, 6.2, 6.3, 3.1, 3.2, 8.3, 1.3, 2.1, 6.4, 16.2
 * 
 * @dnd-kit/sortableを使用したドラッグ&ドロップ対応のStatusSettingsModal。
 * 既存の機能（色表示、省略表示、ツールチップ）を保持しながら、
 * ドラッグ&ドロップによる並び替え、リアルタイムプレビュー、
 * インライン編集、削除確認ダイアログ、アクセシビリティ、エラーハンドリングを提供します。
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  DragCancelEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useStatusContext } from '../contexts/StatusContext';
import { CustomStatus } from '../types/CustomStatus';
import { TruncationService } from '../utils/TruncationService';
import { SortableStatusItem } from './SortableStatusItem';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { ErrorHandler } from '../services/ErrorHandler';
import styles from './StatusSettingsModal.module.css';

/**
 * Props for StatusSettingsModal component
 */
interface StatusSettingsModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  
  /** Callback when modal should be closed */
  onClose: () => void;
}

/**
 * StatusSettingsModal component with drag & drop functionality
 * 
 * Features:
 * - @dnd-kit/sortable integration for drag & drop
 * - Real-time color preview during reordering
 * - Touch device support
 * - Keyboard accessibility (Space/Enter to activate, arrows to move)
 * - Screen reader support with proper ARIA labels
 * - Visual feedback during dragging
 * - Error handling for failed operations
 * - Smooth animations and transitions
 * - 50-character truncation with tooltips
 * - Close/cancel functionality
 * - Responsive design
 * 
 * Satisfies requirements:
 * - 6.1: Shows settings button in kanban board header
 * - 6.2: Opens status settings modal when clicked  
 * - 6.3: Displays current statuses with names, colors, and order
 * - 3.1: Drag & drop reordering in current display order
 * - 3.2: Updates display order of all affected statuses
 * - 8.3: Real-time color preview updates during sorting
 */
export const StatusSettingsModal: React.FC<StatusSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const {
    statuses,
    loading,
    error,
    getColorForStatus,
    reorderStatuses,
    createStatus,
    updateStatus,
    deleteStatus,
    canDeleteStatus
  } = useStatusContext();

  // Screen size state for responsive truncation
  const [screenSize, setScreenSize] = useState<'desktop' | 'mobile' | 'tablet'>('desktop');
  
  // Drag and drop state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedStatus, setDraggedStatus] = useState<CustomStatus | null>(null);
  
  // Local state for optimistic updates during dragging
  const [localStatuses, setLocalStatuses] = useState<CustomStatus[]>([]);
  
  // Edit state
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  
  // New status creation state
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [newStatusName, setNewStatusName] = useState<string>('');
  const [newStatusError, setNewStatusError] = useState<string>('');
  
  // Delete confirmation state
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    isOpen: boolean;
    statusId?: string;
    statusName?: string;
    cannotDeleteReason?: string;
  }>({
    isOpen: false
  });

  /**
   * Configure sensors for drag and drop
   * - PointerSensor for mouse/touch interactions
   * - KeyboardSensor for accessibility
   */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /**
   * Initialize local statuses when statuses change
   */
  useEffect(() => {
    const sortedStatuses = [...statuses].sort((a, b) => a.displayOrder - b.displayOrder);
    setLocalStatuses(sortedStatuses);
  }, [statuses]);

  /**
   * Handle screen size changes for responsive truncation
   */
  useEffect(() => {
    const updateScreenSize = () => {
      setScreenSize(TruncationService.getCurrentScreenSize());
    };

    // Set initial screen size
    updateScreenSize();

    // Listen for window resize
    window.addEventListener('resize', updateScreenSize);
    
    return () => {
      window.removeEventListener('resize', updateScreenSize);
    };
  }, []);

  /**
   * Handle drag start
   */
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const statusId = active.id as string;
    
    setActiveId(statusId);
    setIsDragging(true);
    
    const status = localStatuses.find(s => s.id === statusId);
    setDraggedStatus(status || null);
  }, [localStatuses]);

  /**
   * Handle drag end with comprehensive error handling
   */
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);
    setIsDragging(false);
    setDraggedStatus(null);

    if (!over || active.id === over.id) {
      return;
    }

    const activeIndex = localStatuses.findIndex(status => status.id === active.id);
    const overIndex = localStatuses.findIndex(status => status.id === over.id);

    if (activeIndex === -1 || overIndex === -1) {
      await ErrorHandler.handleUIStateError(
        'DRAG_DROP_STATE_ERROR',
        'Invalid drag operation: status not found',
        {
          componentName: 'StatusSettingsModal',
          currentState: { 
            activeId: active.id as string, 
            overId: over.id as string,
            statusCount: localStatuses.length 
          },
          userAction: 'drag_reorder'
        }
      );
      
      console.error('Invalid drag operation: status not found');
      return;
    }

    // Store original state for rollback
    const originalStatuses = [...localStatuses];

    // Optimistically update local state for immediate UI feedback
    const newStatuses = arrayMove(localStatuses, activeIndex, overIndex);
    setLocalStatuses(newStatuses);

    try {
      // Call the actual reorder function
      await reorderStatuses(activeIndex, overIndex);
    } catch (error) {
      // Revert optimistic update on error
      setLocalStatuses(originalStatuses);
      
      await ErrorHandler.handleUIStateError(
        'DRAG_DROP_STATE_ERROR',
        'Failed to reorder statuses',
        {
          componentName: 'StatusSettingsModal',
          currentState: { 
            fromIndex: activeIndex, 
            toIndex: overIndex,
            statusCount: localStatuses.length,
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          },
          userAction: 'drag_reorder'
        }
      );
      
      console.error('Failed to reorder statuses:', error);
      // Error will be displayed via the error state from context
    }
  }, [localStatuses, reorderStatuses]);

  /**
   * Handle drag cancel - revert any optimistic updates
   */
  const handleDragCancel = useCallback((_event: DragCancelEvent) => {
    setActiveId(null);
    setIsDragging(false);
    setDraggedStatus(null);
    
    // Revert to original order
    const sortedStatuses = [...statuses].sort((a, b) => a.displayOrder - b.displayOrder);
    setLocalStatuses(sortedStatuses);
  }, [statuses]);

  /**
   * Handle modal close
   */
  const handleClose = useCallback(() => {
    // Cancel any ongoing drag operation
    if (isDragging) {
      handleDragCancel({} as DragCancelEvent);
    }
    
    // Cancel any ongoing edit operation
    if (editingStatusId) {
      handleCancelEdit();
    }
    
    // clearError removed - not available in new StatusContext
    onClose();
  }, [onClose, isDragging, editingStatusId]);

  /**
   * Handle adding new status with comprehensive error handling
   */
  const handleStartNewStatus = useCallback(() => {
    setIsCreatingNew(true);
    setNewStatusName('');
    setNewStatusError('');
  }, []);

  const handleCancelNewStatus = useCallback(() => {
    setIsCreatingNew(false);
    setNewStatusName('');
    setNewStatusError('');
  }, []);

  const handleCreateNewStatus = useCallback(async () => {
    const trimmedName = newStatusName.trim();
    
    // Validate name
    if (!trimmedName) {
      setNewStatusError('ステータス名を入力してください');
      return;
    }
    
    // Check for duplicates (case insensitive)
    const isDuplicate = localStatuses.some(status => 
      status.name.toLowerCase() === trimmedName.toLowerCase()
    );
    
    if (isDuplicate) {
      setNewStatusError('この名前は既に使用されています');
      return;
    }
    
    try {
      const newStatus = await createStatus(trimmedName);
      
      // Reset form and close creation mode
      setIsCreatingNew(false);
      setNewStatusName('');
      setNewStatusError('');
      
      console.log('New status created:', newStatus);
    } catch (error) {
      console.error('Failed to create new status:', error);
      setNewStatusError('ステータスの作成に失敗しました');
    }
  }, [newStatusName, localStatuses, createStatus]);

  const handleNewStatusNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewStatusName(value);
    
    // Clear previous error
    if (newStatusError) {
      setNewStatusError('');
    }
    
    // Real-time duplicate check
    const trimmedValue = value.trim();
    if (trimmedValue) {
      const isDuplicate = localStatuses.some(status => 
        status.name.toLowerCase() === trimmedValue.toLowerCase()
      );
      
      if (isDuplicate) {
        setNewStatusError('この名前は既に使用されています');
      }
    }
  }, [newStatusError, localStatuses]);

  /**
   * Handle starting edit for a status (double-click or edit button)
   */
  const handleStartEdit = useCallback((statusId: string) => {
    const status = localStatuses.find(s => s.id === statusId);
    if (!status) return;
    
    setEditingStatusId(statusId);
    setEditingName(status.name);
  }, [localStatuses]);

  /**
   * Handle saving edit (Enter key)
   */
  const handleSaveEdit = useCallback(async () => {
    if (!editingStatusId || !editingName.trim()) {
      handleCancelEdit();
      return;
    }

    try {
      await updateStatus(editingStatusId, { name: editingName.trim() });
      setEditingStatusId(null);
      setEditingName('');
    } catch (error) {
      // Error will be displayed via the error state from context
      console.error('Failed to update status:', error);
    }
  }, [editingStatusId, editingName, updateStatus]);

  /**
   * Handle canceling edit (Escape key)
   */
  const handleCancelEdit = useCallback(() => {
    setEditingStatusId(null);
    setEditingName('');
  }, []);

  /**
   * Handle delete confirmation dialog open
   */
  const handleDeleteClick = useCallback((statusId: string) => {
    const status = localStatuses.find(s => s.id === statusId);
    if (!status) return;
    
    // Check if status can be deleted
    const deletionCheck = canDeleteStatus(statusId);
    
    if (!deletionCheck.canDelete) {
      // Show cannot delete dialog with reason
      setDeleteConfirmDialog({
        isOpen: true,
        statusId,
        statusName: status.name,
        cannotDeleteReason: deletionCheck.reason
      });
      return;
    }

    // Show regular delete confirmation dialog
    setDeleteConfirmDialog({
      isOpen: true,
      statusId,
      statusName: status.name
    });
  }, [localStatuses, canDeleteStatus]);

  /**
   * Handle confirmed deletion
   */
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteConfirmDialog.statusId) return;
    
    try {
      await deleteStatus(deleteConfirmDialog.statusId);
      setDeleteConfirmDialog({ isOpen: false });
    } catch (error) {
      console.error('Failed to delete status:', error);
      // Keep dialog open to show error
    }
  }, [deleteConfirmDialog.statusId, deleteStatus]);

  /**
   * Handle delete cancellation
   */
  const handleCancelDelete = useCallback(() => {
    setDeleteConfirmDialog({ isOpen: false });
  }, []);

  /**
   * Handle backdrop click to close modal
   */
  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  /**
   * Handle keyboard events for accessibility
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  }, [handleClose]);

  // Don't render anything if modal is not open
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="status-settings-title"
      aria-describedby="status-settings-description"
      data-testid="status-settings-modal"
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 id="status-settings-title" className={styles.title}>
            ステータス設定
          </h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={handleClose}
            aria-label="モーダルを閉じる"
            data-testid="close-modal-button"
          >
            ✕
          </button>
        </div>

        <div className={styles.content}>
          <p id="status-settings-description" className={styles.description}>
            ドラッグ&ドロップでステータスの並び順を変更できます。順序が変わると色も自動的に更新されます。
          </p>

          {/* Error display */}
          {error && (
            <div className={styles.errorMessage} data-testid="error-message">
              {error}
            </div>
          )}

          {/* Loading state */}
          {loading ? (
            <div className={styles.loading} data-testid="loading-indicator">
              読み込み中...
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
              accessibility={{
                announcements: {
                  onDragStart({ active }) {
                    const status = localStatuses.find(s => s.id === active.id);
                    return `Picked up status ${status?.name || 'unknown'}. Use arrow keys to move.`;
                  },
                  onDragOver({ active, over }) {
                    if (over) {
                      const activeStatus = localStatuses.find(s => s.id === active.id);
                      const overStatus = localStatuses.find(s => s.id === over.id);
                      return `Status ${activeStatus?.name} is over ${overStatus?.name}.`;
                    }
                    return `Status is not over a droppable area.`;
                  },
                  onDragEnd({ active, over }) {
                    if (over) {
                      const activeStatus = localStatuses.find(s => s.id === active.id);
                      const overStatus = localStatuses.find(s => s.id === over.id);
                      return `Status ${activeStatus?.name} dropped over ${overStatus?.name}.`;
                    }
                    return `Status dropped outside of droppable area.`;
                  },
                  onDragCancel({ active }) {
                    const status = localStatuses.find(s => s.id === active.id);
                    return `Dragging cancelled. Status ${status?.name || 'unknown'} returned to original position.`;
                  }
                }
              }}
            >
              <div 
                className={styles.statusList} 
                data-testid="status-list"
                role="list"
                aria-label="Status list - drag and drop to reorder"
              >
                <SortableContext 
                  items={localStatuses.map(s => s.id)} 
                  strategy={verticalListSortingStrategy}
                >
                  {localStatuses.map((status) => {
                    const statusColor = getColorForStatus(status.id);
                    const truncatedDisplay = TruncationService.getTruncatedDisplay(
                      status.name, 
                      screenSize
                    );
                    const isEditing = editingStatusId === status.id;

                    return (
                      <SortableStatusItem
                        key={status.id}
                        status={status}
                        color={statusColor}
                        truncatedDisplay={truncatedDisplay}
                        isDragging={activeId === status.id}
                        isEditing={isEditing}
                        editingName={isEditing ? editingName : undefined}
                        onEdit={handleStartEdit}
                        onDelete={handleDeleteClick}
                        onEditNameChange={setEditingName}
                        onSaveEdit={handleSaveEdit}
                        onCancelEdit={handleCancelEdit}
                      />
                    );
                  })}
                </SortableContext>
                
                {localStatuses.length === 0 && (
                  <div className={styles.emptyState} data-testid="empty-state">
                    ステータスが見つかりません。
                  </div>
                )}
              </div>

              {/* Drag overlay for visual feedback */}
              <DragOverlay dropAnimation={null}>
                {activeId && draggedStatus ? (
                  <div className={styles.dragOverlay}>
                    <SortableStatusItem
                      status={draggedStatus}
                      color={getColorForStatus(draggedStatus.id)}
                      truncatedDisplay={TruncationService.getTruncatedDisplay(
                        draggedStatus.name, 
                        screenSize
                      )}
                      isDragging={true}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>
          {/* New Status Creation Form */}
          {isCreatingNew && (
            <div className={styles.newStatusForm} data-testid="new-status-form">
              <h3 className={styles.newStatusTitle}>新しいステータスを作成</h3>
              
              <div className={styles.formGroup}>
                <label htmlFor="new-status-name" className={styles.label}>
                  ステータス名
                </label>
                <input
                  id="new-status-name"
                  type="text"
                  className={styles.input}
                  value={newStatusName}
                  onChange={handleNewStatusNameChange}
                  placeholder="ステータス名を入力してください"
                  maxLength={50}
                  data-testid="new-status-name-input"
                  autoFocus
                />
                
                {newStatusError && (
                  <div className={styles.fieldError} data-testid="new-status-error">
                    {newStatusError}
                  </div>
                )}
              </div>
              
              <div className={styles.formActions}>
                <button
                  type="button"
                  className={`${styles.button} ${styles.saveButton}`}
                  onClick={handleCreateNewStatus}
                  disabled={loading || !newStatusName.trim() || !!newStatusError}
                  data-testid="save-new-status-button"
                >
                  作成
                </button>
                <button
                  type="button"
                  className={`${styles.button} ${styles.cancelButton}`}
                  onClick={handleCancelNewStatus}
                  data-testid="cancel-new-status-button"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}



        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.button} ${styles.addButton}`}
            onClick={handleStartNewStatus}
            data-testid="add-status-button"
            disabled={loading}
          >
            ＋ ステータスを追加
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.cancelButton}`}
            onClick={handleClose}
            data-testid="cancel-button"
            autoFocus
          >
            閉じる
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteConfirmDialog.isOpen}
        taskTitle={deleteConfirmDialog.statusName || ''}
        onConfirm={deleteConfirmDialog.cannotDeleteReason ? handleCancelDelete : handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default StatusSettingsModal;