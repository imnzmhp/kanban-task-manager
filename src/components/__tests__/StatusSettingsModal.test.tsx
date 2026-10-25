/**
 * StatusSettingsModal component unit tests
 * 
 * Requirements: 6.1, 6.2, 6.3, 5.1, 5.2, 5.3
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StatusSettingsModal } from '../StatusSettingsModal';
import { useStatusContext } from '../../contexts/StatusContext';
import { CustomStatus } from '../../types/CustomStatus';

// Mock the StatusContext
jest.mock('../../contexts/StatusContext');
const mockUseStatusContext = useStatusContext as jest.MockedFunction<typeof useStatusContext>;

// Mock TruncationService
jest.mock('../../utils/TruncationService', () => ({
  TruncationService: {
    getCurrentScreenSize: jest.fn(() => 'desktop'),
    getTruncatedDisplay: jest.fn((name, _screenSize) => ({
      displayText: name.length > 20 ? name.substring(0, 19) + '…' : name,
      shouldShowTooltip: name.length > 20,
      fullText: name
    })),
    generateAriaLabel: jest.fn((displayText, fullText) => 
      displayText === fullText ? fullText : `${displayText}、完全名：${fullText}`
    )
  }
}));

// Mock window.innerWidth for responsive tests
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024
});

const mockStatuses: CustomStatus[] = [
  {
    id: 'status-1',
    name: 'To Do',
    displayOrder: 0,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'status-2', 
    name: 'Doing',
    displayOrder: 1,
    createdAt: new Date('2024-01-02')
  },
  {
    id: 'status-3',
    name: 'Done',
    displayOrder: 2,
    createdAt: new Date('2024-01-03')
  }
];

const defaultMockContextValue = {
  statuses: mockStatuses,
  loading: false,
  error: null,
  createStatus: jest.fn(),
  updateStatus: jest.fn(),
  deleteStatus: jest.fn(),
  reorderStatuses: jest.fn(),
  getStatusById: jest.fn(),
  getStatusByPosition: jest.fn(),
  getColorForStatus: jest.fn(() => ({
    backgroundColor: '#f0f8ff',
    accentColor: '#1e90ff',
    contrastRatio: 5.2
  })),
  validateStatusName: jest.fn(),
  canDeleteStatus: jest.fn(),
  clearError: jest.fn(),
  invalidateCache: jest.fn()
};

describe('StatusSettingsModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseStatusContext.mockReturnValue(defaultMockContextValue);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering and Basic Functionality', () => {
    it('should not render when isOpen is false', () => {
      render(<StatusSettingsModal isOpen={false} onClose={jest.fn()} />);
      
      expect(screen.queryByTestId('status-settings-modal')).not.toBeInTheDocument();
    });

    it('should render modal when isOpen is true', () => {
      render(<StatusSettingsModal isOpen={true} onClose={jest.fn()} />);
      
      expect(screen.getByTestId('status-settings-modal')).toBeInTheDocument();
      expect(screen.getByText('ステータス設定')).toBeInTheDocument();
    });

    it('should display modal with proper accessibility attributes', () => {
      render(<StatusSettingsModal isOpen={true} onClose={jest.fn()} />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby', 'status-settings-title');
      expect(modal).toHaveAttribute('aria-describedby', 'status-settings-description');
    });
  });

  describe('Status List Display', () => {
    it('should display all statuses in correct order', () => {
      render(<StatusSettingsModal isOpen={true} onClose={jest.fn()} />);
      
      expect(screen.getByText('To Do')).toBeInTheDocument();
      expect(screen.getByText('Doing')).toBeInTheDocument();
      expect(screen.getByText('Done')).toBeInTheDocument();
      
      // Check status items are rendered
      expect(screen.getByTestId('sortable-status-item-status-1')).toBeInTheDocument();
      expect(screen.getByTestId('sortable-status-item-status-2')).toBeInTheDocument();
      expect(screen.getByTestId('sortable-status-item-status-3')).toBeInTheDocument();
    });

    it('should display status metadata correctly', () => {
      render(<StatusSettingsModal isOpen={true} onClose={jest.fn()} />);
      
      // Check display order (adding 1 for 1-based display)
      expect(screen.getByText('順序: 1')).toBeInTheDocument();
      expect(screen.getByText('順序: 2')).toBeInTheDocument();
      expect(screen.getByText('順序: 3')).toBeInTheDocument();
      

    });

    it('should display empty state when no statuses exist', () => {
      mockUseStatusContext.mockReturnValue({
        ...defaultMockContextValue,
        statuses: []
      });

      render(<StatusSettingsModal isOpen={true} onClose={jest.fn()} />);
      
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('ステータスが見つかりません。')).toBeInTheDocument();
    });
  });

  describe('Color Visualization', () => {
    it('should display color indicators for each status', () => {
      render(<StatusSettingsModal isOpen={true} onClose={jest.fn()} />);
      
      const statusItems = screen.getAllByTestId(/^sortable-status-item-/);
      expect(statusItems).toHaveLength(3);
      
      // Each status should have a color indicator and preview
      statusItems.forEach(item => {
        const colorIndicator = item.querySelector('.statusColor');
        const previewSample = item.querySelector('.previewSample');
        
        expect(colorIndicator).toBeInTheDocument();
        expect(previewSample).toBeInTheDocument();
        expect(previewSample).toHaveTextContent('サンプル');
      });
    });

    it('should call getColorForStatus for each status', () => {
      render(<StatusSettingsModal isOpen={true} onClose={jest.fn()} />);
      
      expect(defaultMockContextValue.getColorForStatus).toHaveBeenCalledWith('status-1');
      expect(defaultMockContextValue.getColorForStatus).toHaveBeenCalledWith('status-2');
      expect(defaultMockContextValue.getColorForStatus).toHaveBeenCalledWith('status-3');
    });
  });

  describe('Truncation and Tooltips', () => {
    it('should handle long status names with truncation', () => {
      const longNameStatuses = [
        {
          id: 'status-long',
          name: 'This is a very long status name that should be truncated',
          displayOrder: 0,
          createdAt: new Date()
        }
      ];

      mockUseStatusContext.mockReturnValue({
        ...defaultMockContextValue,
        statuses: longNameStatuses
      });

      render(<StatusSettingsModal isOpen={true} onClose={jest.fn()} />);
      
      const statusName = screen.getByText('This is a very long s…');
      expect(statusName).toBeInTheDocument();
      expect(statusName).toHaveAttribute('title', 'This is a very long status name that should be truncated');
    });

    it('should not add tooltip for short status names', () => {
      render(<StatusSettingsModal isOpen={true} onClose={jest.fn()} />);
      
      const shortName = screen.getByText('To Do');
      expect(shortName).not.toHaveAttribute('title');
    });
  });

  describe('Loading and Error States', () => {
    it('should display loading state', () => {
      mockUseStatusContext.mockReturnValue({
        ...defaultMockContextValue,
        loading: true
      });

      render(<StatusSettingsModal isOpen={true} onClose={jest.fn()} />);
      
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    });

    it('should display error message when error exists', () => {
      const errorMessage = 'Failed to load statuses';
      mockUseStatusContext.mockReturnValue({
        ...defaultMockContextValue,
        error: errorMessage
      });

      render(<StatusSettingsModal isOpen={true} onClose={jest.fn()} />);
      
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe('Modal Interaction', () => {
    it('should call onClose when close button is clicked', () => {
      const onCloseMock = jest.fn();
      render(<StatusSettingsModal isOpen={true} onClose={onCloseMock} />);
      
      const closeButton = screen.getByTestId('close-modal-button');
      fireEvent.click(closeButton);
      
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when cancel button is clicked', () => {
      const onCloseMock = jest.fn();
      render(<StatusSettingsModal isOpen={true} onClose={onCloseMock} />);
      
      const cancelButton = screen.getByTestId('cancel-button');
      fireEvent.click(cancelButton);
      
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is clicked', () => {
      const onCloseMock = jest.fn();
      render(<StatusSettingsModal isOpen={true} onClose={onCloseMock} />);
      
      const backdrop = screen.getByTestId('status-settings-modal');
      fireEvent.click(backdrop);
      
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when modal content is clicked', () => {
      const onCloseMock = jest.fn();
      render(<StatusSettingsModal isOpen={true} onClose={onCloseMock} />);
      
      const modalContent = screen.getByText('ステータス設定');
      fireEvent.click(modalContent);
      
      expect(onCloseMock).not.toHaveBeenCalled();
    });

    it('should call onClose when Escape key is pressed', () => {
      const onCloseMock = jest.fn();
      render(<StatusSettingsModal isOpen={true} onClose={onCloseMock} />);
      
      const modal = screen.getByTestId('status-settings-modal');
      fireEvent.keyDown(modal, { key: 'Escape' });
      
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });

    it('should clear error when modal is closed', () => {
      const onCloseMock = jest.fn();
      render(<StatusSettingsModal isOpen={true} onClose={onCloseMock} />);
      
      const closeButton = screen.getByTestId('close-modal-button');
      fireEvent.click(closeButton);
      
      expect(defaultMockContextValue.clearError).toHaveBeenCalledTimes(1);
    });
  });

  describe('Responsive Behavior', () => {
    it('should update screen size on window resize', async () => {
      render(<StatusSettingsModal isOpen={true} onClose={jest.fn()} />);
      
      // Simulate mobile screen size
      Object.defineProperty(window, 'innerWidth', { value: 480 });
      fireEvent.resize(window);
      
      // Wait for the effect to run
      await waitFor(() => {
        expect(screen.getByTestId('status-settings-modal')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should focus the cancel button by default', () => {
      render(<StatusSettingsModal isOpen={true} onClose={jest.fn()} />);
      
      const cancelButton = screen.getByTestId('cancel-button');
      expect(cancelButton).toHaveFocus();
    });

    it('should have proper ARIA labels for truncated status names', () => {
      const longNameStatuses = [
        {
          id: 'status-long',
          name: 'This is a very long status name that should be truncated',
          displayOrder: 0,
          createdAt: new Date()
        }
      ];

      mockUseStatusContext.mockReturnValue({
        ...defaultMockContextValue,
        statuses: longNameStatuses
      });

      render(<StatusSettingsModal isOpen={true} onClose={jest.fn()} />);
      
      const statusName = screen.getByText('This is a very long s…');
      expect(statusName).toHaveAttribute(
        'aria-label', 
        'This is a very long s…、完全名：This is a very long status name that should be truncated'
      );
    });

    it('should have proper close button accessibility', () => {
      render(<StatusSettingsModal isOpen={true} onClose={jest.fn()} />);
      
      const closeButton = screen.getByTestId('close-modal-button');
      expect(closeButton).toHaveAttribute('aria-label', 'モーダルを閉じる');
    });
  });
});