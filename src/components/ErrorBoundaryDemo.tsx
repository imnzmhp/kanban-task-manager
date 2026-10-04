/**
 * ErrorBoundary Demo Component
 * Used to test ErrorBoundary functionality
 */

import React, { useState } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

const ProblematicComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('This is a test error to demonstrate ErrorBoundary functionality');
  }
  
  return (
    <div style={{ padding: '20px', border: '1px solid green', marginTop: '10px' }}>
      <h3>Component is working normally</h3>
      <p>This component is functioning without errors.</p>
    </div>
  );
};

export const ErrorBoundaryDemo: React.FC = () => {
  const [shouldThrow, setShouldThrow] = useState(false);

  return (
    <div style={{ padding: '20px', maxWidth: '600px' }}>
      <h2>ErrorBoundary Demonstration</h2>
      <p>This demo shows how the ErrorBoundary component handles React errors.</p>
      
      <button 
        onClick={() => setShouldThrow(!shouldThrow)}
        style={{ 
          padding: '10px 20px', 
          margin: '10px 0',
          backgroundColor: shouldThrow ? '#dc3545' : '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        {shouldThrow ? 'Fix Component' : 'Break Component'}
      </button>

      <ErrorBoundary key={shouldThrow ? 'error' : 'normal'}>
        <ProblematicComponent shouldThrow={shouldThrow} />
      </ErrorBoundary>
    </div>
  );
};