/**
 * App - Main application component
 * Requirements: 7.1 - Responsive design, 全要件統合 (All requirements integration)
 * Requirements: 6.1, 6.2, 6.3, 6.4 - Data persistence integration
 */

import './App.css';
import { AppProviders } from './contexts';
import { ToastContainer, ErrorBoundary, KanbanBoard, AppInitializer } from './components';

/**
 * Main App component that provides the overall layout and integrates all features:
 * - AppInitializer for proper data persistence startup sequence
 * - TaskContext Provider for global state management
 * - ErrorBoundary for error handling
 * - Toast notifications for user feedback
 * - KanbanBoard as the main UI component
 * - Responsive design with mobile/desktop support
 */
function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <AppInitializer>
          <div className="app">
            {/* Skip navigation for accessibility */}
            <a href="#main-content" className="skip-link">
              メインコンテンツにスキップ
            </a>
            
            <header className="app-header">
              <div className="responsive-container">
                <h1 className="app-title">カンバンタスク管理システム</h1>
                <p className="app-subtitle tablet-up">タスクを効率的に管理しましょう</p>
              </div>
            </header>
            
            <main id="main-content" className="app-main">
              <div className="responsive-container">
                <KanbanBoard />
              </div>
            </main>
            
            <footer className="app-footer desktop-up">
              <div className="responsive-container">
                <p>&copy; 2024 Kanban Task Manager. すべてのデータはブラウザに保存されます。</p>
              </div>
            </footer>
          </div>
        </AppInitializer>
        <ToastContainer />
      </AppProviders>
    </ErrorBoundary>
  );
}

export default App;