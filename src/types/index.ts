/**
 * Core type definitions for the Kanban Task Manager
 */

export type {
  Task,
  TaskStatus,
  TaskFormData,
  TaskFormValidation,
  UIState,
  StoredData,
  TaskState,
  TaskAction,
} from './Task';

export type {
  ToastType,
  ToastMessage,
  ToastState,
  ToastAction,
  ToastOptions,
} from './Toast';

export type {
  CustomStatus,
  StatusColor,
  ValidationResult,
  ValidationError,
  StoredDataV2,
  TaskV2,
  StatusState,
  StatusAction,
  TruncatedDisplayResult,
  DeletionCheckResult,
  SerializedStatusConfig,
} from './CustomStatus';

export type {
  SystemError,
  ErrorContext,
  DataIntegrityErrorContext,
  ValidationErrorContext,
  StorageErrorContext,
  MigrationErrorContext,
  ColorSystemErrorContext,
  UIStateErrorContext,
  RecoveryStrategy,
  RecoveryResult,
  ErrorHandlerConfig,
  ErrorCode,
} from './SystemError';

export {
  ErrorSeverity,
  ErrorCodes,
  SystemErrorFactory,
  RecoveryActions,
} from './SystemError';

export {
  DEFAULT_TOAST_DURATIONS,
} from './Toast';

export type {
  OnboardingState,
  TourStep,
  SampleWorkflow,
  OnboardingConfig,
  WelcomeMessageProps,
  GuidedTourProps,
  DemoControlsProps,
  OnboardingAction,
  OnboardingContextValue,
} from './Onboarding';

export {
  SAMPLE_WORKFLOWS,
  DEFAULT_TOUR_STEPS,
} from './Onboarding';