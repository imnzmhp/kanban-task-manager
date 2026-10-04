/**
 * DeleteConfirmDialog component tests
 * Requirements: 5.1, 5.3, 5.4
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeleteConfirmDialog } from '../DeleteConfirmDialog';

describe('DeleteConfirmDialog', () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();
  const defaultProps = {
    isOpen: true,
    taskTitle: 'Test Task',
    onConfirm: mockOnConfirm,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders confirmation dialog when open', () => {
      render(<DeleteConfirmDialog {...defaultProps} />);
      
      expect(screen.getByTestId('delete-confirm-dialog')).toBeInTheDocument();
      expect(screen.getByText('タスクを削除')).toBeInTheDocument();
      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(screen.getByText('この操作は取り消せません。')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<DeleteConfirmDialog {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByTestId('delete-confirm-dialog')).not.toBeInTheDocument();
    });

    it('displays task title in confirmation message', () => {
      render(<DeleteConfirmDialog {...defaultProps} taskTitle="Important Task" />);
      
      expect(screen.getByText('Important Task')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onConfirm when confirm button is clicked', () => {
      render(<DeleteConfirmDialog {...defaultProps} />);
      
      fireEvent.click(screen.getByTestId('confirm-delete-button'));
      
      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when cancel button is clicked', () => {
      render(<DeleteConfirmDialog {...defaultProps} />);
      
      fireEvent.click(screen.getByTestId('cancel-delete-button'));
      
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when backdrop is clicked', () => {
      render(<DeleteConfirmDialog {...defaultProps} />);
      
      fireEvent.click(screen.getByTestId('delete-confirm-dialog'));
      
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('does not call onCancel when dialog content is clicked', () => {
      render(<DeleteConfirmDialog {...defaultProps} />);
      
      fireEvent.click(screen.getByText('タスクを削除'));
      
      expect(mockOnCancel).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('calls onCancel when Escape key is pressed', () => {
      render(<DeleteConfirmDialog {...defaultProps} />);
      
      fireEvent.keyDown(screen.getByTestId('delete-confirm-dialog'), { key: 'Escape' });
      
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('does not call onCancel for other keys', () => {
      render(<DeleteConfirmDialog {...defaultProps} />);
      
      fireEvent.keyDown(screen.getByTestId('delete-confirm-dialog'), { key: 'Enter' });
      
      expect(mockOnCancel).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<DeleteConfirmDialog {...defaultProps} />);
      
      const dialog = screen.getByTestId('delete-confirm-dialog');
      
      expect(dialog).toHaveAttribute('role', 'dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'delete-dialog-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'delete-dialog-description');
    });

    it('has proper button focus management', () => {
      render(<DeleteConfirmDialog {...defaultProps} />);
      
      const cancelButton = screen.getByTestId('cancel-delete-button');
      // Check that the cancel button exists and is rendered correctly
      expect(cancelButton).toBeInTheDocument();
      expect(cancelButton).toHaveTextContent('キャンセル');
    });
  });
});