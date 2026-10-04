/**
 * Toast component unit tests
 * Requirements: 6.4, 7.5
 */

import { render, screen, fireEvent, act } from '@testing-library/react';
import { Toast } from '../Toast';
import { ToastMessage } from '../../types';

describe('Toast', () => {
  const mockOnClose = jest.fn();
  
  const defaultToast: ToastMessage = {
    id: 'test-toast-1',
    type: 'success',
    title: 'Success',
    message: 'Operation completed successfully',
    duration: 3000,
    createdAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders toast with all required elements', () => {
      render(<Toast toast={defaultToast} onClose={mockOnClose} />);
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Operation completed successfully')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /close success notification/i })).toBeInTheDocument();
    });

    test('renders correct icon for each toast type', () => {
      const types: Array<{ type: 'success' | 'error' | 'warning' | 'info'; label: string }> = [
        { type: 'success', label: 'close success notification' },
        { type: 'error', label: 'close error notification' },
        { type: 'warning', label: 'close warning notification' },
        { type: 'info', label: 'close info notification' }
      ];

      types.forEach(({ type, label }) => {
        const toast = { ...defaultToast, type, id: `toast-${type}` };
        const { rerender } = render(<Toast toast={toast} onClose={mockOnClose} />);
        
        expect(screen.getByRole('button', { name: new RegExp(label, 'i') })).toBeInTheDocument();
        
        rerender(<div />); // Clear for next iteration
      });
    });

    test('applies correct CSS classes based on toast type', () => {
      const types: ('success' | 'error' | 'warning' | 'info')[] = ['success', 'error', 'warning', 'info'];
      
      types.forEach(type => {
        const toast = { ...defaultToast, type, id: `toast-${type}` };
        const { container, rerender } = render(<Toast toast={toast} onClose={mockOnClose} />);
        
        const toastElement = container.querySelector('[role="alert"]');
        expect(toastElement).toHaveClass(type);
        
        rerender(<div />); // Clear for next iteration
      });
    });
  });

  describe('User Interaction', () => {
    test('calls onClose when close button is clicked', async () => {
      render(<Toast toast={defaultToast} onClose={mockOnClose} />);
      
      const closeButton = screen.getByRole('button', { name: /close success notification/i });
      fireEvent.click(closeButton);
      
      // Wait for the timeout in the component
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 250));
      });
      
      expect(mockOnClose).toHaveBeenCalledWith(defaultToast.id);
    });
  });

  describe('Progress Bar', () => {
    test('shows progress bar when duration is set', () => {
      const { container } = render(
        <Toast toast={defaultToast} onClose={mockOnClose} />
      );
      
      const progressBar = container.querySelector('[class*="progressBar"]');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveStyle({ 'animation-duration': '3000ms' });
    });

    test('does not show progress bar when duration is 0', () => {
      const toastWithoutDuration = { ...defaultToast, duration: 0 };
      const { container } = render(
        <Toast toast={toastWithoutDuration} onClose={mockOnClose} />
      );
      
      const progressBar = container.querySelector('[class*="progressBar"]');
      expect(progressBar).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has correct ARIA attributes', () => {
      render(<Toast toast={defaultToast} onClose={mockOnClose} />);
      
      const toast = screen.getByRole('alert');
      expect(toast).toHaveAttribute('aria-live', 'polite');
    });

    test('uses assertive aria-live for error toasts', () => {
      const errorToast = { ...defaultToast, type: 'error' as const };
      render(<Toast toast={errorToast} onClose={mockOnClose} />);
      
      const toast = screen.getByRole('alert');
      expect(toast).toHaveAttribute('aria-live', 'assertive');
    });

    test('close button has proper accessibility label', () => {
      render(<Toast toast={defaultToast} onClose={mockOnClose} />);
      
      const closeButton = screen.getByRole('button', { name: /close success notification/i });
      expect(closeButton).toHaveAttribute('aria-label', 'Close success notification');
    });
  });

  describe('Visibility', () => {
    test('initially renders visible', () => {
      const { container } = render(<Toast toast={defaultToast} onClose={mockOnClose} />);
      
      const toast = container.querySelector('[role="alert"]');
      expect(toast).toBeInTheDocument();
    });

    test('becomes invisible when close button is clicked', () => {
      const { container } = render(<Toast toast={defaultToast} onClose={mockOnClose} />);
      
      const closeButton = screen.getByRole('button', { name: /close success notification/i });
      fireEvent.click(closeButton);
      
      // The component should become invisible immediately
      const toast = container.querySelector('[role="alert"]');
      expect(toast).not.toBeInTheDocument();
    });
  });
});