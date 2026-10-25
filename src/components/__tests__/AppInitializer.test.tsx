/**
 * AppInitializer component tests
 * Tests the migration integration and error handling functionality
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AppInitializer } from '../AppInitializer';
import { MigrationSystem } from '../../services/MigrationSystem';
import { useAppInitialization } from '../../hooks';
import { useToast } from '../../contexts/ToastContext';

// Mock dependencies
jest.mock('../../hooks');
jest.mock('../../contexts/ToastContext');
jest.mock('../../services/MigrationSystem');

const mockUseAppInitialization = useAppInitialization as jest.MockedFunction<typeof useAppInitialization>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;
const mockMigrationSystem = MigrationSystem as jest.Mocked<typeof MigrationSystem>;

describe('AppInitializer with Migration Integration', () => {
  const mockToast = {
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showWarning: jest.fn(),
    showInfo: jest.fn(),
    removeToast: jest.fn(),
    clearAllToasts: jest.fn(),
    showToast: jest.fn(),
    state: { toasts: [] },
    dispatch: jest.fn()
  };

  const mockAppInit = {
    isInitialized: false,
    storageHealth: { 
      isAvailable: true, 
      hasData: true, 
      dataSize: 1024, 
      lastSaved: null, 
      isHealthy: true 
    },
    initializeData: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseToast.mockReturnValue(mockToast);
    mockUseAppInitialization.mockReturnValue(mockAppInit);
  });

  it('displays loading screen during initialization', () => {
    render(
      <AppInitializer>
        <div data-testid="app-content">App Content</div>
      </AppInitializer>
    );

    expect(screen.getByText('データを読み込み中...')).toBeInTheDocument();
    expect(screen.queryByTestId('app-content')).not.toBeInTheDocument();
  });

  it('displays migration loading state when migrating', async () => {
    // Mock a scenario where migration is needed
    mockMigrationSystem.getMigrationStatus.mockReturnValue({
      isV2: false,
      hasLegacyData: true,
      migrationCompleted: false,
      lastMigration: undefined
    });

    mockMigrationSystem.migrateToV2.mockImplementation(() => 
      new Promise(resolve => {
        setTimeout(() => resolve({
          success: true,
          migratedStatuses: [{
            id: 'test-id',
            name: 'TODO',
            displayOrder: 0,
            createdAt: new Date()
          }],
          updatedTasks: [],
          errors: [],
          backupCreated: true
        }), 100);
      })
    );

    render(
      <AppInitializer>
        <div data-testid="app-content">App Content</div>
      </AppInitializer>
    );

    // Should show migration loading state initially
    expect(screen.getByText('データを移行中...')).toBeInTheDocument();
    expect(screen.getByText('v1データをv2フォーマットに変換しています')).toBeInTheDocument();
  });

  it('completes initialization successfully after migration', async () => {
    mockMigrationSystem.getMigrationStatus.mockReturnValue({
      isV2: false,
      hasLegacyData: true,
      migrationCompleted: false,
      lastMigration: undefined
    });

    mockMigrationSystem.migrateToV2.mockResolvedValue({
      success: true,
      migratedStatuses: [{
        id: 'test-id',
        name: 'TODO',
        displayOrder: 0,
        createdAt: new Date()
      }],
      updatedTasks: [],
      errors: [],
      backupCreated: true
    });

    mockAppInit.initializeData.mockResolvedValue(undefined);

    const onComplete = jest.fn();

    render(
      <AppInitializer onInitializationComplete={onComplete}>
        <div data-testid="app-content">App Content</div>
      </AppInitializer>
    );

    await waitFor(() => {
      expect(screen.getByTestId('app-content')).toBeInTheDocument();
    });

    expect(onComplete).toHaveBeenCalledWith(true);
    expect(mockToast.showSuccess).toHaveBeenCalledWith(
      'データ移行完了',
      '1個の状態とタスクをv2フォーマットに移行しました'
    );
  });

  it('handles migration errors gracefully', async () => {
    mockMigrationSystem.getMigrationStatus.mockReturnValue({
      isV2: false,
      hasLegacyData: true,
      migrationCompleted: false,
      lastMigration: undefined
    });

    mockMigrationSystem.migrateToV2.mockRejectedValue(new Error('Migration failed'));
    mockAppInit.initializeData.mockResolvedValue(undefined);

    render(
      <AppInitializer>
        <div data-testid="app-content">App Content</div>
      </AppInitializer>
    );

    await waitFor(() => {
      expect(mockToast.showError).toHaveBeenCalledWith(
        '移行失敗',
        'データ移行中にエラーが発生しました: Migration failed'
      );
    });
  });

  it('skips migration when already completed', async () => {
    mockMigrationSystem.getMigrationStatus.mockReturnValue({
      isV2: true,
      hasLegacyData: false,
      migrationCompleted: true,
      lastMigration: '2024-01-01T00:00:00Z'
    });

    mockAppInit.initializeData.mockResolvedValue(undefined);

    render(
      <AppInitializer>
        <div data-testid="app-content">App Content</div>
      </AppInitializer>
    );

    await waitFor(() => {
      expect(screen.getByTestId('app-content')).toBeInTheDocument();
    });

    expect(mockMigrationSystem.migrateToV2).not.toHaveBeenCalled();
  });

  it('shows storage warning in fallback mode', async () => {
    mockMigrationSystem.getMigrationStatus.mockReturnValue({
      isV2: true,
      hasLegacyData: false,
      migrationCompleted: true,
      lastMigration: undefined
    });

    mockAppInit.initializeData.mockResolvedValue(undefined);
    mockAppInit.storageHealth.isAvailable = false;

    render(
      <AppInitializer>
        <div data-testid="app-content">App Content</div>
      </AppInitializer>
    );

    await waitFor(() => {
      expect(mockToast.showWarning).toHaveBeenCalledWith(
        'ストレージ警告',
        'ローカルストレージが利用できません。データは一時的にメモリに保存されます。'
      );
    });
  });
});