# React Hooks for Kanban Task Manager

This directory contains custom React hooks that provide convenient interfaces to the TaskContext and additional utilities for task management.

## Hooks Overview

### `useTask()`
The main hook that provides a comprehensive interface to all task operations and utilities.

**Features:**
- Direct access to task state (tasks, loading, error)
- Task operations (create, update, delete, move) with built-in validation
- Utility methods for filtering, searching, and statistics
- Form validation helpers

**Usage:**
```tsx
const { 
  tasks, 
  loading, 
  error,
  createTask, 
  updateTask, 
  deleteTask, 
  moveTask,
  getTasksByStatus,
  filterTasks,
  getTaskStats,
  validateTaskForm
} = useTask();
```

### `useTasksByStatus(status)`
Optimized hook for getting tasks by specific status with memoization.

**Usage:**
```tsx
const todoTasks = useTasksByStatus('TODO');
const doingTasks = useTasksByStatus('DOING');
const doneTasks = useTasksByStatus('DONE');
```

### `useTaskStats()`
Hook for getting task statistics with memoization.

**Returns:**
```tsx
{
  total: number;
  todo: number;
  doing: number;
  done: number;
}
```

### `useTaskSearch(searchTerm)`
Hook for searching tasks with built-in filtering logic.

**Usage:**
```tsx
const [searchTerm, setSearchTerm] = useState('');
const searchResults = useTaskSearch(searchTerm);
```

### `useTaskForm()`
Specialized hook for form handling with validation and submission logic.

**Usage:**
```tsx
const { validateTaskForm, handleSubmit } = useTaskForm();

const result = await handleSubmit(taskData, taskId);
if (result.success) {
  // Task saved successfully
} else {
  // Handle validation errors
  console.error(result.errors);
}
```

## Key Features

1. **Built-in Validation**: All hooks include proper validation according to requirements
2. **Performance Optimization**: Uses React.useMemo for expensive operations
3. **Error Handling**: Comprehensive error handling with user-friendly messages
4. **TypeScript Support**: Full type safety with detailed interfaces
5. **Convenience Methods**: Additional utilities for common operations

## Integration

These hooks build on top of the TaskContext and provide a more component-friendly API while maintaining all the functionality required by the Kanban system requirements.

All hooks follow React best practices and are optimized for performance with proper memoization strategies.