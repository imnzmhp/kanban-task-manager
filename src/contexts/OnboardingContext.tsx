/**
 * Onboarding Context
 * Provides onboarding state and actions for demo mode and guided tours
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { 
  OnboardingContextValue, 
  OnboardingConfig, 
  TourStep,
  SAMPLE_WORKFLOWS,
  DEFAULT_TOUR_STEPS
} from '../types/Onboarding';
import { 
  onboardingReducer, 
  initialOnboardingState,
  getIsFirstVisit,
  getShouldShowWelcome
} from './OnboardingReducer';
import { useStatusContext } from './StatusContext';
import { useTaskContext } from './TaskContext';
import { useToastNotifications } from '../hooks/useToast';

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

const ONBOARDING_STORAGE_KEY = 'kanban-onboarding-state';

const DEFAULT_CONFIG: OnboardingConfig = {
  enableWelcomeMessage: true,
  autoStartTour: true,
  showDemoData: true,
  tourSteps: DEFAULT_TOUR_STEPS,
  sampleWorkflows: SAMPLE_WORKFLOWS
};

interface OnboardingProviderProps {
  children: React.ReactNode;
  config?: Partial<OnboardingConfig>;
}

export function OnboardingProvider({ children, config: customConfig }: OnboardingProviderProps) {
  const [state, dispatch] = useReducer(onboardingReducer, initialOnboardingState);
  const config = { ...DEFAULT_CONFIG, ...customConfig };
  
  const { createStatus, clearStatuses } = useStatusContext();
  const { createTaskV2, clearTasks } = useTaskContext();
  const toast = useToastNotifications();

  // Load persisted onboarding state on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (saved) {
        // 保存データの妥当性を確認（内容は現状未使用だがパース失敗を検知する）
        JSON.parse(saved);
        // Restore state but update visit time
        dispatch({ type: 'UPDATE_VISIT_TIME' });
      }
    } catch (error) {
      console.warn('Failed to load onboarding state:', error);
    }
  }, []);

  // Persist onboarding state changes
  useEffect(() => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save onboarding state:', error);
    }
  }, [state]);

  const startTour = useCallback(() => {
    dispatch({ type: 'START_TOUR' });
    toast.showToast('info', 'ツアー', 'ガイドツアーを開始します');
  }, [toast]);

  const nextStep = useCallback(() => {
    dispatch({ type: 'NEXT_STEP' });
  }, []);

  const previousStep = useCallback(() => {
    dispatch({ type: 'PREVIOUS_STEP' });
  }, []);

  const skipTour = useCallback(() => {
    dispatch({ type: 'SKIP_TOUR' });
    toast.showToast('info', 'ツアー', 'ツアーをスキップしました');
  }, [toast]);

  const completeTour = useCallback(() => {
    dispatch({ type: 'COMPLETE_TOUR' });
    toast.showToast('success', 'ツアー', 'ガイドツアーが完了しました！');
  }, [toast]);

  const enterDemoMode = useCallback(() => {
    dispatch({ type: 'ENTER_DEMO_MODE' });
    toast.showToast('info', 'デモ', 'デモモードに切り替えました');
  }, [toast]);

  const exitDemoMode = useCallback(() => {
    dispatch({ type: 'EXIT_DEMO_MODE' });
    toast.showToast('info', 'デモ', 'デモモードを終了しました');
  }, [toast]);

  const loadSampleWorkflow = useCallback(async (workflowId: string) => {
    try {
      const workflow = SAMPLE_WORKFLOWS.find(w => w.id === workflowId);
      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }

      // Clear existing data
      await clearStatuses();
      await clearTasks();

      // Create statuses first
      const statusMap = new Map<string, string>();
      for (const statusTemplate of workflow.statuses) {
        const status = await createStatus(statusTemplate.name);
        // Map the template statusId to the actual created status ID
        const templateId = workflow.tasks.find(t => 
          t.statusId === statusTemplate.name.toLowerCase().replace(/\s+/g, '-')
        )?.statusId || statusTemplate.name.toLowerCase();
        statusMap.set(templateId, status.id);
      }

      // Create tasks with correct status IDs
      for (const taskTemplate of workflow.tasks) {
        const actualStatusId = statusMap.get(taskTemplate.statusId) || 
                              Array.from(statusMap.values())[0]; // fallback to first status
        
        await createTaskV2({
          title: taskTemplate.title,
          description: taskTemplate.description || ''
        }, actualStatusId);
      }

      dispatch({ type: 'LOAD_SAMPLE_WORKFLOW', payload: workflowId });
      toast.showToast('success', 'サンプル', `${workflow.name}のサンプルデータを読み込みました`);
      
    } catch (error) {
      console.error('Failed to load sample workflow:', error);
      toast.showToast('error', 'サンプル', 'サンプルデータの読み込みに失敗しました');
    }
  }, [createStatus, clearStatuses, createTaskV2, clearTasks, toast]);

  const resetData = useCallback(async () => {
    try {
      await clearTasks();
      await clearStatuses();
      toast.showToast('success', 'データ', 'データをリセットしました');
    } catch (error) {
      console.error('Failed to reset data:', error);
      toast.showToast('error', 'データ', 'データのリセットに失敗しました');
    }
  }, [clearTasks, clearStatuses, toast]);

  const isFirstVisit = useCallback(() => {
    return getIsFirstVisit(state);
  }, [state]);

  const shouldShowWelcome = useCallback(() => {
    return getShouldShowWelcome(state) && config.enableWelcomeMessage;
  }, [state, config.enableWelcomeMessage]);

  const getCurrentTourStep = useCallback((): TourStep | undefined => {
    if (state.currentTourStep >= 0 && state.currentTourStep < config.tourSteps.length) {
      return config.tourSteps[state.currentTourStep];
    }
    return undefined;
  }, [state.currentTourStep, config.tourSteps]);

  const contextValue: OnboardingContextValue = {
    state,
    config,
    
    // Tour control
    startTour,
    nextStep,
    previousStep,
    skipTour,
    completeTour,
    
    // Demo mode control
    enterDemoMode,
    exitDemoMode,
    loadSampleWorkflow,
    resetData,
    
    // Utilities
    isFirstVisit,
    shouldShowWelcome,
    getCurrentTourStep
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}