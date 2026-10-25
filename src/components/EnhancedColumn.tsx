/**
 * EnhancedColumn - Enhanced column component supporting CustomStatus with dynamic colors and responsive display
 * Requirements: 5.1, 5.2, 5.4, 8.1, 8.2, 8.4, 8.5
 * 
 * EnhancedColumn extends the existing Column functionality to support:
 * - CustomStatus instead of fixed TaskStatus enum
 * - Dynamic color generation via ColorPalette
 * - Responsive truncation with tooltips
 * - Smooth color transition animations (300ms)
 * - Accessibility (prefers-reduced-motion support)
 * - Performance optimization with React.memo
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { CustomStatus, StatusColor, TruncatedDisplayResult } from '../types/CustomStatus';
import { Task, TaskV2 } from '../types/Task';
import { useTask } from '../hooks/useTask';
import { useStatusContext } from '../contexts/StatusContext';
import { TruncationService } from '../utils/TruncationService';
import { TaskCard } from './TaskCard';
import styles from './EnhancedColumn.module.css';

/**
 * Props interface for EnhancedColumn component
 */
interface EnhancedColumnProps {
  /** Custom status that this column represents */
  status: CustomStatus;
  
  /** Callback for adding a new task to this column */
  onAddTask: (statusId: string) => void;
  
  /** Callback for editing a task */
  onEditTask: (taskId: string) => void;
  
  /** Callback for deleting a task */
  onDeleteTask: (taskId: string) => void;
}

/**
 * Column display configuration based on CustomStatus and responsive settings
 */
interface ColumnDisplayConfig {
  title: string;
  truncatedTitle: string;
  fullTitle: string;
  backgroundColor: string;
  accentColor: string;
  shouldTruncate: boolean;
  shouldShowTooltip: boolean;
  ariaLabel: string;
}

/**
 * EnhancedColumn component that displays tasks for a specific CustomStatus
 * Supports dynamic colors, responsive truncation, and smooth animations
 */
