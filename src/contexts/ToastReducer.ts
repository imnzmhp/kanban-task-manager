/**
 * Toast reducer for managing toast notifications state
 * Requirements: 6.4, 7.5
 */

import { ToastState, ToastAction, ToastMessage, DEFAULT_TOAST_DURATIONS } from '../types';

/**
 * Initial state for toast notifications
 */
export const initialToastState: ToastState = {
  toasts: []
};

/**
 * Toast reducer function
 * Manages the state of toast notifications including adding, removing, and clearing toasts
 */
export const toastReducer = (state: ToastState, action: ToastAction): ToastState => {
  switch (action.type) {
    case 'ADD_TOAST': {
      const newToast: ToastMessage = {
        ...action.payload,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        // Set default duration if not provided
        duration: action.payload.duration ?? DEFAULT_TOAST_DURATIONS[action.payload.type]
      };

      return {
        ...state,
        toasts: [...state.toasts, newToast]
      };
    }

    case 'REMOVE_TOAST': {
      return {
        ...state,
        toasts: state.toasts.filter(toast => toast.id !== action.payload)
      };
    }

    case 'CLEAR_ALL_TOASTS': {
      return {
        ...state,
        toasts: []
      };
    }

    default: {
      return state;
    }
  }
};