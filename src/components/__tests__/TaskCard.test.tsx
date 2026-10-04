/**
 * Unit tests for TaskCard component
 * Testing basic functionality without drag-and-drop
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TaskCard } from '../TaskCard';
import { Task } from '../../types/Task';

describe('TaskCard', () => {
  const mockTask: Task = {
    id: '1',
    title: 'Test Task',
    description: 'Test description for the task',
    status: 'TODO',
    createdAt: new Date('2024-01-01T10:00:00.000Z'),
    updatedAt: new Date('2024-01-01T11:00:00.000Z')
  };

  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders task information correctly', () => {
    render(
      <TaskCard 
        task={mockTask} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
      />
    );

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test description for the task')).toBeInTheDocument();
  });

  test('displays created and updated dates', () => {
    render(
      <TaskCard 
        task={mockTask} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
      />
    );

    expect(screen.getByText(/作成:/)).toBeInTheDocument();
    expect(screen.getByText(/更新:/)).toBeInTheDocument();
  });

  test('renders edit and delete buttons', () => {
    render(
      <TaskCard 
        task={mockTask} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
      />
    );

    expect(screen.getByTestId('edit-task-1')).toBeInTheDocument();
    expect(screen.getByTestId('delete-task-1')).toBeInTheDocument();
  });

  test('calls onEdit when edit button is clicked', () => {
    render(
      <TaskCard 
        task={mockTask} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
      />
    );

    fireEvent.click(screen.getByTestId('edit-task-1'));
    expect(mockOnEdit).toHaveBeenCalledWith(mockTask);
  });

  test('calls onDelete when delete button is clicked', () => {
    render(
      <TaskCard 
        task={mockTask} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
      />
    );

    fireEvent.click(screen.getByTestId('delete-task-1'));
    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });

  test('renders without description when description is empty', () => {
    const taskWithoutDescription = {
      ...mockTask,
      description: ''
    };

    render(
      <TaskCard 
        task={taskWithoutDescription} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
      />
    );

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.queryByText('Test description for the task')).not.toBeInTheDocument();
  });

  test('has correct data-testid', () => {
    render(
      <TaskCard 
        task={mockTask} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
      />
    );

    expect(screen.getByTestId('task-card-1')).toBeInTheDocument();
  });
});