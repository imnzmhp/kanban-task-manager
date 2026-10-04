/**
 * useToast hook unit tests
 * Requirements: 6.4, 7.5
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { ToastProvider } from '../../contexts/ToastContext';
import { useToastNotifications } from '../useToast';

describe('useToastNotifications', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ToastProvider>{children}</ToastProvider>
  );

  describe('Task Operations', () => {
    test('showTaskSuccess creates success toast with correct message', () => {
      const { result } = renderHook(() => useToastNotifications(), { wrapper });

      act(() => {
        result.current.showTaskSuccess('作成', 'テストタスク');
      });

      expect(result.current.state.toasts).toHaveLength(1);
      const toast = result.current.state.toasts[0];
      expect(toast.type).toBe('success');
      expect(toast.title).toBe('成功');
      expect(toast.message).toBe('タスク「テストタスク」を作成しました');
    });

    test('showTaskSuccess works without task title', () => {
      const { result } = renderHook(() => useToastNotifications(), { wrapper });

      act(() => {
        result.current.showTaskSuccess('削除');
      });

      expect(result.current.state.toasts).toHaveLength(1);
      const toast = result.current.state.toasts[0];
      expect(toast.type).toBe('success');
      expect(toast.title).toBe('成功');
      expect(toast.message).toBe('タスクを削除しました');
    });

    test('showTaskError creates error toast with correct message', () => {
      const { result } = renderHook(() => useToastNotifications(), { wrapper });

      act(() => {
        result.current.showTaskError('保存', 'ネットワークエラー');
      });

      expect(result.current.state.toasts).toHaveLength(1);
      const toast = result.current.state.toasts[0];
      expect(toast.type).toBe('error');
      expect(toast.title).toBe('エラー');
      expect(toast.message).toBe('タスクの保存に失敗しました: ネットワークエラー');
      expect(toast.duration).toBe(5000);
    });

    test('showTaskError works without specific error message', () => {
      const { result } = renderHook(() => useToastNotifications(), { wrapper });

      act(() => {
        result.current.showTaskError('更新');
      });

      expect(result.current.state.toasts).toHaveLength(1);
      const toast = result.current.state.toasts[0];
      expect(toast.message).toBe('タスクの更新に失敗しました');
    });
  });

  describe('Data Operations', () => {
    test('showDataWarning creates warning toast', () => {
      const { result } = renderHook(() => useToastNotifications(), { wrapper });

      act(() => {
        result.current.showDataWarning('ストレージ容量不足');
      });

      expect(result.current.state.toasts).toHaveLength(1);
      const toast = result.current.state.toasts[0];
      expect(toast.type).toBe('warning');
      expect(toast.title).toBe('注意');
      expect(toast.message).toBe('ストレージ容量不足');
      expect(toast.duration).toBe(4000);
    });

    test('showStorageError creates persistent error toast', () => {
      const { result } = renderHook(() => useToastNotifications(), { wrapper });

      act(() => {
        result.current.showStorageError('データベース接続エラー');
      });

      expect(result.current.state.toasts).toHaveLength(1);
      const toast = result.current.state.toasts[0];
      expect(toast.type).toBe('error');
      expect(toast.title).toBe('保存エラー');
      expect(toast.message).toBe('データの保存に失敗しました: データベース接続エラー。変更は一時的にのみ保存されます。');
      expect(toast.duration).toBe(0); // Persistent toast
    });

    test('showStorageError works without specific error', () => {
      const { result } = renderHook(() => useToastNotifications(), { wrapper });

      act(() => {
        result.current.showStorageError();
      });

      expect(result.current.state.toasts).toHaveLength(1);
      const toast = result.current.state.toasts[0];
      expect(toast.message).toBe('データの保存に失敗しました。変更は一時的にのみ保存されます。');
    });
  });

  describe('Validation Operations', () => {
    test('showValidationError creates error toast with field info', () => {
      const { result } = renderHook(() => useToastNotifications(), { wrapper });

      act(() => {
        result.current.showValidationError('タイトル', '必須項目です');
      });

      expect(result.current.state.toasts).toHaveLength(1);
      const toast = result.current.state.toasts[0];
      expect(toast.type).toBe('error');
      expect(toast.title).toBe('入力エラー');
      expect(toast.message).toBe('タイトル: 必須項目です');
      expect(toast.duration).toBe(4000);
    });
  });

  describe('Info Operations', () => {
    test('showInfo creates info toast', () => {
      const { result } = renderHook(() => useToastNotifications(), { wrapper });

      act(() => {
        result.current.showInfo('ヒント', 'ドラッグ&ドロップで移動できます');
      });

      expect(result.current.state.toasts).toHaveLength(1);
      const toast = result.current.state.toasts[0];
      expect(toast.type).toBe('info');
      expect(toast.title).toBe('ヒント');
      expect(toast.message).toBe('ドラッグ&ドロップで移動できます');
      expect(toast.duration).toBe(3000);
    });

    test('showInfo accepts custom options', () => {
      const { result } = renderHook(() => useToastNotifications(), { wrapper });

      act(() => {
        result.current.showInfo('情報', 'カスタムメッセージ', { duration: 1000 });
      });

      expect(result.current.state.toasts).toHaveLength(1);
      const toast = result.current.state.toasts[0];
      expect(toast.duration).toBe(1000);
    });
  });

  describe('Toast Management', () => {
    test('removeToast removes specific toast', () => {
      const { result } = renderHook(() => useToastNotifications(), { wrapper });

      // Add multiple toasts
      act(() => {
        result.current.showTaskSuccess('作成', 'タスク1');
        result.current.showTaskError('更新', 'エラー1');
      });

      expect(result.current.state.toasts).toHaveLength(2);

      // Remove first toast
      const firstToastId = result.current.state.toasts[0].id;
      act(() => {
        result.current.removeToast(firstToastId);
      });

      expect(result.current.state.toasts).toHaveLength(1);
      expect(result.current.state.toasts[0].id).not.toBe(firstToastId);
    });

    test('clearAllToasts removes all toasts', () => {
      const { result } = renderHook(() => useToastNotifications(), { wrapper });

      // Add multiple toasts
      act(() => {
        result.current.showTaskSuccess('作成', 'タスク1');
        result.current.showTaskError('更新', 'エラー1');
        result.current.showDataWarning('警告1');
      });

      expect(result.current.state.toasts).toHaveLength(3);

      act(() => {
        result.current.clearAllToasts();
      });

      expect(result.current.state.toasts).toHaveLength(0);
    });
  });
});