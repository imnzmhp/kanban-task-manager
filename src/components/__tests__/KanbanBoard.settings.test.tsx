/**
 * Test file for KanbanBoard settings button functionality
 * Requirements: 6.1, 6.2
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { KanbanBoard } from '../KanbanBoard';
import { AppProviders } from '../../contexts/AppProviders';

// Mock the AppInitializer to avoid initialization issues in tests
jest.mock('../AppInitializer', () => ({
  AppInitializer: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

const renderKanbanBoardWithProviders = () => {
  return render(
    <AppProviders>
      <KanbanBoard />
    </AppProviders>
  );
};

describe('KanbanBoard Settings Button', () => {
  test('should render settings button in board header', () => {
    renderKanbanBoardWithProviders();
    
    const settingsButton = screen.getByTestId('settings-button');
    expect(settingsButton).toBeInTheDocument();
    expect(settingsButton).toHaveAttribute('aria-label', 'ステータス設定を開く');
    expect(settingsButton).toHaveAttribute('title', '設定');
  });

  test('should open status settings modal when settings button is clicked', () => {
    renderKanbanBoardWithProviders();
    
    const settingsButton = screen.getByTestId('settings-button');
    
    // Initially, modal should not be visible
    expect(screen.queryByTestId('status-settings-modal')).not.toBeInTheDocument();
    
    // Click settings button
    fireEvent.click(settingsButton);
    
    // Modal should now be visible
    expect(screen.getByTestId('status-settings-modal')).toBeInTheDocument();
  });

  test('should close modal when close button is clicked', () => {
    renderKanbanBoardWithProviders();
    
    const settingsButton = screen.getByTestId('settings-button');
    fireEvent.click(settingsButton);
    
    // Modal should be open
    expect(screen.getByTestId('status-settings-modal')).toBeInTheDocument();
    
    // Click close button
    const closeButton = screen.getByTestId('close-modal-button');
    fireEvent.click(closeButton);
    
    // Modal should be closed
    expect(screen.queryByTestId('status-settings-modal')).not.toBeInTheDocument();
  });

  test('settings button should have proper accessibility attributes', () => {
    renderKanbanBoardWithProviders();
    
    const settingsButton = screen.getByTestId('settings-button');
    
    expect(settingsButton).toHaveAttribute('type', 'button');
    expect(settingsButton).toHaveAttribute('aria-label', 'ステータス設定を開く');
    expect(settingsButton).toHaveAttribute('title', '設定');
    
    // Should be focusable
    settingsButton.focus();
    expect(settingsButton).toHaveFocus();
  });

  test('should contain gear icon from react-icons', () => {
    renderKanbanBoardWithProviders();
    
    const settingsButton = screen.getByTestId('settings-button');
    
    // Check that the button contains an SVG (FiSettings renders as SVG)
    const icon = settingsButton.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });
});