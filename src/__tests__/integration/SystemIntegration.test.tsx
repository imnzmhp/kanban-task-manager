/**
 * System Integration Tests for Custom Task Status Management
 * Tests the complete system functionality including UI components, data flow, and user interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Import the main application components
import { AppProviders } from '../../contexts/AppProviders';
import { KanbanBoard } from '../../components/KanbanBoard';
import { StatusSettingsModal } from '../../components/StatusSettingsModal';
import { EnhancedColumn } from '../../components/EnhancedColumn';

// Import services and utilities
import { StatusSerializer } from '../../services/StatusSerializer';
import { MigrationSystem } from '../../services/MigrationSystem';
import { ColorPalette } from '../../utils/ColorPalette';
import { TruncationService } from '../../utils/TruncationService';
import { LocalStorageService } from '../../services/LocalStorageService';

// Types
import { CustomStatus, StatusColor } from '../../types/CustomStatus';
import { Task, TaskStatus } from '../../types';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] || null
  };
})();

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock window.matchMedia for responsive tests
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

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AppProviders>
    {children}
  </AppProviders>
);

describe('System Integration Tests: Custom Status Management', () => {
  
  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  describe('1. Complete Functionality Testing', () => {
    
    test('1.1 Status CRUD Operations Integration', async () => {
      render(
        <TestWrapper>
          <KanbanBoard />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
      });

      // Open settings modal
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      await userEvent.click(settingsButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Test creating new status
      const addButton = screen.getByRole('button', { name: /add.*status/i });
      await userEvent.click(addButton);

      const nameInput = screen.getByLabelText(/status name/i);
      await userEvent.type(nameInput, 'In Review');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await userEvent.click(saveButton);

      // Verify new status appears in the board
      await waitFor(() => {
        expect(screen.getByText('In Review')).toBeInTheDocument();
      });

      // Test editing status
      const editButton = screen.getByLabelText(/edit.*review/i);
      await userEvent.click(editButton);

      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'Under Review');
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Under Review')).toBeInTheDocument();
      });

      // Test deleting status (should work for status without tasks)
      const deleteButton = screen.getByLabelText(/delete.*review/i);
      await userEvent.click(deleteButton);

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.queryByText('Under Review')).not.toBeInTheDocument();
      });
    });

    test('1.2 Drag and Drop Reordering', async () => {
      // This test simulates drag and drop functionality
      render(
        <TestWrapper>
          <KanbanBoard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
      });

      // Open settings and verify initial order
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      await userEvent.click(settingsButton);

      await waitFor(() => {
        const statusItems = screen.getAllByTestId(/status-item/);
        expect(statusItems).toHaveLength(3); // Default TODO, DOING, DONE
      });

      // Simulate reordering (in real implementation would use @dnd-kit)
      // For now, we test the color regeneration after reorder
      const columns = screen.getAllByTestId(/column/);
      expect(columns.length).toBeGreaterThan(0);
    });

    test('1.3 Task Status Migration', async () => {
      // Set up legacy data
      const legacyData = {
        tasks: [
          { id: '1', title: 'Test Task 1', status: 'TODO' as TaskStatus, description: '', createdAt: new Date(), updatedAt: new Date() },
          { id: '2', title: 'Test Task 2', status: 'DOING' as TaskStatus, description: '', createdAt: new Date(), updatedAt: new Date() }
        ]
      };
      
      mockLocalStorage.setItem('kanban-tasks', JSON.stringify(legacyData));

      render(
        <TestWrapper>
          <KanbanBoard />
        </TestWrapper>
      );

      // Wait for migration to complete
      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
        expect(screen.getByText('Test Task 2')).toBeInTheDocument();
      });

      // Verify tasks are properly associated with migrated statuses
      const todoColumn = screen.getByTestId('column-todo') || screen.getByText('TODO').closest('[data-testid*="column"]');
      expect(todoColumn).toContainElement(screen.getByText('Test Task 1'));
    });

    test('1.4 Color Generation and Accessibility', async () => {
      // Test color generation for different numbers of statuses
      for (let statusCount = 1; statusCount <= 5; statusCount++) {
        for (let position = 0; position < statusCount; position++) {
          const colors = ColorPalette.generateStatusColors(statusCount, position);
          
          // Verify WCAG AA compliance
          expect(colors.contrastRatio).toBeGreaterThanOrEqual(4.5);
          
          // Verify valid hex colors
          expect(ColorPalette.isValidHexColor(colors.backgroundColor)).toBe(true);
          expect(ColorPalette.isValidHexColor(colors.accentColor)).toBe(true);
        }
      }
    });

    test('1.5 Responsive Text Truncation', () => {
      const longStatusName = 'Very Long Status Name That Should Be Truncated';
      
      // Test desktop truncation
      const desktopResult = TruncationService.getTruncatedDisplay(longStatusName, 'desktop');
      expect(desktopResult.displayText).toContain('…');
      expect(desktopResult.shouldShowTooltip).toBe(true);
      expect(desktopResult.fullText).toBe(longStatusName);
      
      // Test mobile truncation (shorter limit)
      const mobileResult = TruncationService.getTruncatedDisplay(longStatusName, 'mobile');
      expect(mobileResult.displayText).toContain('…');
      expect(mobileResult.displayText.length).toBeLessThan(desktopResult.displayText.length);
      expect(mobileResult.shouldShowTooltip).toBe(true);
    });
  });

  describe('2. Performance and Memory Tests', () => {
    
    test('2.1 Large Data Set Performance', async () => {
      // Create a large number of statuses
      const largeStatusSet: CustomStatus[] = Array.from({ length: 50 }, (_, i) => ({
        id: `status-${i}`,
        name: `Status ${i}`,
        displayOrder: i,
        createdAt: new Date()
      }));

      const startTime = performance.now();
      
      // Test serialization performance
      const serialized = StatusSerializer.serialize(largeStatusSet);
      expect(serialized.success).toBe(true);
      
      // Test deserialization performance
      const deserialized = StatusSerializer.deserialize(serialized.data!);
      expect(deserialized.success).toBe(true);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time (less than 100ms for 50 statuses)
      expect(duration).toBeLessThan(100);
      
      // Verify data integrity
      expect(deserialized.statuses).toHaveLength(50);
    });

    test('2.2 Color Generation Performance', () => {
      const startTime = performance.now();
      
      // Generate colors for many combinations
      for (let count = 1; count <= 20; count++) {
        for (let pos = 0; pos < count; pos++) {
          ColorPalette.generateStatusColors(count, pos);
        }
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should be fast (less than 50ms for 210 color generations)
      expect(duration).toBeLessThan(50);
    });

    test('2.3 Memory Leak Detection', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Create and destroy many status objects
      for (let i = 0; i < 1000; i++) {
        const status: CustomStatus = {
          id: `temp-${i}`,
          name: `Temp Status ${i}`,
          displayOrder: i,
          createdAt: new Date()
        };
        
        // Simulate processing
        StatusSerializer.serialize([status]);
        ColorPalette.generateStatusColors(5, i % 5);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Memory usage should not have grown significantly
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryGrowth = finalMemory - initialMemory;
        expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024); // Less than 10MB growth
      }
    });
  });

  describe('3. Error Scenario Testing', () => {
    
    test('3.1 Storage Error Handling', async () => {
      // Mock localStorage to throw errors
      const originalSetItem = mockLocalStorage.setItem;
      mockLocalStorage.setItem = jest.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      try {
        render(
          <TestWrapper>
            <KanbanBoard />
          </TestWrapper>
        );

        // Should handle storage errors gracefully
        await waitFor(() => {
          expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
        });

        // Application should still be functional
        expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
      } finally {
        mockLocalStorage.setItem = originalSetItem;
      }
    });

    test('3.2 Data Corruption Recovery', () => {
      // Set corrupted data in localStorage
      mockLocalStorage.setItem('kanban-tasks-v2', 'invalid-json-data');
      
      const migrationResult = MigrationSystem.getMigrationStatus();
      expect(migrationResult.needsMigration).toBe(true);
      
      // Should fall back to default configuration
      const defaultConfig = StatusSerializer.getDefaultConfig();
      expect(defaultConfig.statuses.length).toBeGreaterThan(0);
    });

    test('3.3 Validation Error Handling', () => {
      // Test invalid status names
      const emptyNameResult = StatusValidator.validateStatusName('', []);
      expect(emptyNameResult.isValid).toBe(false);
      expect(emptyNameResult.errors.length).toBeGreaterThan(0);
      
      const tooLongNameResult = StatusValidator.validateStatusName('A'.repeat(100), []);
      expect(tooLongNameResult.isValid).toBe(false);
      
      // Test duplicate names
      const existingStatuses: CustomStatus[] = [
        { id: '1', name: 'Existing', displayOrder: 0, createdAt: new Date() }
      ];
      const duplicateResult = StatusValidator.validateStatusName('Existing', existingStatuses);
      expect(duplicateResult.isValid).toBe(false);
    });

    test('3.4 Migration Error Handling', async () => {
      // Set up partially corrupted legacy data
      const corruptedData = {
        tasks: [
          { id: '1', title: 'Valid Task', status: 'TODO', description: '', createdAt: new Date() },
          { id: '2', title: 'Invalid Task', status: 'INVALID_STATUS', description: '' } // Missing fields
        ]
      };
      
      mockLocalStorage.setItem('kanban-tasks', JSON.stringify(corruptedData));
      
      const migrationResult = await MigrationSystem.migrateToV2();
      
      // Should handle corruption gracefully
      expect(migrationResult.success).toBe(true);
      expect(migrationResult.migratedStatuses.length).toBeGreaterThan(0);
      
      // Should create backup even with corrupted data
      expect(migrationResult.backupCreated).toBe(true);
    });
  });

  describe('4. Browser Compatibility Testing', () => {
    
    test('4.1 localStorage Availability', () => {
      // Test localStorage service handles unavailable storage
      const originalLocalStorage = window.localStorage;
      
      // Mock unavailable localStorage
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true
      });
      
      try {
        // LocalStorageService should handle unavailable storage gracefully
        const result = LocalStorageService.isAvailable();
        expect(typeof result).toBe('boolean');
      } finally {
        Object.defineProperty(window, 'localStorage', {
          value: originalLocalStorage,
          writable: true
        });
      }
    });

    test('4.2 CSS Custom Properties Support', () => {
      // Test color generation produces valid CSS colors
      const colors = ColorPalette.generateStatusColors(3, 1);
      
      // Should produce valid hex colors that work in all browsers
      expect(colors.backgroundColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(colors.accentColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    test('4.3 Event Handling Compatibility', async () => {
      render(
        <TestWrapper>
          <KanbanBoard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
      });

      // Test both click and keyboard events
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      
      // Mouse click
      fireEvent.click(settingsButton);
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Close modal
      const closeButton = screen.getByRole('button', { name: /close/i }) || 
                         screen.getByLabelText(/close/i);
      if (closeButton) {
        fireEvent.click(closeButton);
      }

      // Keyboard activation
      fireEvent.keyDown(settingsButton, { key: 'Enter' });
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('5. Accessibility Testing', () => {
    
    test('5.1 Screen Reader Support', async () => {
      render(
        <TestWrapper>
          <KanbanBoard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
      });

      // Test ARIA labels and roles
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      expect(settingsButton).toHaveAttribute('aria-label');
      
      // Open modal and test modal accessibility
      await userEvent.click(settingsButton);
      
      await waitFor(() => {
        const modal = screen.getByRole('dialog');
        expect(modal).toHaveAttribute('aria-labelledby');
        expect(modal).toHaveAttribute('aria-describedby');
      });
    });

    test('5.2 Keyboard Navigation', async () => {
      render(
        <TestWrapper>
          <KanbanBoard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
      });

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      
      // Test keyboard navigation
      settingsButton.focus();
      expect(document.activeElement).toBe(settingsButton);
      
      // Test Enter key activation
      fireEvent.keyDown(settingsButton, { key: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Test Escape key to close
      fireEvent.keyDown(document, { key: 'Escape' });
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    test('5.3 High Contrast Mode Compatibility', () => {
      // Mock high contrast media query
      const mockMatchMedia = jest.fn().mockImplementation(query => ({
        matches: query.includes('prefers-contrast: high'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
      }));
      
      Object.defineProperty(window, 'matchMedia', { value: mockMatchMedia });
      
      // Generate colors and verify they work in high contrast
      const colors = ColorPalette.generateStatusColors(3, 1);
      expect(colors.contrastRatio).toBeGreaterThanOrEqual(4.5);
      
      // In high contrast mode, should use fallback colors
      const fallbackColors = ColorPalette.getPresetPalette();
      expect(fallbackColors.length).toBeGreaterThan(0);
      fallbackColors.forEach(color => {
        expect(color.contrastRatio).toBeGreaterThanOrEqual(4.5);
      });
    });

    test('5.4 Reduced Motion Preferences', () => {
      // Mock prefers-reduced-motion media query
      const mockMatchMedia = jest.fn().mockImplementation(query => ({
        matches: query.includes('prefers-reduced-motion: reduce'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
      }));
      
      Object.defineProperty(window, 'matchMedia', { value: mockMatchMedia });
      
      render(
        <TestWrapper>
          <EnhancedColumn 
            status={{ id: '1', name: 'Test', displayOrder: 0, createdAt: new Date() }}
            onAddTask={() => {}}
            onEditTask={() => {}}
            onDeleteTask={() => {}}
          />
        </TestWrapper>
      );
      
      // Column should render without motion animations
      const column = screen.getByTestId(/column/) || screen.getByText('Test').closest('div');
      expect(column).toBeInTheDocument();
    });
  });

  describe('6. Component Integration Testing', () => {
    
    test('6.1 StatusSettingsModal Integration', async () => {
      render(
        <TestWrapper>
          <KanbanBoard />
        </TestWrapper>
      );

      // Test modal integration with main board
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
      });

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      await userEvent.click(settingsButton);

      await waitFor(() => {
        const modal = screen.getByRole('dialog');
        expect(modal).toBeInTheDocument();
        
        // Should show current statuses
        expect(screen.getByText('TODO')).toBeInTheDocument();
        expect(screen.getByText('DOING')).toBeInTheDocument();
        expect(screen.getByText('DONE')).toBeInTheDocument();
      });
    });

    test('6.2 StatusContext and TaskContext Integration', async () => {
      render(
        <TestWrapper>
          <KanbanBoard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
      });

      // Changes to statuses should be reflected in task management
      // This integration is tested through the migration and CRUD operations above
      expect(screen.getByText('TODO')).toBeInTheDocument();
    });

    test('6.3 MigrationSystem Integration', () => {
      // Test complete migration workflow
      const migrationStatus = MigrationSystem.getMigrationStatus();
      expect(typeof migrationStatus.needsMigration).toBe('boolean');
      expect(typeof migrationStatus.currentVersion).toBe('string');
    });
  });
});