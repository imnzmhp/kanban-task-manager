/**
 * Example usage of useTask hook
 * This file demonstrates how components would use the useTask hook
 */

import React from 'react';
import { useTask, useTaskStats, useTasksByStatus } from '../useTask';

/**
 * Example component showing basic task operations
 */
export const TaskOperationsExample: React.FC = () => {
  const { 
    tasks,
    loading,
    error,
    createTask,
    validateTaskForm
  } = useTask();

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
        <li>TODO: {stats.todo}</li>
        <li>DOING: {stats.doing}</li>
        <li>DONE: {stats.done}</li>
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
  const { filterTasks } = useTask();
  const [searchTerm, setSearchTerm] = React.useState('');
  
  const filteredTasks = React.useMemo(() => {
    return filterTasks({ search: searchTerm });
  }, [filterTasks, searchTerm]);

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
            <span>Status: {task.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
};