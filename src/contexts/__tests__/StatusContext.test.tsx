/**
 * StatusContext Tests
 * カスタムタスク状態管理システムのコンテキストテスト
 * 
 * Requirements: 1.2, 2.1, 2.2
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { StatusProvider, useStatusContext } from '../StatusContext';
import { CustomStatus } from '../../types/CustomStatus';

// Test component to access StatusContext
const TestComponent: React.FC = () => {
  const {
    statuses,
    loading,
    error,
    createStatus,
    updateStatus,
    deleteStatus,
    reorderStatuses,
    getStatusById,
    validateStatusName,
    canDeleteStatus,
    clearError
  } = useStatusContext();

  return (
    <div>
      <div data-testid="status-count">{statuses.length}</div>
      <div data-testid="loading">{loading ? 'loading' : 'idle'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <button
        data-testid="create-status"
        onClick={async () => {
          try {
            await createStatus('Test Status');
          } catch (e) {
            // Error handled by context
          }
        }}
      >
        Create Status
      </button>
      <button
        data-testid="clear-error"
        onClick={() => clearError()}
      >
        Clear Error
      </button>
    </div>
  );
};

// Test component that should throw error when used outside provider
const TestComponentOutsideProvider: React.FC = () => {
  useStatusContext();
  return <div>Should not render</div>;
};

describe('StatusContext', () => {
  describe('StatusProvider', () => {
    it('should provide initial state', () => {
      render(
        <StatusProvider>
          <TestComponent />
        </StatusProvider>
      );

      expect(screen.getByTestId('status-count')).toHaveTextContent('0');
      expect(screen.getByTestId('loading')).toHaveTextContent('idle');
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    });

    it('should handle status creation', async () => {
      render(
        <StatusProvider>
          <TestComponent />
        </StatusProvider>
      );

      const createButton = screen.getByTestId('create-status');

      await act(async () => {
        createButton.click();
      });

      expect(screen.getByTestId('status-count')).toHaveTextContent('1');
    });

    it('should handle error clearing', async () => {
      render(
        <StatusProvider>
          <TestComponent />
        </StatusProvider>
      );

      const clearButton = screen.getByTestId('clear-error');

      await act(async () => {
        clearButton.click();
      });

      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    });
  });

  describe('useStatusContext', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        render(<TestComponentOutsideProvider />);
      }).toThrow('useStatusContext must be used within a StatusProvider');

      console.error = originalError;
    });
  });

  describe('Context Operations', () => {
    let contextValue: any;

    const ContextCapture: React.FC = () => {
      contextValue = useStatusContext();
      return null;
    };

    beforeEach(() => {
      render(
        <StatusProvider>
          <ContextCapture />
        </StatusProvider>
      );
    });

    describe('CRUD Operations', () => {
      it('should create status with valid name', async () => {
        const initialCount = contextValue.statuses.length;

        await act(async () => {
          const result = await contextValue.createStatus('Valid Status');
          expect(result).toHaveProperty('id');
          expect(result).toHaveProperty('name', 'Valid Status');
        });

        expect(contextValue.statuses.length).toBe(initialCount + 1);
      });

      it('should reject invalid status names', async () => {
        await act(async () => {
          try {
            await contextValue.createStatus('');
            fail('Should have thrown error');
          } catch (error: any) {
            expect(error.message).toContain('ステータス名を入力してください');
          }
        });
      });

      it('should update status', async () => {
        // First create a status
        let statusId: string;
        await act(async () => {
          const result = await contextValue.createStatus('Original Name');
          statusId = result.id;
        });

        // Then update it
        await act(async () => {
          await contextValue.updateStatus(statusId, { name: 'Updated Name' });
        });

        const updatedStatus = contextValue.getStatusById(statusId);
        expect(updatedStatus?.name).toBe('Updated Name');
      });

      it('should delete status when allowed', async () => {
        // Create two statuses (need at least one to remain)
        let statusId1: string, statusId2: string;
        await act(async () => {
          const result1 = await contextValue.createStatus('Status 1');
          const result2 = await contextValue.createStatus('Status 2');
          statusId1 = result1.id;
          statusId2 = result2.id;
        });

        const initialCount = contextValue.statuses.length;

        // Delete one status
        await act(async () => {
          await contextValue.deleteStatus(statusId1);
        });

        expect(contextValue.statuses.length).toBe(initialCount - 1);
        expect(contextValue.getStatusById(statusId1)).toBeUndefined();
        expect(contextValue.getStatusById(statusId2)).toBeDefined();
      });

      it('should reorder statuses', async () => {
        // Create three statuses
        let statusIds: string[] = [];
        await act(async () => {
          for (let i = 0; i < 3; i++) {
            const result = await contextValue.createStatus(`Status ${i}`);
            statusIds.push(result.id);
          }
        });

        // Reorder from position 0 to position 2
        await act(async () => {
          await contextValue.reorderStatuses(0, 2);
        });

        const reorderedStatuses = [...contextValue.statuses].sort((a, b) => a.displayOrder - b.displayOrder);
        expect(reorderedStatuses[0].name).toBe('Status 1');
        expect(reorderedStatuses[1].name).toBe('Status 2');
        expect(reorderedStatuses[2].name).toBe('Status 0');
      });
    });

    describe('Query Operations', () => {
      it('should get status by ID', async () => {
        let statusId: string;
        await act(async () => {
          const result = await contextValue.createStatus('Test Status');
          statusId = result.id;
        });

        const found = contextValue.getStatusById(statusId);
        expect(found).toBeDefined();
        expect(found?.name).toBe('Test Status');

        const notFound = contextValue.getStatusById('non-existent');
        expect(notFound).toBeUndefined();
      });

      it('should get status by position', async () => {
        await act(async () => {
          await contextValue.createStatus('Status 0');
          await contextValue.createStatus('Status 1');
        });

        const first = contextValue.getStatusByPosition(0);
        const second = contextValue.getStatusByPosition(1);
        const outOfBounds = contextValue.getStatusByPosition(5);

        expect(first?.name).toBe('Status 0');
        expect(second?.name).toBe('Status 1');
        expect(outOfBounds).toBeUndefined();
      });

      it('should get color for status', async () => {
        let statusId: string;
        await act(async () => {
          const result = await contextValue.createStatus('Colored Status');
          statusId = result.id;
        });

        const color = contextValue.getColorForStatus(statusId);
        expect(color).toHaveProperty('backgroundColor');
        expect(color).toHaveProperty('accentColor');
        expect(color).toHaveProperty('contrastRatio');
        expect(color.contrastRatio).toBeGreaterThanOrEqual(4.5);
      });
    });

    describe('Validation Operations', () => {
      it('should validate status names', () => {
        const validResult = contextValue.validateStatusName('Valid Name');
        expect(validResult.isValid).toBe(true);

        const invalidResult = contextValue.validateStatusName('');
        expect(invalidResult.isValid).toBe(false);
      });

      it('should check deletion capability', async () => {
        // Create single status
        let statusId: string;
        await act(async () => {
          const result = await contextValue.createStatus('Only Status');
          statusId = result.id;
        });

        const cannotDelete = contextValue.canDeleteStatus(statusId);
        expect(cannotDelete.canDelete).toBe(false);
        expect(cannotDelete.reason).toContain('最低1つのステータスが必要です');

        // Add another status
        await act(async () => {
          await contextValue.createStatus('Another Status');
        });

        const canDelete = contextValue.canDeleteStatus(statusId);
        expect(canDelete.canDelete).toBe(true);
      });
    });
  });
});
