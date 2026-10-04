/**
 * TaskCard - Draggable task card component displaying task information
 * Requirements: 3.3, 4.1, 5.1, 7.4
 */

import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Task } from '../types/Task';
import styles from './TaskCard.module.css';

/**
 * Props for TaskCard component
 */
interface TaskCardProps {
  /** The task to display */
  task: Task;
  
  /** Index of task within the column (for drag and drop) */
  index: number;
  
  /** Callback when edit button is clicked */
  onEdit: (task: Task) => void;
  
  /** Callback when delete button is clicked */
  onDelete: (taskId: string) => void;
}

/**
 * TaskCard component displays individual task information with edit/delete actions
 * Implemented as draggable element using react-beautiful-dnd
 */
export const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  index,
  onEdit, 
  onDelete 
}) => {
  /**
   * Format date for display
   */
  const formatDate = (date: Date): string => {
    const now = new Date();
    const taskDate = new Date(date);
    const diffMs = now.getTime() - taskDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffHours < 1) {
      return '今';
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h前`;
    } else if (diffDays < 7) {
      return `${Math.floor(diffDays)}日前`;
    } else {
      return taskDate.toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  /**
   * Handle edit button click
   */
  const handleEditClick = () => {
    onEdit(task);
  };

  /**
   * Handle delete button click
   */
  const handleDeleteClick = () => {
    onDelete(task.id);
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`${styles.taskCard} ${snapshot.isDragging ? styles.dragging : ''}`}
          data-testid={`task-card-${task.id}`}
          style={{
            ...provided.draggableProps.style,
            transform: snapshot.isDragging 
              ? `${provided.draggableProps.style?.transform} rotate(5deg)`
              : provided.draggableProps.style?.transform
          }}
        >
          <div className={styles.header}>
            <h3 className={styles.title}>{task.title}</h3>
            <div className={styles.actions}>
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.editBtn}`}
                onClick={handleEditClick}
                title="編集"
                data-testid={`edit-task-${task.id}`}
              >
                編集
              </button>
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.deleteBtn}`}
                onClick={handleDeleteClick}
                title="削除"
                data-testid={`delete-task-${task.id}`}
              >
                削除
              </button>
            </div>
          </div>

          {task.description && (
            <div className={styles.description}>
              {task.description}
            </div>
          )}

          <div className={styles.footer}>
            <div className={styles.dates}>
              <span className={styles.created}>
                作成: {formatDate(task.createdAt)}
              </span>
              <span className={styles.updated}>
                更新: {formatDate(task.updatedAt)}
              </span>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default TaskCard;