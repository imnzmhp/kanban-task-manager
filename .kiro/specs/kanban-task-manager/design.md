# Technical Design Document

## Overview

本設計文書は、カンバン形式のタスク管理システムの技術実装について詳細に説明します。React/TypeScriptをベースとしたSingle Page Application (SPA)として構築し、ユーザーがタスクをTODO、DOING、DONEの3つのステータスで管理できるシステムを提供します。

### 主要機能
- タスクの作成、編集、削除機能
- ドラッグ&ドロップによるステータス変更
- カンバンボード形式の直感的なUI
- Local Storageによるデータ永続化
- レスポンシブデザイン対応

### 技術スタック
- **フロントエンド**: React 18, TypeScript 4.9+
- **UI/UX**: CSS Modules, react-beautiful-dnd
- **状態管理**: React Context API + useReducer
- **データ永続化**: Browser Local Storage API
- **開発環境**: Vite, ESLint, Prettier

## Architecture

### システムアーキテクチャ概要

```
┌─────────────────────────────────────────────────────┐
│                   Browser                           │
├─────────────────────────────────────────────────────┤
│  Presentation Layer (React Components)              │
│  ├── KanbanBoard                                    │
│  ├── TaskCard                                       │
│  ├── TaskForm                                       │
│  └── DeleteConfirmDialog                            │
├─────────────────────────────────────────────────────┤
│  State Management Layer                             │
│  ├── TaskContext (Global State)                     │
│  ├── TaskReducer (State Logic)                      │
│  └── Custom Hooks (useTask, usePersistence)         │
├─────────────────────────────────────────────────────┤
│  Data Access Layer                                  │
│  ├── LocalStorageService                            │
│  └── TaskRepository                                 │
├─────────────────────────────────────────────────────┤
│  Browser APIs                                       │
│  └── Local Storage                                  │
└─────────────────────────────────────────────────────┘
```

### レイヤー責任
- **Presentation Layer**: UIコンポーネントの表示とユーザーインタラクション
- **State Management Layer**: アプリケーション状態の管理と更新ロジック
- **Data Access Layer**: データ永続化と取得の抽象化
- **Browser APIs**: ブラウザ固有のAPIへのアクセス
## Components and Interfaces

### コアコンポーネント設計

#### 1. KanbanBoard コンポーネント
メインのカンバンボードを表示するルートコンポーネント。

```typescript
interface KanbanBoardProps {}

const KanbanBoard: React.FC<KanbanBoardProps> = () => {
  // 3つの列（TODO, DOING, DONE）を表示
  // ドラッグ&ドロップコンテキストを提供
  // TaskContextからタスクデータを取得
}
```

#### 2. Column コンポーネント
各ステータス列（TODO/DOING/DONE）を表示。

```typescript
interface ColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onTaskDrop: (taskId: string, newStatus: TaskStatus) => void;
}

const Column: React.FC<ColumnProps> = ({ status, tasks, onTaskDrop }) => {
  // ドロップ可能エリアとして機能
  // 該当ステータスのタスクカードを表示
  // 新規タスク追加ボタンを含む
}
```

#### 3. TaskCard コンポーネント
個別のタスクカードを表示。

```typescript
interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete }) => {
  // ドラッグ可能な要素として実装
  // タスクのタイトル、説明、更新日時を表示
  // 編集・削除ボタンを提供
}
```

#### 4. TaskForm コンポーネント
タスクの作成・編集フォーム。

```typescript
interface TaskFormProps {
  task?: Task; // 編集時は既存タスク、新規作成時はundefined
  onSave: (taskData: TaskFormData) => void;
  onCancel: () => void;
  isOpen: boolean;
}

interface TaskFormData {
  title: string;
  description: string;
}

const TaskForm: React.FC<TaskFormProps> = ({ task, onSave, onCancel, isOpen }) => {
  // モーダル形式で表示
  // バリデーション機能を含む
  // タイトルは必須、説明はオプション
}
```

#### 5. DeleteConfirmDialog コンポーネント
削除確認ダイアログ。

```typescript
interface DeleteConfirmDialogProps {
  isOpen: boolean;
  taskTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen, taskTitle, onConfirm, onCancel
}) => {
  // タスク名を含む確認メッセージを表示
  // 確認・キャンセルボタンを提供
}
```
### 状態管理インターフェース

#### TaskContext
グローバル状態を提供するReact Context。

```typescript
interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

interface TaskContextValue {
  state: TaskState;
  dispatch: React.Dispatch<TaskAction>;
  // 便利メソッド
  createTask: (taskData: TaskFormData) => void;
  updateTask: (taskId: string, taskData: TaskFormData) => void;
  deleteTask: (taskId: string) => void;
  moveTask: (taskId: string, newStatus: TaskStatus) => void;
}
```

#### TaskActions
Reducerで処理するアクション定義。

```typescript
type TaskAction =
  | { type: 'LOAD_TASKS_START' }
  | { type: 'LOAD_TASKS_SUCCESS'; payload: Task[] }
  | { type: 'LOAD_TASKS_ERROR'; payload: string }
  | { type: 'CREATE_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: { id: string; updates: Partial<Task> } }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'MOVE_TASK'; payload: { id: string; status: TaskStatus } };
```

