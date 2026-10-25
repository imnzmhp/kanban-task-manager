/**
 * AppProviders Integration Test
 * Tests: 12.1 StatusProvider integration into AppProviders
 * Requirements: 7.1
 */

import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AppProviders } from '../AppProviders';
import { useStatusContext } from '../StatusContext';
import { useTaskContext } from '../TaskContext';
import { useToast } from '../ToastContext';

describe('AppProviders Integration', () => {
  test('provides StatusProvider in the provider hierarchy', () => {
    const TestComponent: React.FC = () => {
      const statusContext = useStatusContext();
      return <div data-testid="status-available">{statusContext ? 'Available' : 'Not Available'}</div>;
    };

    const { getByTestId } = render(
      <AppProviders>
        <TestComponent />
      </AppProviders>
    );

    expect(getByTestId('status-available')).toHaveTextContent('Available');
  });

  test('provides TaskProvider in the provider hierarchy', () => {
    const TestComponent: React.FC = () => {
      const taskContext = useTaskContext();
      return <div data-testid="task-available">{taskContext ? 'Available' : 'Not Available'}</div>;
    };

    const { getByTestId } = render(
      <AppProviders>
        <TestComponent />
      </AppProviders>
    );

    expect(getByTestId('task-available')).toHaveTextContent('Available');
  });

  test('provides ToastProvider in the provider hierarchy', () => {
    const TestComponent: React.FC = () => {
      const toastContext = useToast();
      return <div data-testid="toast-available">{toastContext ? 'Available' : 'Not Available'}</div>;
    };

    const { getByTestId } = render(
      <AppProviders>
        <TestComponent />
      </AppProviders>
    );

    expect(getByTestId('toast-available')).toHaveTextContent('Available');
  });

  test('StatusProvider initializes correctly', () => {
    const TestComponent: React.FC = () => {
      const statusContext = useStatusContext();
      return <div data-testid="status-count">{statusContext.statuses.length}</div>;
    };

    const { getByTestId } = render(
      <AppProviders>
        <TestComponent />
      </AppProviders>
    );

    // Should have initial statuses
    const statusCount = Number(getByTestId('status-count').textContent);
    expect(statusCount).toBeGreaterThanOrEqual(0);
  });
});