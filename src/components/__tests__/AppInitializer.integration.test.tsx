/**
 * AppInitializer Migration Integration Test
 * Demonstrates the complete migration flow during app startup
 * Requirements: 7.1, 7.4, 7.5
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AppInitializer } from '../AppInitializer';
import { ToastProvider } from '../../contexts/ToastContext';

// Mock localStorage for testing
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] || null,
    length: Object.keys(store).length
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock the hooks to provide controlled test scenarios
jest.mock('../../hooks', () => ({
  useAppInitialization: () => ({
    isInitialized: false,
    storageHealth: {
      isAvailable: true,
      hasData: false,
      dataSize: 0,
      lastSaved: null,
      isHealthy: true
    },
    initializeData: jest.fn().mockResolvedValue(undefined)
  })
}));

describe('AppInitializer Migration Integration', () => {
  const TestApp: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ToastProvider>
      <AppInitializer>{children}</AppInitializer>
    </ToastProvider>
  );

  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  it('creates default statuses when no legacy data exists', async () => {
    render(
      <TestApp>
        <div data-testid="app-content">App Content</div>
      </TestApp>
    );

    await waitFor(() => {
      expect(screen.getByTestId('app-content')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Verify that default statuses were created
    const statusData = mockLocalStorage.getItem('kanban-custom-statuses');
    expect(statusData).toBeTruthy();
    
    if (statusData) {
      const statusConfig = JSON.parse(statusData);
      expect(statusConfig.statuses).toHaveLength(3);
      expect(statusConfig.statuses.map((s: any) => s.name)).toEqual(['TODO', 'DOING', 'DONE']);
    }
  });

  it('migrates legacy v1 data to v2 format', async () => {
    // Setup legacy data in localStorage
    const legacyData = {
      version: '1.0.0',
      tasks: [
        {
          id: 'task-1',
          title: 'Test Task',
          description: 'A test task',
          status: 'TODO',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      lastSaved: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    
    mockLocalStorage.setItem('kanban-tasks', JSON.stringify(legacyData));

    render(
      <TestApp>
        <div data-testid="app-content">App Content</div>
      </TestApp>
    );

    // Should show migration loading state
    expect(screen.getByText('データを移行中...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('app-content')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Verify migration completed
    expect(mockLocalStorage.getItem('kanban-migration-completed')).toBe('true');
    
    // Verify v2 data was created
    const v2Data = mockLocalStorage.getItem('kanban-tasks-v2');
    expect(v2Data).toBeTruthy();
    
    // Verify backup was created
    const keys = [];
    for (let i = 0; i < mockLocalStorage.length; i++) {
      const key = mockLocalStorage.key(i);
      if (key && key.startsWith('kanban-tasks-backup-')) {
        keys.push(key);
      }
    }
    expect(keys.length).toBeGreaterThan(0);
  });

  it('handles storage unavailable scenario gracefully', async () => {
    // Mock localStorage to throw errors
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: () => { throw new Error('Storage not available'); },
        setItem: () => { throw new Error('Storage not available'); },
        removeItem: () => { throw new Error('Storage not available'); },
        clear: () => { throw new Error('Storage not available'); },
        key: () => null,
        length: 0
      }
    });

    render(
      <TestApp>
        <div data-testid="app-content">App Content</div>
      </TestApp>
    );

    await waitFor(() => {
      expect(screen.getByTestId('app-content')).toBeInTheDocument();
    }, { timeout: 5000 });

    // App should still load in fallback mode
    expect(screen.getByTestId('app-content')).toBeInTheDocument();
  });

  it('preserves existing v2 data without re-migration', async () => {
    // Setup existing v2 data
    const v2Data = {
      version: '2.0.0',
      tasks: [],
      customStatuses: [
        {
          id: 'existing-todo',
          name: 'TODO',
          displayOrder: 0,
          createdAt: new Date().toISOString()
        }
      ],
      lastSaved: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      migrationInfo: {
        migratedFrom: '1.0.0',
        migratedAt: new Date().toISOString(),
        backupKey: 'test-backup-key'
      }
    };

    mockLocalStorage.setItem('kanban-tasks-v2', JSON.stringify(v2Data));
    mockLocalStorage.setItem('kanban-migration-completed', 'true');

    render(
      <TestApp>
        <div data-testid="app-content">App Content</div>
      </TestApp>
    );

    await waitFor(() => {
      expect(screen.getByTestId('app-content')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Verify no migration occurred (data preserved as-is)
    const preservedData = mockLocalStorage.getItem('kanban-tasks-v2');
    expect(preservedData).toBeTruthy();
    
    if (preservedData) {
      const parsed = JSON.parse(preservedData);
      expect(parsed.customStatuses[0].id).toBe('existing-todo');
    }
  });
});