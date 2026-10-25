/**
 * Utility functions for the Kanban Task Manager
 */

export {
  generateTaskId,
  createTask,
  updateTask,
  validateTaskData,
  hasValidationErrors,
  sanitizeText,
} from './taskUtils';

export {
  StatusValidator,
  StatusValidationHelpers,
  STATUS_VALIDATION_CODES,
} from './StatusValidator';

export { ColorPalette } from './ColorPalette';