export const EnhancedColumn: React.FC<EnhancedColumnProps> = React.memo(({
  status,
  onAddTask,
  onEditTask,
  onDeleteTask
}) => {
  const taskHook = useTask();
  const { getColorForStatus } = useStatusContext();
  
  // Screen size state for responsive truncation
  const [screenSize, setScreenSize] = useState<'desktop' | 'mobile' | 'tablet'>('desktop');
  
  // Detect reduced motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

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
   * Detect user's motion preferences for accessibility
   */
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);
    
    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  /**
   * Get tasks for this status using the new statusId-based system
   * Uses the temporary getTasksByStatusId method until TaskV2 migration is complete
   */
  const tasks = useMemo(() => {
    const { getTasksByStatusId, getTasksByStatus } = taskHook;
    
    // Initialize V2 tasks variable
    let tasksByStatusId: (Task | TaskV2)[] = [];
    if (getTasksByStatusId) {
      tasksByStatusId = getTasksByStatusId(status.id);
      console.log(`EnhancedColumn [${status.name}] V2 tasks:`, tasksByStatusId.length, tasksByStatusId);
    }
    // Try to get tasks by statusId first (for future TaskV2 support)
    
    // Fallback to legacy status-based lookup for backward compatibility
    // Fallback to legacy status-based lookup for backward compatibility
    // Use both name and ID-based mapping for compatibility
    let legacyStatus: 'TODO' | 'DOING' | 'DONE' | null = null;
    
    // ID-based mapping (more reliable)
    const idStatusMap: Record<string, 'TODO' | 'DOING' | 'DONE'> = {
      'migrated-todo': 'TODO',
      'default-todo': 'TODO',
      'migrated-doing': 'DOING',
      'default-doing': 'DOING',
      'migrated-done': 'DONE',
      'default-done': 'DONE'
    };
    
    // Name-based mapping (fallback)
    const nameStatusMap: Record<string, 'TODO' | 'DOING' | 'DONE'> = {
      'TODO': 'TODO',
      'DOING': 'DOING',
      'DONE': 'DONE'
    };
    
    legacyStatus = idStatusMap[status.id] || nameStatusMap[status.name] || null;
    // Combine V2 and legacy tasks
    const legacyTasks = legacyStatus ? getTasksByStatus(legacyStatus) : [];
    const v2Tasks = (typeof tasksByStatusId !== "undefined") ? tasksByStatusId : [];
    
    // Remove duplicates: legacy tasks that have been converted to V2
    const allTasks: (Task | TaskV2)[] = [...v2Tasks];
    legacyTasks.forEach(task => {
      if (!('statusId' in task) && !allTasks.find(t => t.id === task.id)) {
        allTasks.push(task);
      }
    });
    
    console.log(`EnhancedColumn [${status.name}] Combined: V2=${v2Tasks.length}, Legacy=${legacyTasks.length}, Total=${allTasks.length}`);
    return allTasks;
  }, [status.id, status.name, taskHook]);

  /**
   * Generate column display configuration
   */
  const displayConfig = useMemo((): ColumnDisplayConfig => {
    // Get color for this status
    const statusColor: StatusColor = getColorForStatus(status.id);
    console.log(`EnhancedColumn [${status.name}] statusColor:`, statusColor);
    
    // Get truncated display based on screen size
    const truncatedDisplay: TruncatedDisplayResult = TruncationService.getTruncatedDisplay(
      status.name,
      screenSize
    );
    
    // Generate accessibility label
    const ariaLabel = TruncationService.generateAriaLabel(
      truncatedDisplay.displayText,
      truncatedDisplay.fullText
    );

    return {
      title: truncatedDisplay.displayText,
      truncatedTitle: truncatedDisplay.displayText,
      fullTitle: truncatedDisplay.fullText,
      backgroundColor: statusColor.backgroundColor,
      accentColor: statusColor.accentColor,
      shouldTruncate: truncatedDisplay.shouldShowTooltip,
      shouldShowTooltip: truncatedDisplay.shouldShowTooltip,
      ariaLabel
    };
  }, [status.id, status.name, screenSize, getColorForStatus]);

  /**
   * Handle add task button click
   */
  const handleAddTask = () => {
    onAddTask(status.id);
  };

  /**
   * Get CSS custom properties for color transitions
   */
  const getCSSVariables = () => {
    return {
      '--column-bg-color': displayConfig.backgroundColor,
      '--column-accent-color': displayConfig.accentColor,
      '--transition-duration': prefersReducedMotion ? '0ms' : '300ms'
    } as React.CSSProperties;
  };

  /**
   * Get tooltip title if truncation is needed
   */
  const getTooltipTitle = () => {
    return displayConfig.shouldShowTooltip ? displayConfig.fullTitle : undefined;
  };

  return (
    <div 
      className={styles.enhancedColumn} 
      data-testid={`enhanced-column-${status.id}`}
      style={getCSSVariables()}
    >
      {/* Column Header */}
      <div 
        className={styles.columnHeader}
        title={getTooltipTitle()}
        aria-label={displayConfig.ariaLabel}
      >
        <h3 className={styles.columnTitle}>
          {displayConfig.title}
        </h3>
        <span className={styles.taskCount} aria-label={`${tasks.length}個のタスク`}>
          {tasks.length}
        </span>
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={status.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`${styles.columnContent} ${snapshot.isDraggingOver ? styles.draggingOver : ''}`}
          >
            {/* Add Task Button - at top if no tasks */}
            {tasks.length === 0 && (
              <button
                className={styles.addTaskButton}
                onClick={handleAddTask}
                data-testid={`add-task-${status.id}`}
                aria-label={`${status.name}にタスクを追加`}
              >
                <span className={styles.addTaskIcon}>+</span>
                <span className={styles.addTaskText}>タスクを追加</span>
              </button>
            )}

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
              
              {/* Add Task Button - immediately after tasks */}
              {tasks.length > 0 && (
                <button
                  className={styles.addTaskButton}
                  onClick={handleAddTask}
                  data-testid={`add-task-${status.id}`}
                  aria-label={`${status.name}にタスクを追加`}
                >
                  <span className={styles.addTaskIcon}>+</span>
                  <span className={styles.addTaskText}>タスクを追加</span>
                </button>
              )}
              
              {provided.placeholder}
            </div>

            {/* Empty State - simplified */}
            {tasks.length === 0 && (
              <div className={styles.emptyState}>
                <p className={styles.emptyMessage}>
                  タスクをここにドロップできます
                </p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
});

// Display name for debugging
EnhancedColumn.displayName = 'EnhancedColumn';

export default EnhancedColumn;