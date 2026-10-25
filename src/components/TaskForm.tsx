/**
 * TaskForm component - Modal form for creating and editing tasks
 * Requirements: 1.1, 1.2, 1.3, 4.1, 4.2, 4.3
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Task, TaskV2, TaskFormData, TaskFormValidation } from '../types/Task';
import { useTaskContext } from '../contexts/TaskContext';
import styles from './TaskForm.module.css';

/**
 * Props for TaskForm component
 */
export interface TaskFormProps {
  /** Task to edit (undefined for new task creation) */
  task?: Task | TaskV2;
  /** Callback when save is successful */
  onSave: (taskData: TaskFormData) => void;
  /** Callback when form is cancelled */
  onCancel: () => void;
  /** Whether the modal is open */
  isOpen: boolean;
}

/**
 * Validates task form data
 */
const validateTaskData = (data: TaskFormData): TaskFormValidation => {
  const errors: TaskFormValidation = {
    title: [],
    description: []
  };

  // Title validation
  if (!data.title.trim()) {
    errors.title.push('タイトルは必須です');
  } else if (data.title.trim().length > 200) {
    errors.title.push('タイトルは200文字以内で入力してください');
  }

  // Description validation
  if (data.description.length > 1000) {
    errors.description.push('説明は1000文字以内で入力してください');
  }

  return errors;
};

/**
 * TaskForm component for creating and editing tasks
 */
export const TaskForm: React.FC<TaskFormProps> = ({
  task,
  onSave,
  onCancel,
  isOpen
}) => {
  const { createTask, updateTask } = useTaskContext();
  
  // Form state
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: ''
  });
  
  // Validation state
  const [validation, setValidation] = useState<TaskFormValidation>({
    title: [],
    description: []
  });
  
  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form mode (create or edit)
  const isEditMode = Boolean(task);

  /**
   * Reset form to initial state
   */
  const resetForm = useCallback(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description
      });
    } else {
      setFormData({
        title: '',
        description: ''
      });
    }
    setValidation({ title: [], description: [] });
    setIsSubmitting(false);
  }, [task]);

  /**
   * Initialize form data when task or modal open state changes
   */
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  /**
   * Handle input changes with real-time validation
   */
  const handleInputChange = (field: keyof TaskFormData, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    // Real-time validation for better UX
    const newValidation = validateTaskData(newFormData);
    setValidation(newValidation);
  };

  /**
   * Check if form has validation errors
   */
  const hasValidationErrors = (): boolean => {
    const validationResult = validateTaskData(formData);
    return validationResult.title.length > 0 || validationResult.description.length > 0;
  };

  /**
   * Check if form data has changed from original
   */
  const hasFormChanged = (): boolean => {
    if (isEditMode && task) {
      return formData.title !== task.title || formData.description !== task.description;
    }
    return formData.title.trim() !== '' || formData.description.trim() !== '';
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const validationResult = validateTaskData(formData);
    setValidation(validationResult);
    
    // Check if there are validation errors
    const hasErrors = validationResult.title.length > 0 || validationResult.description.length > 0;
    if (hasErrors) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const trimmedData: TaskFormData = {
        title: formData.title.trim(),
        description: formData.description.trim()
      };

      if (isEditMode && task) {
        await updateTask(task.id, trimmedData);
      } else {
        await createTask(trimmedData);
      }
      
      onSave(trimmedData);
      resetForm();
    } catch (error) {
      console.error('Failed to save task:', error);
      // Error handling is managed by TaskContext
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle form cancellation
   */
  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  /**
   * Handle modal backdrop click
   */
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  /**
   * Handle escape key press
   */
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  // Don't render if modal is not open
  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className={styles.taskFormBackdrop} 
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-form-title"
    >
      <div className={styles.taskFormModal}>
        <form onSubmit={handleSubmit} className={styles.taskForm}>
          <header className={styles.taskFormHeader}>
            <h2 id="task-form-title" className={styles.taskFormTitle}>
              {isEditMode ? 'タスクを編集' : '新しいタスク'}
            </h2>
            <button
              type="button"
              onClick={handleCancel}
              className={styles.taskFormCloseButton}
              aria-label="フォームを閉じる"
            >
              ×
            </button>
          </header>

          <div className={styles.taskFormContent}>
            {/* Title field */}
            <div className={styles.formField}>
              <label htmlFor="task-title" className={styles.formLabel}>
                タイトル <span className={styles.requiredMark}>*</span>
              </label>
              <input
                id="task-title"
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`${styles.formInput} ${validation.title.length > 0 ? styles.formInputError : ''}`}
                placeholder="タスクのタイトルを入力してください"
                maxLength={250} // Allow typing beyond validation limit for testing
                required
                autoFocus
              />
              {validation.title.length > 0 && (
                <div className={styles.formError}>
                  {validation.title.map((error, index) => (
                    <div key={index} className={styles.formErrorMessage}>
                      {error}
                    </div>
                  ))}
                </div>
              )}
              <div className={styles.formHelp}>
                {formData.title.length}/200文字
              </div>
            </div>

            {/* Description field */}
            <div className={styles.formField}>
              <label htmlFor="task-description" className={styles.formLabel}>
                説明
              </label>
              <textarea
                id="task-description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={`${styles.formTextarea} ${validation.description.length > 0 ? styles.formTextareaError : ''}`}
                placeholder="タスクの詳細説明を入力してください（オプション）"
                maxLength={1100} // Allow typing beyond validation limit for testing
                rows={4}
              />
              {validation.description.length > 0 && (
                <div className={styles.formError}>
                  {validation.description.map((error, index) => (
                    <div key={index} className={styles.formErrorMessage}>
                      {error}
                    </div>
                  ))}
                </div>
              )}
              <div className={styles.formHelp}>
                {formData.description.length}/1000文字
              </div>
            </div>
          </div>

          <footer className={styles.taskFormFooter}>
            <button
              type="button"
              onClick={handleCancel}
              className={`${styles.formButton} ${styles.formButtonSecondary}`}
              disabled={isSubmitting}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className={`${styles.formButton} ${styles.formButtonPrimary}`}
              disabled={isSubmitting || hasValidationErrors() || !hasFormChanged()}
            >
              {isSubmitting ? '保存中...' : '保存'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};