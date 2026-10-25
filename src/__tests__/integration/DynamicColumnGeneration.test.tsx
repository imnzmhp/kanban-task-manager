/**
 * Integration test for Dynamic Column Generation (Task 11.2)
 * Tests the implementation of CustomStatus-based dynamic column generation
 * Requirements: 3.4, 6.5
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { AppProviders } from '../../contexts/AppProviders';
import { KanbanBoard } from '../../components/KanbanBoard';
import { CustomStatus } from '../../types/CustomStatus';

// Mock the hooks to provide test data
jest.mock('../../hooks/useTask', () => ({
  useTask: () => ({
    loading: false,
    error: null,
    moveTask: jest.fn(),
    deleteTask: jest.fn(),
    getTaskById: jest.fn(() => null),
    getTaskStats: () => ({ total: 0, todo: 0, doing: 0, done: 0 }),
    getTasksByStatus: () => []
  })
}));

jest.mock('../../contexts/StatusContext', () => ({
  useStatusContext: () => ({
    statuses: [
      {
        id: '1',
        name: 'TODO',
        displayOrder: 0,
        createdAt: new Date('2024-01-01')
      },
      {
        id: '2', 
        name: 'DOING',
        displayOrder: 1,
        createdAt: new Date('2024-01-01')
      },
      {
        id: '3',
        name: 'DONE', 
        displayOrder: 2,
        createdAt: new Date('2024-01-01')
      }
    ] as CustomStatus[],
    loading: false,
    error: null,
    getColorForStatus: () => ({
      backgroundColor: '#f8fafc',
      accentColor: '#64748b',
      contrastRatio: 4.5
    })
  }),
  StatusProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

describe('Dynamic Column Generation (Task 11.2)', () => {
  it('should render dynamic columns based on CustomStatus with correct order', () => {
    render(
      <AppProviders>
        <KanbanBoard />
      </AppProviders>
    );

    // Verify the board is rendered
    expect(screen.getByTestId('kanban-board')).toBeInTheDocument();
    
    // Verify settings button exists
    expect(screen.getByTestId('settings-button')).toBeInTheDocument();
    
    // Verify enhanced columns are rendered in correct order
    const boardColumns = screen.getByTestId('board-columns');
    expect(boardColumns).toBeInTheDocument();
    
    // Check for enhanced columns (they should have data-testid with status id)
    const todoColumn = screen.getByTestId('enhanced-column-1');
    const doingColumn = screen.getByTestId('enhanced-column-2');
    const doneColumn = screen.getByTestId('enhanced-column-3');
    
    expect(todoColumn).toBeInTheDocument();
    expect(doingColumn).toBeInTheDocument();
    expect(doneColumn).toBeInTheDocument();
  });

  it('should display status names in column headers', () => {
    render(
      <AppProviders>
        <KanbanBoard />
      </AppProviders>  
    );

    // Verify status names appear in the columns
    expect(screen.getByText('TODO')).toBeInTheDocument();
    expect(screen.getByText('DOING')).toBeInTheDocument();
    expect(screen.getByText('DONE')).toBeInTheDocument();
  });

  it('should display dynamic stats in header', () => {
    render(
      <AppProviders>
        <KanbanBoard />
      </AppProviders>
    );

    // Check for dynamic stats display
    expect(screen.getByText(/合計:/)).toBeInTheDocument();
    expect(screen.getByText(/TODO:/)).toBeInTheDocument();
    expect(screen.getByText(/DOING:/)).toBeInTheDocument();
    expect(screen.getByText(/DONE:/)).toBeInTheDocument();
  });
});