### データアクセス層

#### LocalStorageService
Local Storageへのアクセスを抽象化。

```typescript
class LocalStorageService {
  private static readonly TASKS_KEY = 'kanban-tasks';

  static saveTasks(tasks: Task[]): void {
    // タスク配列をJSON形式でLocal Storageに保存
    // エラーハンドリングを含む
  }

  static loadTasks(): Task[] {
    // Local StorageからタスクデータをJSONとして読み込み
    // パースエラーやデータ不正の処理を含む
  }

  static clearTasks(): void {
    // Local Storageからタスクデータを削除
  }
}
```

#### TaskRepository
タスクデータ操作の高レベルAPI。

```typescript
class TaskRepository {
  static async getAllTasks(): Promise<Task[]> {
    // Local Storageからタスク一覧を取得
    // データ検証とエラーハンドリングを含む
  }

  static async saveTask(task: Task): Promise<void> {
    // 単一タスクの保存（新規作成・更新共通）
  }

  static async deleteTask(taskId: string): Promise<void> {
    // 指定タスクの削除
  }
}
```
## Data Models

### Task エンティティ
システムの中心となるタスクデータモデル。

```typescript
interface Task {
  id: string;           // UUID形式の一意識別子
  title: string;        // タスクタイトル（必須、1-200文字）
  description: string;  // タスクの詳細説明（オプション、最大1000文字）
  status: TaskStatus;   // 現在のステータス
  createdAt: Date;      // 作成日時
  updatedAt: Date;      // 最終更新日時
}

type TaskStatus = 'TODO' | 'DOING' | 'DONE';
```

### フォームデータモデル
タスク作成・編集時に使用するデータ構造。

```typescript
interface TaskFormData {
  title: string;
  description: string;
}

interface TaskFormValidation {
  title: string[];     // タイトルのエラーメッセージ配列
  description: string[]; // 説明のエラーメッセージ配列
}
```

### UI状態モデル
UI固有の状態を管理するデータ構造。

```typescript
interface UIState {
  activeForm: {
    isOpen: boolean;
    mode: 'create' | 'edit';
    taskId?: string;
  };
  deleteDialog: {
    isOpen: boolean;
    taskId?: string;
    taskTitle?: string;
  };
  dragState: {
    isDragging: boolean;
    draggedTaskId?: string;
  };
}
```

### Local Storage データ構造
永続化されるデータの構造定義。

```typescript
interface StoredData {
  tasks: Task[];
  version: string;      // データスキーマのバージョン管理
  lastSaved: string;    // 最終保存日時（ISO文字列）
}
```

### バリデーションルール

#### タスクタイトル
- 必須入力
- 1文字以上、200文字以下
- 先頭・末尾の空白は自動トリム
- HTMLタグは無効化

#### タスク説明
- オプション入力  
- 最大1000文字
- 改行を含む文字列対応
- HTMLタグは無効化

#### ステータス変更
- 有効なステータス値のみ許可
- 循環参照チェック（将来の拡張用）
## Error Handling

### エラー分類と対応戦略

#### 1. Local Storage エラー
**原因**: ストレージ容量不足、プライベートブラウジング、データ破損

**対応策**:
```typescript
class StorageError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'StorageError';
  }
}

const handleStorageError = (error: StorageError) => {
  // フォールバック用のメモリストレージに切り替え
  // ユーザーに永続化不可の旨を通知
  // データエクスポート機能を提案
};
```

#### 2. データバリデーションエラー
**原因**: 不正な入力値、データスキーマ不整合

**対応策**:
```typescript
interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
}

const validateTaskData = (data: TaskFormData): ValidationResult => {
  const errors: Record<string, string[]> = {};
  
  if (!data.title.trim()) {
    errors.title = ['タイトルは必須です'];
  } else if (data.title.length > 200) {
    errors.title = ['タイトルは200文字以内で入力してください'];
  }
  
  if (data.description.length > 1000) {
    errors.description = ['説明は1000文字以内で入力してください'];
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
```

#### 3. ドラッグ&ドロップエラー
**原因**: 不正な移動先、システム制約違反

**対応策**:
```typescript
const handleDragError = (taskId: string, targetStatus: TaskStatus) => {
  // 無効な移動をロールバック
  // ユーザーに操作失敗を通知
  // 元の位置にタスクを戻す
  console.warn(`タスク移動に失敗しました: ${taskId} → ${targetStatus}`);
};
```

### グローバルエラーハンドリング

#### ErrorBoundary コンポーネント
Reactのエラーバウンダリーで予期しないエラーをキャッチ。

```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class AppErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('アプリケーションエラー:', error, errorInfo);
    // 必要に応じてエラー報告サービスに送信
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>申し訳ありません。エラーが発生しました。</h2>
          <button onClick={() => window.location.reload()}>
            ページを再読み込み
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### エラー表示UI

#### Toast通知システム
一時的なエラー・成功メッセージの表示。

```typescript
interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

