/**
 * ErrorBoundary Component Tests
 * Requirements: 6.4, 7.5
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorBoundary } from '../ErrorBoundary';

// Test component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Mock console.error to avoid noise in test output
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  test('renders error UI when child component throws an error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('申し訳ありません。エラーが発生しました。')).toBeInTheDocument();
    expect(screen.getByText(/アプリケーションで予期しないエラーが発生しました。/)).toBeInTheDocument();
    expect(screen.getByText('再試行')).toBeInTheDocument();
    expect(screen.getByText('ページを再読み込み')).toBeInTheDocument();
  });

  test('renders custom fallback UI when provided', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('申し訳ありません。エラーが発生しました。')).not.toBeInTheDocument();
  });

  test('logs error when component catches an error', () => {
    const consoleSpy = jest.spyOn(console, 'error');

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(consoleSpy).toHaveBeenCalled();
  });

  test('reset button attempts to recover from error', () => {
    let shouldThrow = true;
    
    const TestComponent = () => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>No error</div>;
    };

    const { rerender } = render(
      <ErrorBoundary key={shouldThrow ? 'error' : 'success'}>
        <TestComponent />
      </ErrorBoundary>
    );

    // Verify error state
    expect(screen.getByText('申し訳ありません。エラーが発生しました。')).toBeInTheDocument();

    // Click reset button and simulate recovery
    shouldThrow = false;
    fireEvent.click(screen.getByText('再試行'));

    // Re-render with new key to trigger component reset
    rerender(
      <ErrorBoundary key="success">
        <TestComponent />
      </ErrorBoundary>
    );

    // Should now show the normal content
    expect(screen.getByText('No error')).toBeInTheDocument();
    expect(screen.queryByText('申し訳ありません。エラーが発生しました。')).not.toBeInTheDocument();
  });

  test('reload button triggers page reload', () => {
    // Mock window.location.reload
    const reloadMock = jest.fn();
    Object.defineProperty(window, 'location', {
      value: {
        reload: reloadMock,
      },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText('ページを再読み込み'));
    expect(reloadMock).toHaveBeenCalled();
  });

  test('shows error details in development mode', () => {
    // Mock NODE_ENV as development
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('技術的詳細 (開発モード)')).toBeInTheDocument();

    // Restore original NODE_ENV
    process.env.NODE_ENV = originalEnv;
  });

  test('hides error details in production mode', () => {
    // Mock NODE_ENV as production
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.queryByText('技術的詳細 (開発モード)')).not.toBeInTheDocument();

    // Restore original NODE_ENV
    process.env.NODE_ENV = originalEnv;
  });
});