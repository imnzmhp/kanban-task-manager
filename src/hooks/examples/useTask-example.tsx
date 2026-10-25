/**
 * Example usage of useTask hook
 * This file demonstrates how components would use the useTask hook
 */

import React from 'react';
import { useTask, useTaskStats, useTasksByStatus, useTaskForm, useTaskSearch } from '../useTask';

/**
 * Example component showing basic task operations
 */
export const TaskOperationsExample: React.FC = () => {
  const { tasks, loading, error } = useTask();
  const { validateTaskForm, createTask } = useTaskForm();

  const handleCreateTask = async () => {
    const taskData = { title: 'New Task', description: 'Task description' };

    const validation = validateTaskForm(taskData);
    if (!validation.isValid) {
      console.error('Validation errors:', validation.errors);
      return;
    }

    try {
      await createTask(taskData);
      console.log('Task created successfully');
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Task Operations Example</h2>
      <button onClick={handleCreateTask}>Create Sample Task</button>
      <p>Total tasks: {tasks.length}</p>
    </div>
  );
};

/**
 * Example component showing task filtering and statistics
 */
export const TaskStatsExample: React.FC = () => {
  const stats = useTaskStats();

  return (
    <div>
      <h2>Task Statistics</h2>
      <ul>
        <li>Total: {stats.total}</li>
        <li>TODO: {stats.byStatus['TODO'] ?? 0}</li>
        <li>DOING: {stats.byStatus['DOING'] ?? 0}</li>
        <li>DONE: {stats.byStatus['DONE'] ?? 0}</li>
      </ul>
    </div>
  );
};

/**
 * Example component showing status-specific task display
 */
export const TaskColumnExample: React.FC<{ status: 'TODO' | 'DOING' | 'DONE' }> = ({ status }) => {
  const tasks = useTasksByStatus(status);

  return (
    <div>
      <h3>{status} ({tasks.length})</h3>
      {tasks.map(task => (
        <div key={task.id}>
          <h4>{task.title}</h4>
          <p>{task.description}</p>
        </div>
      ))}
    </div>
  );
};

/**
 * Example component showing task filtering
 */
export const TaskSearchExample: React.FC = () => {
  const { searchTasks } = useTaskSearch();
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredTasks = React.useMemo(() => {
    return searchTasks(searchTerm);
  }, [searchTasks, searchTerm]);

  return (
    <div>
      <h2>Task Search</h2>
      <input
        type="text"
        placeholder="Search tasks..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div>
        <h3>Results ({filteredTasks.length})</h3>
        {filteredTasks.map(task => (
          <div key={task.id}>
            <h4>{task.title}</h4>
            <p>{task.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
