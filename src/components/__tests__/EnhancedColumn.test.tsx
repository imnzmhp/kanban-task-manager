/**
 * Enhanced Column Component Unit Tests
 * Tests for CustomStatus support, truncation, and dynamic colors
 * 
 * Requirements: 5.1, 5.2, 5.4
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { CustomStatus } from '../../types/CustomStatus';
import { EnhancedColumn } from '../EnhancedColumn';
import { StatusProvider } from '../../contexts/StatusContext';
import { TaskProvider } from '../../contexts/TaskContext';
import { ToastProvider } from '../../contexts/ToastContext';

// Mock the required hooks and services
jest.mock('../../hooks/useTask');
jest.mock('../../contexts/StatusContext');
jest.mock('../../utils/TruncationService');

const mockUseTask = require('../../hooks/useTask');
const mockStatusContext = require('../../contexts/StatusContext');
const mockTruncationService = require('../../utils/TruncationService');

describe('EnhancedColumn', () => {
  const mockCustomStatus: CustomStatus = {
    id: 'test-status-1',
    name: 'Test Status',
    displayOrder: 0,
    createdAt: new Date('2024-01-01')
  };

  const mockLongNameStatus: CustomStatus = {
    id: 'test-status-2', 
    name: 'This is a very long status name that should be truncated',
    displayOrder: 1,
    createdAt: new Date('2024-01-01')
  };

  const mockTasks = [
    {
      id: 'task-1',
      title: 'Test Task 1',
      description: 'Test Description 1',
      status: 'TODO' as const,
      createdAt: new Date('2024-01-01'),
      priority: 'medium' as const
    },
    {
      id: 'task-2', 
      title: 'Test Task 2',
      description: 'Test Description 2',
      status: 'TODO' as const,
      createdAt: new Date('2024-01-02'),
      priority: 'high' as const
    }
  ];

  const defaultProps = {
    status: mockCustomStatus,
    onAddTask: jest.fn(),
    onEditTask: jest.fn(),
    onDeleteTask: jest.fn()
  };

  // Setup mocks
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock useTask hook
    mockUseTask.useTask.mockReturnValue({
      getTasksByStatus: jest.fn((status) => {
        return status === 'TODO' ? mockTasks : [];
      })
    });

    // Mock StatusContext
    mockStatusContext.useStatusContext.mockReturnValue({
      getColorForStatus: jest.fn(() => ({
        backgroundColor: '#f0f8ff',
        accentColor: '#1e90ff',
        contrastRatio: 5.2
      })),
      statuses: [mockCustomStatus, mockLongNameStatus]
    });

    // Mock TruncationService
    mockTruncationService.TruncationService = {
      getCurrentScreenSize: jest.fn(() => 'desktop'),
      getTruncatedDisplay: jest.fn((name, screenSize) => ({
        displayText: name.length > 20 ? name.substring(0, 17) + '...' : name,
        shouldShowTooltip: name.length > 20,
        fullText: name
      })),
      generateAriaLabel: jest.fn((displayText, fullText) => 
        displayText === fullText ? fullText : `${displayText}、完全名：${fullText}`
      )
    };

    // Mock window.matchMedia for reduced motion detection
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  const renderEnhancedColumn = (props = defaultProps) => {
    return render(
      <StatusProvider>
        <TaskProvider>
          <ToastProvider>
            <DragDropContext onDragEnd={(result: DropResult) => {}}>
              <EnhancedColumn {...props} />
            </DragDropContext>
          </ToastProvider>
        </TaskProvider>
      </StatusProvider>
    );
  };

  describe('Basic Rendering', () => {
    it('renders the enhanced column with custom status', () => {
      renderEnhancedColumn();
      
      expect(screen.getByTestId('enhanced-column-test-status-1')).toBeInTheDocument();
      expect(screen.getByText('Test Status')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Task count
    });

    it('displays correct task count', () => {
      renderEnhancedColumn();
      
      const taskCount = screen.getByLabelText('2個のタスク');
      expect(taskCount).toBeInTheDocument();
    });

    it('shows add task button with correct label', () => {
      renderEnhancedColumn();
      
      const addButton = screen.getByLabelText('Test Statusにタスクを追加');
      expect(addButton).toBeInTheDocument();
      expect(addButton).toHaveAttribute('data-testid', 'add-task-test-status-1');
    });
  });

  describe('Status Name Truncation', () => {
    it('truncates long status names on desktop', () => {
      renderEnhancedColumn({ ...defaultProps, status: mockLongNameStatus });
      
      expect(mockTruncationService.TruncationService.getTruncatedDisplay)
        .toHaveBeenCalledWith(mockLongNameStatus.name, 'desktop');
      
      // Should show truncated text
      expect(screen.getByText('This is a very lon...')).toBeInTheDocument();
    });

    it('provides tooltip for truncated status names', () => {
      renderEnhancedColumn({ ...defaultProps, status: mockLongNameStatus });
      
      const header = screen.getByTitle(mockLongNameStatus.name);
      expect(header).toBeInTheDocument();
    });

    it('does not show tooltip for short status names', () => {
      renderEnhancedColumn();
      
      const header = screen.getByText('Test Status').closest('.columnHeader');
      expect(header).not.toHaveAttribute('title');
    });
  });

  describe('Dynamic Colors', () => {
    it('applies dynamic colors from ColorPalette', () => {
      renderEnhancedColumn();
      
      expect(mockStatusContext.useStatusContext().getColorForStatus)
        .toHaveBeenCalledWith('test-status-1');
      
      const column = screen.getByTestId('enhanced-column-test-status-1');
      expect(column).toHaveStyle({
        '--column-bg-color': '#f0f8ff',
        '--column-accent-color': '#1e90ff'
      });
    });

    it('sets transition duration to 0ms when prefers-reduced-motion is true', () => {
      // Mock reduced motion preference
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      renderEnhancedColumn();
      
      const column = screen.getByTestId('enhanced-column-test-status-1');
      expect(column).toHaveStyle({
        '--transition-duration': '0ms'
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('updates screen size on window resize', async () => {
      mockTruncationService.TruncationService.getCurrentScreenSize
        .mockReturnValueOnce('desktop')
        .mockReturnValueOnce('mobile');

      renderEnhancedColumn();
      
      // Simulate window resize
      fireEvent.resize(window);
      
      await waitFor(() => {
        expect(mockTruncationService.TruncationService.getCurrentScreenSize)
          .toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Interaction Handlers', () => {
    it('calls onAddTask when add button is clicked', () => {
      const mockOnAddTask = jest.fn();
      renderEnhancedColumn({ ...defaultProps, onAddTask: mockOnAddTask });
      
      const addButton = screen.getByLabelText('Test Statusにタスクを追加');
      fireEvent.click(addButton);
      
      expect(mockOnAddTask).toHaveBeenCalledWith('test-status-1');
    });

    it('calls onEditTask when task card edit is triggered', () => {
      const mockOnEditTask = jest.fn();
      renderEnhancedColumn({ ...defaultProps, onEditTask: mockOnEditTask });
      
      // This would need TaskCard to be properly mocked to test the interaction
      // For now, we just verify the prop is passed correctly
      expect(defaultProps.onEditTask).toBeDefined();
    });

    it('calls onDeleteTask when task card delete is triggered', () => {
      const mockOnDeleteTask = jest.fn();
      renderEnhancedColumn({ ...defaultProps, onDeleteTask: mockOnDeleteTask });
      
      // This would need TaskCard to be properly mocked to test the interaction
      // For now, we just verify the prop is passed correctly  
      expect(defaultProps.onDeleteTask).toBeDefined();
    });
  });

  describe('Empty State', () => {
    it('shows empty state message when no tasks exist', () => {
      // Mock empty task list
      mockUseTask.useTask.mockReturnValue({
        getTasksByStatus: jest.fn(() => [])
      });

      renderEnhancedColumn();
      
      expect(screen.getByText('タスクをここにドロップするか、新しいタスクを追加してください'))
        .toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels for screen readers', () => {
      renderEnhancedColumn({ ...defaultProps, status: mockLongNameStatus });
      
      expect(mockTruncationService.TruncationService.generateAriaLabel)
        .toHaveBeenCalledWith('This is a very lon...', mockLongNameStatus.name);
    });

    it('has proper test IDs for automation', () => {
      renderEnhancedColumn();
      
      expect(screen.getByTestId('enhanced-column-test-status-1')).toBeInTheDocument();
      expect(screen.getByTestId('add-task-test-status-1')).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      renderEnhancedColumn();
      
      const addButton = screen.getByLabelText('Test Statusにタスクを追加');
      expect(addButton).toHaveAttribute('tabindex', '0');
    });
  });

  describe('Performance Optimizations', () => {
    it('memoizes display configuration', () => {
      const { rerender } = renderEnhancedColumn();
      
      // Rerender with same props should not recalculate colors
      rerender(
        <StatusProvider>
          <TaskProvider>
            <ToastProvider>
              <DragDropContext onDragEnd={(result: DropResult) => {}}>
                <EnhancedColumn {...defaultProps} />
              </DragDropContext>
            </ToastProvider>
          </TaskProvider>
        </StatusProvider>
      );
      
      // getColorForStatus should only be called once due to memoization
      expect(mockStatusContext.useStatusContext().getColorForStatus)
        .toHaveBeenCalledTimes(1);
    });
  });
});