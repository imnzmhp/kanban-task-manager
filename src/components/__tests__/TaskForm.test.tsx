/**
 * TaskForm component tests
 * Requirements: 1.1, 1.2, 1.3, 4.1, 4.2, 4.3
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskForm } from '../TaskForm';
import { TaskProvider } from '../../contexts/TaskContext';
import { Task } from '../../types/Task';

// Mock the TaskRepository to avoid actual localStorage calls
jest.mock('../../services/TaskRepository', () => ({
  TaskRepository: {
    getAllTasks: jest.fn().mockResolvedValue([]),
    saveTask: jest.fn().mockResolvedValue(undefined),
    deleteTask: jest.fn().mockResolvedValue(undefined),
  }
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <TaskProvider>{children}</TaskProvider>
);

describe('TaskForm', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  const defaultProps = {
    onSave: mockOnSave,
    onCancel: mockOnCancel,
    isOpen: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Form Display', () => {
    test('renders create form when no task is provided', () => {
      render(
        <TestWrapper>
          <TaskForm {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('新しいタスク')).toBeInTheDocument();
      expect(screen.getByLabelText(/タイトル/)).toHaveValue('');
      expect(screen.getByLabelText(/説明/)).toHaveValue('');
    });

    test('renders edit form when task is provided', () => {
      const mockTask: Task = {
        id: '1',
        title: 'テストタスク',
        description: 'テスト説明',
        status: 'TODO',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      render(
        <TestWrapper>
          <TaskForm {...defaultProps} task={mockTask} />
        </TestWrapper>
      );

      expect(screen.getByText('タスクを編集')).toBeInTheDocument();
      expect(screen.getByLabelText(/タイトル/)).toHaveValue('テストタスク');
      expect(screen.getByLabelText(/説明/)).toHaveValue('テスト説明');
    });

    test('does not render when isOpen is false', () => {
      render(
        <TestWrapper>
          <TaskForm {...defaultProps} isOpen={false} />
        </TestWrapper>
      );

      expect(screen.queryByText('新しいタスク')).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    test('shows validation error when submitting empty title', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <TaskForm {...defaultProps} />
        </TestWrapper>
      );

      const form = screen.getByRole('dialog').querySelector('form');
      
      // Submit the form directly to trigger validation
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(screen.getByText('タイトルは必須です')).toBeInTheDocument();
      });
    });

    test('shows validation error for title exceeding 200 characters', async () => {
      const user = userEvent.setup();
      const longTitle = 'a'.repeat(201);

      render(
        <TestWrapper>
          <TaskForm {...defaultProps} />
        </TestWrapper>
      );

      const titleInput = screen.getByLabelText(/タイトル/);
      
      await user.clear(titleInput);
      await user.type(titleInput, longTitle);

      const form = screen.getByRole('dialog').querySelector('form');
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(screen.getByText('タイトルは200文字以内で入力してください')).toBeInTheDocument();
      });
    });

    test('save button is disabled when form has no changes', () => {
      render(
        <TestWrapper>
          <TaskForm {...defaultProps} />
        </TestWrapper>
      );

      const saveButton = screen.getByText('保存');
      expect(saveButton).toBeDisabled();
    });

    test('save button is enabled when form has valid changes', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <TaskForm {...defaultProps} />
        </TestWrapper>
      );

      const titleInput = screen.getByLabelText(/タイトル/);
      const saveButton = screen.getByText('保存');

      await user.type(titleInput, 'Valid Title');
      
      await waitFor(() => {
        expect(saveButton).toBeEnabled();
      });
    });
  });

  describe('Form Interaction', () => {
    test('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <TaskForm {...defaultProps} />
        </TestWrapper>
      );

      const cancelButton = screen.getByText('キャンセル');
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    test('calls onCancel when close button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <TaskForm {...defaultProps} />
        </TestWrapper>
      );

      const closeButton = screen.getByLabelText('フォームを閉じる');
      await user.click(closeButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    test('calls onCancel when backdrop is clicked', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <TaskForm {...defaultProps} />
        </TestWrapper>
      );

      const backdrop = screen.getByRole('dialog');
      await user.click(backdrop);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    test('calls onSave when form is submitted with valid data', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <TaskForm {...defaultProps} />
        </TestWrapper>
      );

      const titleInput = screen.getByLabelText(/タイトル/);
      const descriptionInput = screen.getByLabelText(/説明/);
      const saveButton = screen.getByText('保存');

      await user.type(titleInput, 'テストタスク');
      await user.type(descriptionInput, 'テスト説明');

      await waitFor(() => {
        expect(saveButton).toBeEnabled();
      });

      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          title: 'テストタスク',
          description: 'テスト説明',
        });
      });
    });
  });

  describe('Character Count Display', () => {
    test('shows character count for title', () => {
      render(
        <TestWrapper>
          <TaskForm {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('0/200文字')).toBeInTheDocument();
    });

    test('shows character count for description', () => {
      render(
        <TestWrapper>
          <TaskForm {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('0/1000文字')).toBeInTheDocument();
    });

    test('updates character count as user types', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <TaskForm {...defaultProps} />
        </TestWrapper>
      );

      const titleInput = screen.getByLabelText(/タイトル/);
      await user.type(titleInput, 'Test');

      expect(screen.getByText('4/200文字')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA attributes', () => {
      render(
        <TestWrapper>
          <TaskForm {...defaultProps} />
        </TestWrapper>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'task-form-title');
    });

    test('title input receives focus when opened', () => {
      render(
        <TestWrapper>
          <TaskForm {...defaultProps} />
        </TestWrapper>
      );

      const titleInput = screen.getByLabelText(/タイトル/);
      expect(titleInput).toHaveFocus();
    });
  });
});