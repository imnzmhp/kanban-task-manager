/**
 * Utility functions for task management
 * Requirements: 1.1, 1.2, 2.1
 */

import { Task, TaskFormData, TaskFormValidation } from '../types';

/**
 * Generates a unique ID for tasks
 */
export function generateTaskId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Creates a new task from form data
 */
export function createTask(formData: TaskFormData): Task {
  const now = new Date();
  return {
    id: generateTaskId(),
    title: formData.title.trim(),
    description: formData.description.trim(),
    status: 'TODO',
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Updates an existing task with new form data
 */
export function updateTask(existingTask: Task, formData: TaskFormData): Task {
  return {
    ...existingTask,
    title: formData.title.trim(),
    description: formData.description.trim(),
    updatedAt: new Date(),
  };
}

/**
 * Validates task form data
 */
export function validateTaskData(data: TaskFormData): TaskFormValidation {
  const errors: TaskFormValidation = {
    title: [],
    description: [],
  };

  // Validate title
  const trimmedTitle = data.title.trim();
  if (!trimmedTitle) {
    errors.title.push('タイトルは必須です');
  } else if (trimmedTitle.length > 200) {
    errors.title.push('タイトルは200文字以内で入力してください');
  }

  // Validate description
  if (data.description.length > 1000) {
    errors.description.push('説明は1000文字以内で入力してください');
  }

  return errors;
}

/**
 * Checks if validation has any errors
 */
export function hasValidationErrors(validation: TaskFormValidation): boolean {
  return validation.title.length > 0 || validation.description.length > 0;
}

/**
 * Sanitizes HTML content to prevent XSS
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}