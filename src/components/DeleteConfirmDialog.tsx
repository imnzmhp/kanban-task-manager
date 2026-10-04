/**
 * DeleteConfirmDialog - Confirmation dialog for task deletion
 * Requirements: 5.1, 5.3, 5.4
 */

import React from 'react';
import styles from './DeleteConfirmDialog.module.css';

/**
 * Props for DeleteConfirmDialog component
 */
interface DeleteConfirmDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  
  /** Title of the task to be deleted */
  taskTitle: string;
  
  /** Callback when deletion is confirmed */
  onConfirm: () => void;
  
  /** Callback when deletion is cancelled */
  onCancel: () => void;
}

/**
 * DeleteConfirmDialog component displays a confirmation modal when user wants to delete a task
 * Satisfies requirements:
 * - 5.1: Shows confirmation dialog when delete button is clicked
 * - 5.3: Provides mechanism to remove task from kanban board
 * - 5.4: Allows cancellation to preserve task
 */
export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  taskTitle,
  onConfirm,
  onCancel
}) => {
  /**
   * Handle confirm button click
   * Requirement 5.3: Enable task removal from system
   */
  const handleConfirm = () => {
    onConfirm();
  };

  /**
   * Handle cancel button click or backdrop click
   * Requirement 5.4: Allow cancellation to preserve task
   */
  const handleCancel = () => {
    onCancel();
  };

  /**
   * Handle backdrop click to close dialog
   */
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  /**
   * Handle keyboard events for accessibility
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // Don't render anything if dialog is not open
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
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
      data-testid="delete-confirm-dialog"
    >
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h2 id="delete-dialog-title" className={styles.title}>
            タスクを削除
          </h2>
        </div>

        <div className={styles.content}>
          <p id="delete-dialog-description" className={styles.message}>
            「<span className={styles.taskTitle}>{taskTitle}</span>」を削除してもよろしいですか？
          </p>
          <p className={styles.warning}>
            この操作は取り消せません。
          </p>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.button} ${styles.cancelButton}`}
            onClick={handleCancel}
            data-testid="cancel-delete-button"
            autoFocus
          >
            キャンセル
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.confirmButton}`}
            onClick={handleConfirm}
            data-testid="confirm-delete-button"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmDialog;