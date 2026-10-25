/**
 * SortableStatusItem - Individual sortable status item component
 * ドラッグ&ドロップ可能な個別ステータスアイテムコンポーネント
 * 
 * Requirements: 3.1, 3.2, 8.3
 * 
 * @dnd-kit/sortableを使用したドラッグ&ドロップ対応のステータス項目。
 * 既存の機能（色表示、省略表示、ツールチップ）を保持しながら、
 * ドラッグハンドル、視覚的フィードバック、アクセシビリティを提供します。
 */

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CustomStatus, StatusColor } from '../types/CustomStatus';
import { TruncationService } from '../utils/TruncationService';
import styles from './StatusSettingsModal.module.css';

/**
 * Props for SortableStatusItem component
 */
export interface SortableStatusItemProps {
  /** Status data */
  status: CustomStatus;
  
  /** Status color information */
  color: StatusColor;
  
  /** Truncated display information */
  truncatedDisplay: {
    displayText: string;
    shouldShowTooltip: boolean;
    fullText: string;
  };
  
  /** Whether the item is being dragged */
  isDragging?: boolean;
  
  /** Whether the item is in edit mode */
  isEditing?: boolean;
  
  /** Current editing name value */
  editingName?: string;
  
  /** Callback for starting edit (double-click or edit button) */
  onEdit?: (id: string) => void;
  
  /** Callback for delete action */
  onDelete?: (id: string) => void;
  
  /** Callback for editing name change */
  onEditNameChange?: (name: string) => void;
  
  /** Callback for saving edit */
  onSaveEdit?: () => void;
  
  /** Callback for canceling edit */
  onCancelEdit?: () => void;
}

/**
 * SortableStatusItem component with drag and drop functionality
 * 
 * Features:
 * - Drag handle with grip icon
 * - Visual feedback during dragging
 * - Smooth transitions and animations
 * - Touch device support
 * - Keyboard accessibility
 * - Screen reader support
 * - Error handling for failed operations
 */
export const SortableStatusItem: React.FC<SortableStatusItemProps> = ({
  status,
  color,
  truncatedDisplay,
  isDragging,
  isEditing,
  editingName,
  onEdit,
  onDelete,
  onEditNameChange,
  onSaveEdit,
  onCancelEdit
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isDraggingFromSortable,
    isOver
  } = useSortable({ 
    id: status.id,
    data: {
      type: 'status',
      status,
    }
  });

  // Combine isDragging states
  const actuallyDragging = isDragging || isDraggingFromSortable;

  // CSS transform for dragging
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: actuallyDragging ? undefined : transition,
    opacity: actuallyDragging ? 0.8 : 1,
    zIndex: actuallyDragging ? 1000 : 'auto',
  };

  /**
   * Handle keyboard navigation for accessibility
   */
  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Let @dnd-kit handle keyboard navigation
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
    }
  };

  /**
   * Handle double-click to start editing
   */
  const handleDoubleClick = () => {
    if (onEdit && !isEditing && !actuallyDragging) {
      onEdit(status.id);
    }
  };

  /**
   * Handle edit input key events
   */
  const handleEditKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onSaveEdit?.();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onCancelEdit?.();
    }
  };

  /**
   * Handle edit input change
   */
  const handleEditChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onEditNameChange?.(event.target.value);
  };

  /**
   * Handle edit input blur (save on focus loss)
   */
  const handleEditBlur = () => {
    if (isEditing) {
      onSaveEdit?.();
    }
  };

  /**
   * Generate drag handle accessibility label
   */
  const dragHandleLabel = `Drag to reorder status: ${status.name}`;
  const statusAriaLabel = `Status ${status.displayOrder + 1}: ${status.name}`;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.statusItem} ${actuallyDragging ? styles.dragging : ''} ${isOver ? styles.dragOver : ''}`}
      data-testid={`sortable-status-item-${status.id}`}
      role="listitem"
      aria-label={statusAriaLabel}
      onKeyDown={handleKeyDown}
    >
      {/* Drag Handle */}
      <div
        className={styles.dragHandle}
        {...attributes}
        {...listeners}
        role="button"
        tabIndex={0}
        aria-label={dragHandleLabel}
        aria-describedby={`status-description-${status.id}`}
        data-testid={`drag-handle-${status.id}`}
      >
        <svg 
          width="12" 
          height="12" 
          viewBox="0 0 12 12" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className={styles.gripIcon}
        >
          <circle cx="2" cy="2" r="1" fill="currentColor" />
          <circle cx="6" cy="2" r="1" fill="currentColor" />
          <circle cx="10" cy="2" r="1" fill="currentColor" />
          <circle cx="2" cy="6" r="1" fill="currentColor" />
          <circle cx="6" cy="6" r="1" fill="currentColor" />
          <circle cx="10" cy="6" r="1" fill="currentColor" />
          <circle cx="2" cy="10" r="1" fill="currentColor" />
          <circle cx="6" cy="10" r="1" fill="currentColor" />
          <circle cx="10" cy="10" r="1" fill="currentColor" />
        </svg>
      </div>

      {/* Status Color Indicator */}
      <div 
        className={styles.statusColor}
        style={{ 
          backgroundColor: color.backgroundColor,
          borderColor: color.accentColor 
        }}
        aria-hidden="true"
      />
      
      {/* Status Information */}
      <div className={styles.statusInfo}>
        <div 
          id={`status-description-${status.id}`}
          className={styles.statusName}
          onDoubleClick={handleDoubleClick}
          title={truncatedDisplay.shouldShowTooltip ? truncatedDisplay.fullText : undefined}
          aria-label={
            truncatedDisplay.shouldShowTooltip 
              ? TruncationService.generateAriaLabel(truncatedDisplay.displayText, truncatedDisplay.fullText)
              : truncatedDisplay.fullText
          }
        >
          {isEditing ? (
            <input
              type="text"
              value={editingName || ''}
              onChange={handleEditChange}
              onKeyDown={handleEditKeyDown}
              onBlur={handleEditBlur}
              className={styles.statusEditInput}
              autoFocus
              maxLength={50}
              placeholder="Status name"
              aria-label={`Edit status name: ${status.name}`}
              data-testid={`edit-input-${status.id}`}
            />
          ) : (
            <span 
              title={
                !isEditing && !actuallyDragging && !truncatedDisplay.shouldShowTooltip 
                  ? 'Double-click to edit' 
                  : undefined
              }
              style={{ cursor: !isEditing && !actuallyDragging ? 'text' : 'default' }}
            >
              {truncatedDisplay.displayText}
            </span>
          )}
        </div>
        
        <div className={styles.statusMeta}>
          <span className={styles.statusOrder}>
            順序: {status.displayOrder + 1}
          </span>

        </div>
      </div>

      {/* Status Preview */}
      <div className={styles.statusPreview}>
        <div 
          className={styles.previewSample}
          style={{
            backgroundColor: color.backgroundColor,
            color: color.accentColor,
            borderColor: color.accentColor
          }}
        >
          サンプル
        </div>
      </div>

      {/* Action Buttons */}
      {(onEdit || onDelete) && (
        <div className={styles.statusActions}>
          {onEdit && (
            <button
              type="button"
              className={styles.actionButton}
              onClick={() => onEdit(status.id)}
              aria-label={`Edit status ${status.name}`}
              data-testid={`edit-status-${status.id}`}
              disabled={isEditing || actuallyDragging}
            >
              ✏️
            </button>
          )}
          
          {onDelete && (
            <button
              type="button"
              className={styles.actionButton}
              onClick={() => onDelete(status.id)}
              aria-label={`Delete status ${status.name}`}
              data-testid={`delete-status-${status.id}`}
              disabled={isEditing || actuallyDragging}
            >
              🗑️
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SortableStatusItem;