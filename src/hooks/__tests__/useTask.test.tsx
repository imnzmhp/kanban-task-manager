/**
 * useTask Hook Tests
 * Basic tests to ensure the hook integrates correctly with TaskContext
 */

import { renderHook } from '@testing-library/react';
import { TaskProvider } from '../../contexts';
import { useTask } from '../useTask';

// Mock TaskRepository to avoid localStorage calls during testing
jest.mock('../../services/TaskRepository', () => ({
  TaskRepository: {
    getAllTasks: jest.fn(() => Promise.resolve([])),
    saveTask: jest.fn(() => Promise.resolve()),
    deleteTask: jest.fn(() => Promise.resolve()),
  }
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TaskProvider>{children}</TaskProvider>
);

describe('useTask', () => {
  test('should provide task state and operations', () => {
    const { result } = renderHook(() => useTask(), { wrapper });
    
    expect(result.current).toMatchObject({
      tasks: expect.any(Array),
      loading: expect.any(Boolean),
      error: null,
      createTask: expect.any(Function),
      updateTask: expect.any(Function),
      deleteTask: expect.any(Function),
      moveTask: expect.any(Function),
      loadTasks: expect.any(Function),
      getTaskById: expect.any(Function),
      getTasksByStatus: expect.any(Function),
      filterTasks: expect.any(Function),
      getTaskStats: expect.any(Function),
      hasAnyTasks: expect.any(Function),
      getMostRecentTask: expect.any(Function),
      validateTaskForm: expect.any(Function),
    });
  });

  test('should validate task form correctly', () => {
    const { result } = renderHook(() => useTask(), { wrapper });
    
    // Valid task data
    const validTask = { title: 'Valid Task', description: 'Valid description' };
    const validResult = result.current.validateTaskForm(validTask);
    expect(validResult.isValid).toBe(true);
    expect(validResult.errors).toEqual({});
    
    // Invalid task data - empty title
    const invalidTask = { title: '', description: 'Some description' };
    const invalidResult = result.current.validateTaskForm(invalidTask);
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.errors.title).toBeDefined();
  });

  test('should provide task statistics', () => {
    const { result } = renderHook(() => useTask(), { wrapper });
    
    const stats = result.current.getTaskStats();
    expect(stats).toMatchObject({
      total: expect.any(Number),
      todo: expect.any(Number),
      doing: expect.any(Number),
      done: expect.any(Number),
    });
  });
});