const useToast = () => {
  // Toast表示ロジック
  // 自動消去タイマー
  // 複数メッセージのキュー管理
};
```
## Testing Strategy

### テスト戦略概要

このカンバンタスク管理システムは主にUI操作、レンダリング、外部API（Local Storage）、ユーザーインタラクションを中心とした機能で構成されているため、プロパティベーステストではなく、従来の単体テスト、統合テスト、E2Eテストの組み合わせでテストします。

### テスト分類と適用範囲

#### 1. 単体テスト (Unit Tests)
**対象**: 個別コンポーネント、カスタムフック、ユーティリティ関数

**使用ツール**: Jest、React Testing Library

**テスト例**:
```typescript
// TaskCard コンポーネントのテスト
describe('TaskCard', () => {
  test('タスク情報を正しく表示する', () => {
    const mockTask = {
      id: '1',
      title: 'テストタスク',
      description: 'テスト説明',
      status: 'TODO' as TaskStatus,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    render(<TaskCard task={mockTask} onEdit={jest.fn()} onDelete={jest.fn()} />);
    
    expect(screen.getByText('テストタスク')).toBeInTheDocument();
    expect(screen.getByText('テスト説明')).toBeInTheDocument();
  });
  
  test('編集ボタンクリックで編集コールバックが呼ばれる', () => {
    const mockOnEdit = jest.fn();
    render(<TaskCard task={mockTask} onEdit={mockOnEdit} onDelete={jest.fn()} />);
    
    fireEvent.click(screen.getByText('編集'));
    expect(mockOnEdit).toHaveBeenCalledWith(mockTask);
  });
});
```

#### 2. 統合テスト (Integration Tests)  
**対象**: コンポーネント間の相互作用、状態管理、データフロー

**テスト例**:
```typescript
// カンバンボード全体の統合テスト
describe('KanbanBoard Integration', () => {
  test('新しいタスクを作成してTODO列に表示される', () => {
    render(<App />);
    
    // タスク作成ボタンをクリック
    fireEvent.click(screen.getByText('新しいタスク'));
    
    // フォームに入力
    fireEvent.change(screen.getByLabelText('タイトル'), { 
      target: { value: '新しいタスク' } 
    });
    fireEvent.change(screen.getByLabelText('説明'), { 
      target: { value: 'タスクの説明' } 
    });
    
    // 保存ボタンをクリック
    fireEvent.click(screen.getByText('保存'));
    
    // TODO列にタスクが表示されることを確認
    const todoColumn = screen.getByTestId('column-TODO');
    expect(within(todoColumn).getByText('新しいタスク')).toBeInTheDocument();
  });
});
```

#### 3. スナップショットテスト (Snapshot Tests)
**対象**: UI コンポーネントの視覚的回帰テスト

**テスト例**:
```typescript
describe('Component Snapshots', () => {
  test('KanbanBoard renders correctly', () => {
    const tree = renderer.create(<KanbanBoard />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
```

#### 4. E2Eテスト (End-to-End Tests)
**対象**: ユーザーシナリオベースの全体テスト

**使用ツール**: Playwright または Cypress

**テスト例**:
```typescript
test('タスクのライフサイクル全体', async ({ page }) => {
  await page.goto('/');
  
  // タスク作成
  await page.click('[data-testid="add-task-button"]');
  await page.fill('[data-testid="task-title-input"]', 'E2Eテストタスク');
  await page.fill('[data-testid="task-description-input"]', 'E2Eテストの説明');
  await page.click('[data-testid="save-task-button"]');
  
  // タスクがTODO列に表示されることを確認
  await expect(page.locator('[data-testid="column-TODO"]')).toContainText('E2Eテストタスク');
  
  // ドラッグ&ドロップでDOING列に移動
  await page.dragAndDrop(
    '[data-testid="task-card-1"]',
    '[data-testid="column-DOING"]'
  );
  
  // DOING列に移動したことを確認
  await expect(page.locator('[data-testid="column-DOING"]')).toContainText('E2Eテストタスク');
  
  // タスク削除
  await page.click('[data-testid="delete-task-button"]');
  await page.click('[data-testid="confirm-delete-button"]');
  
  // タスクが削除されたことを確認
  await expect(page.locator('[data-testid="task-card-1"]')).not.toBeVisible();
});
```

### テスト設定とカバレッジ

#### カバレッジ目標
- **行カバレッジ**: 80%以上
- **関数カバレッジ**: 90%以上  
- **ブランチカバレッジ**: 75%以上

#### CI/CDでの自動テスト
```yaml
# GitHub Actions設定例
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: 18
    
    - name: Install dependencies
      run: npm ci
      
    - name: Run unit tests
      run: npm run test:unit
      
    - name: Run E2E tests  
      run: npm run test:e2e
      
    - name: Generate coverage report
      run: npm run test:coverage
```

### モック戦略

#### Local Storage のモック
```typescript
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});
```

#### Date のモック
```typescript
// 一貫した日時テストのため
jest.useFakeTimers();
jest.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
```