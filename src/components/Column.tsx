/**
 * Column component - Displays tasks for a specific status (TODO/DOING/DONE)
 * Requirements: 2.2, 3.1, 3.2, 3.5, 7.3
 */

import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { TaskStatus } from '../types/Task';
import { useTask } from '../hooks/useTask';
import { TaskCard } from './TaskCard';
import styles from './Column.module.css';

/**
 * Column component props interface
 */
interface ColumnProps {
  /** The status that this column represents */
  status: TaskStatus;
  
  /** Callback for adding a new task to this column */
  onAddTask: (status: TaskStatus) => void;
  
  /** Callback for editing a task */
  onEditTask: (taskId: string) => void;
  
  /** Callback for deleting a task */
  onDeleteTask: (taskId: string) => void;
}

/**
 * Status display configuration
 */
const STATUS_CONFIG = {
  TODO: {
    title: 'TODO',
    color: '#e3f2fd',
    accentColor: '#1976d2'
  },
  DOING: {
    title: 'DOING',
    color: '#fff3e0',
    accentColor: '#f57c00'
  },
  DONE: {
    title: 'DONE',
    color: '#e8f5e8',
    accentColor: '#388e3c'
  }
} as const;

/**
 * Column component that displays tasks for a specific status
 * Serves as a drop area for drag and drop functionality
 */
export const Column: React.FC<ColumnProps> = ({
  status,
  onAddTask,
  onEditTask,
  onDeleteTask
}) => {
  const { getTasksByStatus } = useTask();
  const tasks = getTasksByStatus(status);
  const config = STATUS_CONFIG[status];

  /**
   * Handle add task button click
   */
  const handleAddTask = () => {
    onAddTask(status);
  };

  return (
    <div className={styles.column} data-testid={`column-${status}`}>
      {/* Column Header */}
      <div 
        className={styles.columnHeader}
        style={{ backgroundColor: config.color, borderColor: config.accentColor }}
      >
        <h3 className={styles.columnTitle} style={{ color: config.accentColor }}>
          {config.title}
        </h3>
        <span className={styles.taskCount}>
          {tasks.length}
        </span>
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`${styles.columnContent} ${snapshot.isDraggingOver ? styles.draggingOver : ''}`}
            style={{
              backgroundColor: snapshot.isDraggingOver ? config.color : 'transparent'
            }}
          >
            {/* Task List */}
            <div className={styles.taskList}>
              {tasks.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  onEdit={() => onEditTask(task.id)}
                  onDelete={() => onDeleteTask(task.id)}
                />
              ))}
              {provided.placeholder}
            </div>

            {/* Add Task Button */}
            <button
              className={styles.addTaskButton}
              onClick={handleAddTask}
              data-testid={`add-task-${status}`}
              style={{ borderColor: config.accentColor }}
            >
              <span className={styles.addTaskIcon}>+</span>
              <span className={styles.addTaskText}>タスクを追加</span>
            </button>

            {/* Empty State */}
            {tasks.length === 0 && (
              <div className={styles.emptyState}>
                <p className={styles.emptyMessage}>
                  {status === 'TODO' && 'ここにタスクをドロップするか、新しいタスクを追加してください'}
                  {status === 'DOING' && '作業中のタスクをここにドロップしてください'}
                  {status === 'DONE' && '完了したタスクをここにドロップしてください'}
                </p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default Column;