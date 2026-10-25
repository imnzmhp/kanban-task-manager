/**
 * EnhancedColumn Demo Component
 * Demonstrates the functionality of EnhancedColumn with CustomStatus support
 * 
 * This demo showcases:
 * - Custom status with dynamic colors
 * - Responsive truncation behavior
 * - Tooltip functionality
 * - Color transitions
 */

import React, { useState, useEffect } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { EnhancedColumn } from './EnhancedColumn';
import { CustomStatus } from '../types/CustomStatus';
import { StatusProvider } from '../contexts/StatusContext';
import { TaskProvider } from '../contexts/TaskContext';
import { ToastProvider } from '../contexts/ToastContext';

/**
 * Demo data for testing EnhancedColumn
 */
const demoStatuses: CustomStatus[] = [
  {
    id: 'demo-todo',
    name: 'TODO',
    displayOrder: 0,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'demo-doing', 
    name: 'DOING',
    displayOrder: 1,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'demo-review',
    name: 'Code Review and Testing',
    displayOrder: 2,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'demo-deployment',
    name: 'Ready for Deployment',
    displayOrder: 3,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'demo-done',
    name: 'DONE',
    displayOrder: 4,
    createdAt: new Date('2024-01-01')
  }
];

/**
 * EnhancedColumn Demo Component
 */
export const EnhancedColumnDemo: React.FC = () => {
  const [screenSizeInfo, setScreenSizeInfo] = useState({
    width: window.innerWidth,
    size: 'desktop' as 'desktop' | 'mobile' | 'tablet'
  });

  // Update screen size for demo purposes
  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      let size: 'desktop' | 'mobile' | 'tablet' = 'desktop';
      
      if (width <= 480) {
        size = 'mobile';
      } else if (width <= 768) {
        size = 'tablet';
      }
      
      setScreenSizeInfo({ width, size });
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  // Demo handlers
  const handleAddTask = (statusId: string) => {
    console.log('Adding task to status:', statusId);
    alert(`Adding task to status: ${statusId}`);
  };

  const handleEditTask = (taskId: string) => {
    console.log('Editing task:', taskId);
    alert(`Editing task: ${taskId}`);
  };

  const handleDeleteTask = (taskId: string) => {
    console.log('Deleting task:', taskId);
    alert(`Deleting task: ${taskId}`);
  };

  const handleDragEnd = (result: DropResult) => {
    console.log('Drag end:', result);
  };

  return (
    <StatusProvider>
      <TaskProvider>
        <ToastProvider>
          <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
            <h2>EnhancedColumn Demo</h2>
            
            {/* Screen Size Info */}
            <div style={{ 
              marginBottom: '20px', 
              padding: '10px', 
              backgroundColor: '#f5f5f5', 
              borderRadius: '8px' 
            }}>
              <strong>Screen Size:</strong> {screenSizeInfo.width}px ({screenSizeInfo.size})
              <br />
              <strong>Truncation Limits:</strong>
              <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                <li>Desktop (1025px+): 20 characters</li>
                <li>Tablet (769-1024px): 18 characters</li>
                <li>Mobile (≤768px): 15 characters</li>
                <li>Small Mobile (≤480px): 12 characters</li>
              </ul>
            </div>

            {/* Enhanced Columns Demo */}
            <DragDropContext onDragEnd={handleDragEnd}>
              <div style={{ 
                display: 'flex', 
                gap: '20px', 
                overflowX: 'auto', 
                padding: '10px 0' 
              }}>
                {demoStatuses.map((status) => (
                  <EnhancedColumn
                    key={status.id}
                    status={status}
                    onAddTask={handleAddTask}
                    onEditTask={handleEditTask}
                    onDeleteTask={handleDeleteTask}
                  />
                ))}
              </div>
            </DragDropContext>

            {/* Feature Description */}
            <div style={{ 
              marginTop: '30px', 
              padding: '20px', 
              backgroundColor: '#e8f4f8', 
              borderRadius: '8px' 
            }}>
              <h3>Features Demonstrated:</h3>
              <ul>
                <li><strong>Dynamic Colors:</strong> Each column gets unique colors based on position</li>
                <li><strong>Responsive Truncation:</strong> Long names are truncated based on screen size</li>
                <li><strong>Tooltips:</strong> Hover over truncated names to see full text</li>
                <li><strong>Smooth Transitions:</strong> Color changes animate smoothly (300ms)</li>
                <li><strong>Accessibility:</strong> Proper ARIA labels and reduced motion support</li>
                <li><strong>CustomStatus Support:</strong> Works with dynamic status objects</li>
              </ul>
            </div>

            {/* Instructions */}
            <div style={{ 
              marginTop: '20px', 
              padding: '15px', 
              backgroundColor: '#fff3cd', 
              borderRadius: '8px' 
            }}>
              <h4>Try This:</h4>
              <ul>
                <li>Resize your browser window to see responsive truncation</li>
                <li>Hover over long status names to see tooltips</li>
                <li>Click "Add Task" buttons to test interactions</li>
                <li>Notice the different colors for each status</li>
              </ul>
            </div>
          </div>
        </ToastProvider>
      </TaskProvider>
    </StatusProvider>
  );
};

export default EnhancedColumnDemo;