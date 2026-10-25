/**
 * Onboarding and Demo System Type Definitions
 */

import { CustomStatus } from './CustomStatus';

export interface OnboardingState {
  hasSeenIntro: boolean;
  hasCompletedTour: boolean;
  currentTourStep: number;
  tourSkipped: boolean;
  demoMode: boolean;
  lastVisit: Date;
}

export interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector
  position: 'top' | 'bottom' | 'left' | 'right';
  optional?: boolean;
  action?: {
    type: 'highlight' | 'click' | 'wait';
    delay?: number;
  };
}

export interface SampleWorkflow {
  id: string;
  name: string;
  description: string;
  statuses: Omit<CustomStatus, 'id' | 'createdAt'>[];
  tasks: Array<{
    title: string;
    description: string;
    statusId: string;
  }>;
}

export interface OnboardingConfig {
  enableWelcomeMessage: boolean;
  autoStartTour: boolean;
  showDemoData: boolean;
  tourSteps: TourStep[];
  sampleWorkflows: SampleWorkflow[];
}

export interface WelcomeMessageProps {
  onStartTour: () => void;
  onSkipTour: () => void;
  onDismiss: () => void;
}

export interface GuidedTourProps {
  isActive: boolean;
  currentStep: number;
  steps: TourStep[];
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onComplete: () => void;
}

export interface DemoControlsProps {
  isInDemoMode: boolean;
  onLoadSampleData: (workflowId: string) => void;
  onResetData: () => void;
  onExitDemo: () => void;
  availableWorkflows: SampleWorkflow[];
}

export type OnboardingAction =
  | { type: 'START_TOUR' }
  | { type: 'NEXT_STEP' }
  | { type: 'PREVIOUS_STEP' }
  | { type: 'SKIP_TOUR' }
  | { type: 'COMPLETE_TOUR' }
  | { type: 'ENTER_DEMO_MODE' }
  | { type: 'EXIT_DEMO_MODE' }
  | { type: 'LOAD_SAMPLE_WORKFLOW'; payload: string }
  | { type: 'RESET_ONBOARDING' }
  | { type: 'UPDATE_VISIT_TIME' };

export interface OnboardingContextValue {
  state: OnboardingState;
  config: OnboardingConfig;
  
  // Tour control
  startTour: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  
  // Demo mode control
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  loadSampleWorkflow: (workflowId: string) => void;
  resetData: () => void;
  
  // Utilities
  isFirstVisit: () => boolean;
  shouldShowWelcome: () => boolean;
  getCurrentTourStep: () => TourStep | undefined;
}

// Sample workflow templates
export const SAMPLE_WORKFLOWS: SampleWorkflow[] = [
  {
    id: 'project-management',
    name: 'プロジェクト管理',
    description: 'ソフトウェア開発プロジェクトの標準的なワークフロー',
    statuses: [
      { name: '計画中', displayOrder: 0 },
      { name: '開発中', displayOrder: 1 },
      { name: 'レビュー中', displayOrder: 2 },
      { name: '完了', displayOrder: 3 }
    ],
    tasks: [
      {
        title: 'ユーザー認証機能の設計',
        description: 'ログイン・登録機能の詳細設計を行う',
        statusId: 'planning' // Will be mapped to actual status ID
      },
      {
        title: 'データベーススキーマの作成',
        description: 'ユーザーテーブルとタスクテーブルの設計',
        statusId: 'development'
      },
      {
        title: 'API実装',
        description: 'REST APIエンドポイントの実装',
        statusId: 'development'
      },
      {
        title: 'フロントエンド画面の実装',
        description: 'React コンポーネントの実装',
        statusId: 'review'
      }
    ]
  },
  {
    id: 'bug-tracking',
    name: 'バグトラッキング',
    description: 'バグ修正の進捗管理ワークフロー',
    statuses: [
      { name: '報告', displayOrder: 0 },
      { name: '調査中', displayOrder: 1 },
      { name: '修正中', displayOrder: 2 },
      { name: '検証中', displayOrder: 3 },
      { name: '解決', displayOrder: 4 }
    ],
    tasks: [
      {
        title: 'ログイン時のエラー',
        description: '特定条件下でログインが失敗する',
        statusId: 'reported'
      },
      {
        title: 'UIレイアウトの崩れ',
        description: 'モバイル画面でのレイアウト問題',
        statusId: 'investigating'
      },
      {
        title: 'パフォーマンスの低下',
        description: '大量データ処理時の速度問題',
        statusId: 'fixing'
      }
    ]
  },
  {
    id: 'content-creation',
    name: 'コンテンツ制作',
    description: 'ブログ記事やドキュメントの制作ワークフロー',
    statuses: [
      { name: 'アイデア', displayOrder: 0 },
      { name: '草稿', displayOrder: 1 },
      { name: '編集中', displayOrder: 2 },
      { name: 'レビュー', displayOrder: 3 },
      { name: '公開', displayOrder: 4 }
    ],
    tasks: [
      {
        title: 'React Hooks入門記事',
        description: '初心者向けのReact Hooks解説記事',
        statusId: 'idea'
      },
      {
        title: 'TypeScript実践ガイド',
        description: '実際のプロジェクトでのTypeScript活用法',
        statusId: 'draft'
      },
      {
        title: 'テスト戦略ベストプラクティス',
        description: '効果的なテスト戦略の立て方',
        statusId: 'editing'
      }
    ]
  }
];

// Default tour configuration
export const DEFAULT_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'カンバンボードへようこそ！',
    description: 'このツアーでは、タスク管理の基本機能をご紹介します。',
    target: '[data-testid="kanban-board"]',
    position: 'bottom'
  },
  {
    id: 'columns',
    title: '状態列について',
    description: 'タスクは左から右へと進行します。各列は異なる状態を表します。',
    target: '[data-testid="board-columns"]',
    position: 'bottom'
  },
  {
    id: 'add-task',
    title: '新しいタスクの追加',
    description: '各列の「＋」ボタンをクリックして新しいタスクを追加できます。',
    target: '.addTaskButton',
    position: 'left'
  },
  {
    id: 'task-card',
    title: 'タスクカード',
    description: 'タスクカードをクリックして編集、ドラッグして移動できます。',
    target: '.taskCard',
    position: 'top'
  },
  {
    id: 'settings',
    title: 'カスタム状態設定',
    description: '設定ボタンからカスタム状態を作成・編集できます。',
    target: '[data-testid="settings-button"]',
    position: 'bottom',
    action: {
      type: 'highlight',
      delay: 1000
    }
  },
  {
    id: 'demo-controls',
    title: 'デモ機能',
    description: 'サンプルワークフローを試してシステムの動作を確認できます。',
    target: '.demoControls',
    position: 'left',
    optional: true
  }
];