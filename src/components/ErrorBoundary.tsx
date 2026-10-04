/**
 * ErrorBoundary Component
 * React Error Boundary for catching and handling React component errors
 * Requirements: 6.4, 7.5
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import styles from './ErrorBoundary.module.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * ErrorBoundary component that catches JavaScript errors in React component tree
 * and displays a fallback UI instead of crashing the entire application
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  /**
   * Static method called when an error occurs during rendering
   * Updates state to show error UI on next render
   */
  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }

  /**
   * Called when an error has been thrown by a descendant component
   * Used for error logging and reporting
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);
    
    // Update state with error info for debugging purposes
    this.setState({
      error,
      errorInfo
    });

    // In a real application, you might want to report this to an error reporting service
    // Example: reportErrorToService(error, errorInfo);
  }

  /**
   * Reset error state - useful for retry functionality
   */
  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined
    });
  };

  /**
   * Reload the entire page - last resort recovery
   */
  private handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Check if a custom fallback UI is provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error fallback UI
      return (
        <div className={styles.errorBoundary}>
          <div className={styles.errorBoundaryContainer}>
            <div className={styles.errorBoundaryIcon}>
              ⚠️
            </div>
            <h2 className={styles.errorBoundaryTitle}>
              申し訳ありません。エラーが発生しました。
            </h2>
            <p className={styles.errorBoundaryMessage}>
              アプリケーションで予期しないエラーが発生しました。
              以下のボタンでアプリケーションの復旧を試してください。
            </p>
            
            <div className={styles.errorBoundaryActions}>
              <button 
                className={`${styles.errorBoundaryButton} ${styles.errorBoundaryButtonPrimary}`}
                onClick={this.handleReset}
              >
                再試行
              </button>
              <button 
                className={`${styles.errorBoundaryButton} ${styles.errorBoundaryButtonSecondary}`}
                onClick={this.handleReload}
              >
                ページを再読み込み
              </button>
            </div>

            {/* Show error details in development mode */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className={styles.errorBoundaryDetails}>
                <summary className={styles.errorBoundaryDetailsSummary}>
                  技術的詳細 (開発モード)
                </summary>
                <div className={styles.errorBoundaryErrorInfo}>
                  <h4>エラーメッセージ:</h4>
                  <pre className={styles.errorBoundaryErrorMessage}>
                    {this.state.error.message}
                  </pre>
                  
                  <h4>スタックトレース:</h4>
                  <pre className={styles.errorBoundaryErrorStack}>
                    {this.state.error.stack}
                  </pre>
                  
                  {this.state.errorInfo && (
                    <>
                      <h4>コンポーネントスタック:</h4>
                      <pre className={styles.errorBoundaryComponentStack}>
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;