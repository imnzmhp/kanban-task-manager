/**
 * NewStatusForm - Form component for creating new status with validation
 */

import React, { useState, useCallback } from 'react';
import { CustomStatus } from '../types/CustomStatus';

interface NewStatusFormProps {
  isVisible: boolean;
  existingStatuses: CustomStatus[];
  onSubmit: (name: string) => Promise<void>;
  onCancel: () => void;
}

export const NewStatusForm: React.FC<NewStatusFormProps> = ({
  isVisible,
  existingStatuses,
  onSubmit,
  onCancel
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateName = useCallback((value: string) => {
    const trimmed = value.trim();
    
    if (!trimmed) {
      return 'ステータス名を入力してください';
    }
    
    if (trimmed.length > 50) {
      return 'ステータス名は50文字以内で入力してください';
    }
    
    // Check for duplicates (case insensitive)
    const isDuplicate = existingStatuses.some(status => 
      status.name.toLowerCase() === trimmed.toLowerCase()
    );
    
    if (isDuplicate) {
      return 'この名前は既に使用されています';
    }
    
    return '';
  }, [existingStatuses]);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    
    // Real-time validation
    const errorMessage = validateName(value);
    setError(errorMessage);
  }, [validateName]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errorMessage = validateName(name);
    if (errorMessage) {
      setError(errorMessage);
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit(name.trim());
      setName('');
      setError('');
    } catch (error) {
      setError('ステータスの作成に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  }, [name, validateName, onSubmit]);

  const handleCancel = useCallback(() => {
    setName('');
    setError('');
    onCancel();
  }, [onCancel]);

  if (!isVisible) {
    return null;
  }

  return (
    <div style={{
      padding: '16px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      border: '1px solid #e9ecef',
      marginBottom: '16px'
    }}>
      <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
        新しいステータスを作成
      </h4>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '12px' }}>
          <input
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="ステータス名を入力"
            maxLength={50}
            autoFocus
            style={{
              width: '100%',
              padding: '8px 12px',
              border: error ? '2px solid #dc3545' : '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
          {error && (
            <div style={{
              color: '#dc3545',
              fontSize: '12px',
              marginTop: '4px'
            }}>
              {error}
            </div>
          )}
        </div>
        
        <div style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'flex-end'
        }}>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            style={{
              padding: '8px 16px',
              border: '1px solid #6c757d',
              backgroundColor: '#fff',
              color: '#6c757d',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={!!error || !name.trim() || isSubmitting}
            style={{
              padding: '8px 16px',
              border: 'none',
              backgroundColor: error || !name.trim() ? '#6c757d' : '#007bff',
              color: '#fff',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: error || !name.trim() ? 'not-allowed' : 'pointer'
            }}
          >
            {isSubmitting ? '作成中...' : '作成'}
          </button>
        </div>
      </form>
    </div>
  );
};
