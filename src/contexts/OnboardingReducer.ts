/**
 * Onboarding State Reducer
 * Manages onboarding tour and demo mode state transitions
 */

import { OnboardingState, OnboardingAction, DEFAULT_TOUR_STEPS } from '../types/Onboarding';

export const initialOnboardingState: OnboardingState = {
  hasSeenIntro: false,
  hasCompletedTour: false,
  currentTourStep: 0,
  tourSkipped: false,
  demoMode: false,
  lastVisit: new Date()
};

export function onboardingReducer(
  state: OnboardingState, 
  action: OnboardingAction
): OnboardingState {
  switch (action.type) {
    case 'START_TOUR':
      return {
        ...state,
        hasSeenIntro: true,
        currentTourStep: 0,
        tourSkipped: false
      };

    case 'NEXT_STEP':
      const nextStep = Math.min(state.currentTourStep + 1, DEFAULT_TOUR_STEPS.length - 1);
      return {
        ...state,
        currentTourStep: nextStep,
        hasCompletedTour: nextStep === DEFAULT_TOUR_STEPS.length - 1
      };

    case 'PREVIOUS_STEP':
      return {
        ...state,
        currentTourStep: Math.max(state.currentTourStep - 1, 0)
      };

    case 'SKIP_TOUR':
      return {
        ...state,
        hasSeenIntro: true,
        hasCompletedTour: true,
        tourSkipped: true,
        currentTourStep: 0
      };

    case 'COMPLETE_TOUR':
      return {
        ...state,
        hasSeenIntro: true,
        hasCompletedTour: true,
        tourSkipped: false,
        currentTourStep: 0
      };

    case 'ENTER_DEMO_MODE':
      return {
        ...state,
        demoMode: true
      };

    case 'EXIT_DEMO_MODE':
      return {
        ...state,
        demoMode: false
      };

    case 'LOAD_SAMPLE_WORKFLOW':
      // Demo workflow loading is handled by other contexts
      return {
        ...state,
        demoMode: true
      };

    case 'RESET_ONBOARDING':
      return {
        ...initialOnboardingState,
        lastVisit: new Date()
      };

    case 'UPDATE_VISIT_TIME':
      return {
        ...state,
        lastVisit: new Date()
      };

    default:
      return state;
  }
}

// Selectors for derived state
export const getIsFirstVisit = (state: OnboardingState): boolean => {
  return !state.hasSeenIntro;
};

export const getShouldShowWelcome = (state: OnboardingState): boolean => {
  return !state.hasSeenIntro && !state.tourSkipped;
};

export const getIsTourActive = (state: OnboardingState): boolean => {
  return state.hasSeenIntro && !state.hasCompletedTour && !state.tourSkipped;
};

export const getCurrentTourProgress = (state: OnboardingState): { current: number; total: number; percentage: number } => {
  const total = DEFAULT_TOUR_STEPS.length;
  const current = state.currentTourStep + 1;
  const percentage = Math.round((current / total) * 100);
  
  return { current, total, percentage };
};