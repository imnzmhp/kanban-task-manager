/**
 * Unit tests for StatusValidator
 * Requirements: 9.1, 9.2, 9.4
 */

import { StatusValidator, StatusValidationHelpers, STATUS_VALIDATION_CODES } from '../StatusValidator';
import { CustomStatus } from '../../types/CustomStatus';

// テスト用のモックデータ
const mockExistingStatuses: CustomStatus[] = [
  {
    id: '1',
    name: 'TODO',
    displayOrder: 0,
    createdAt: new Date('2023-01-01')
  },
  {
    id: '2',
    name: 'In Progress',
    displayOrder: 1,
    createdAt: new Date('2023-01-02')
  },
  {
    id: '3',
    name: 'DONE',
    displayOrder: 2,
    createdAt: new Date('2023-01-03')
  }
];

describe('StatusValidator', () => {
  describe('validateStatusName', () => {
    test('should validate a valid status name', () => {
      const result = StatusValidator.validateStatusName('Valid Status');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject empty status name', () => {
      const result = StatusValidator.validateStatusName('');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe(STATUS_VALIDATION_CODES.EMPTY_NAME);
      expect(result.errors[0].message).toContain('ステータス名を入力してください');
    });

    test('should reject whitespace-only status name', () => {
      const result = StatusValidator.validateStatusName('   \t\n   ');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe(STATUS_VALIDATION_CODES.WHITESPACE_ONLY);
      expect(result.errors[0].message).toContain('空白文字のみのステータス名は無効です');
    });

    test('should reject status name exceeding 50 characters', () => {
      const longName = 'A'.repeat(51);
      const result = StatusValidator.validateStatusName(longName);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe(STATUS_VALIDATION_CODES.TOO_LONG);
      expect(result.errors[0].message).toContain('50文字以内');
    });

    test('should accept status name with exactly 50 characters', () => {
      const maxName = 'A'.repeat(50);
      const result = StatusValidator.validateStatusName(maxName);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid characters', () => {
      const invalidNames = ['Test<script>', 'Name&quot;', 'Status>alert', 'Test"name', "Test'name"];
      
      invalidNames.forEach(name => {
        const result = StatusValidator.validateStatusName(name);
        expect(result.isValid).toBe(false);
        expect(result.errors[0].code).toBe(STATUS_VALIDATION_CODES.INVALID_CHARACTERS);
      });
    });

    test('should detect duplicate status names', () => {
      const result = StatusValidator.validateStatusName('TODO', mockExistingStatuses);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe(STATUS_VALIDATION_CODES.DUPLICATE_NAME);
      expect(result.errors[0].message).toContain('既に存在するステータス名です');
    });

    test('should detect duplicate with case insensitive comparison', () => {
      const result = StatusValidator.validateStatusName('todo', mockExistingStatuses);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe(STATUS_VALIDATION_CODES.DUPLICATE_NAME);
    });

    test('should detect duplicate with whitespace normalization', () => {
      const result = StatusValidator.validateStatusName('  In   Progress  ', mockExistingStatuses);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe(STATUS_VALIDATION_CODES.DUPLICATE_NAME);
    });

    test('should allow same name when excluding specific ID', () => {
      const result = StatusValidator.validateStatusName('TODO', mockExistingStatuses, '1');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should handle multiple validation errors', () => {
      const longInvalidName = '<script>alert("xss")</script>' + 'A'.repeat(30);
      const result = StatusValidator.validateStatusName(longInvalidName);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors.some(e => e.code === STATUS_VALIDATION_CODES.TOO_LONG)).toBe(true);
      expect(result.errors.some(e => e.code === STATUS_VALIDATION_CODES.INVALID_CHARACTERS)).toBe(true);
    });
  });

  describe('trimAndNormalize', () => {
    test('should trim whitespace from both ends', () => {
      const result = StatusValidator.trimAndNormalize('  test  ');
      expect(result).toBe('test');
    });

    test('should normalize multiple consecutive spaces to single space', () => {
      const result = StatusValidator.trimAndNormalize('test   multiple    spaces');
      expect(result).toBe('test multiple spaces');
    });

    test('should remove invisible characters', () => {
      const result = StatusValidator.trimAndNormalize('test\u200B\u200C\u200D\uFEFFstring');
      expect(result).toBe('teststring');
    });

    test('should handle non-string input', () => {
      // @ts-ignore - Testing runtime safety
      const result = StatusValidator.trimAndNormalize(null);
      expect(result).toBe('');
    });

    test('should handle empty string', () => {
      const result = StatusValidator.trimAndNormalize('');
      expect(result).toBe('');
    });
  });

  describe('normalizeForComparison', () => {
    test('should convert to lowercase and remove all spaces', () => {
      const result = StatusValidator.normalizeForComparison('  Test Status  ');
      expect(result).toBe('teststatus');
    });

    test('should handle Japanese characters', () => {
      const result = StatusValidator.normalizeForComparison('  テスト ステータス  ');
      expect(result).toBe('テストステータス');
    });
  });

  describe('formatStatusName', () => {
    test('should capitalize first letter for English names', () => {
      const result = StatusValidator.formatStatusName('test status');
      expect(result).toBe('Test status');
    });

    test('should not modify Japanese names', () => {
      const result = StatusValidator.formatStatusName('テストステータス');
      expect(result).toBe('テストステータス');
    });

    test('should handle empty string', () => {
      const result = StatusValidator.formatStatusName('');
      expect(result).toBe('');
    });

    test('should trim and normalize before formatting', () => {
      const result = StatusValidator.formatStatusName('  test   status  ');
      expect(result).toBe('Test status');
    });
  });

  describe('validateMultipleNames', () => {
    test('should validate multiple unique names', () => {
      const names = ['New Status 1', 'New Status 2', 'New Status 3'];
      const results = StatusValidator.validateMultipleNames(names, mockExistingStatuses);
      
      expect(results.size).toBe(3);
      Array.from(results.values()).forEach(result => {
        expect(result.isValid).toBe(true);
      });
    });

    test('should detect duplicates within the batch', () => {
      const names = ['New Status', 'Another Status', 'New Status'];
      const results = StatusValidator.validateMultipleNames(names, mockExistingStatuses);
      
      const duplicateResult = Array.from(results.entries()).find(
        ([key]) => key.includes('New Status') && key.startsWith('2:')
      );
      
      expect(duplicateResult).toBeDefined();
      expect(duplicateResult![1].isValid).toBe(false);
      expect(duplicateResult![1].errors[0].code).toBe(STATUS_VALIDATION_CODES.DUPLICATE_NAME);
    });

    test('should detect duplicates with existing statuses', () => {
      const names = ['TODO', 'New Status'];
      const results = StatusValidator.validateMultipleNames(names, mockExistingStatuses);
      
      const todoResult = Array.from(results.entries()).find(
        ([key]) => key.includes('TODO')
      );
      
      expect(todoResult).toBeDefined();
      expect(todoResult![1].isValid).toBe(false);
      expect(todoResult![1].errors[0].code).toBe(STATUS_VALIDATION_CODES.DUPLICATE_NAME);
    });
  });

  describe('isSafeName', () => {
    test('should accept safe status names', () => {
      const safeNames = ['Test Status', 'プロジェクト管理', 'Status_123', 'Status-Name'];
      
      safeNames.forEach(name => {
        expect(StatusValidator.isSafeName(name)).toBe(true);
      });
    });

    test('should reject dangerous patterns', () => {
      const dangerousNames = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img onerror="alert(1)">',
        'data:text/html,<script>alert(1)</script>',
        'vbscript:msgbox("xss")',
        '<div onclick="alert(1)">Click me</div>'
      ];
      
      dangerousNames.forEach(name => {
        expect(StatusValidator.isSafeName(name)).toBe(false);
      });
    });
  });

  describe('getErrorMessage', () => {
    test('should return empty string for no errors', () => {
      const message = StatusValidator.getErrorMessage([]);
      expect(message).toBe('');
    });

    test('should return single message for one error', () => {
      const errors = [{ field: 'name', message: 'Test error', code: 'TEST_ERROR' }];
      const message = StatusValidator.getErrorMessage(errors);
      expect(message).toBe('Test error');
    });

    test('should join multiple messages with newlines', () => {
      const errors = [
        { field: 'name', message: 'First error', code: 'ERROR_1' },
        { field: 'name', message: 'Second error', code: 'ERROR_2' }
      ];
      const message = StatusValidator.getErrorMessage(errors);
      expect(message).toBe('First error\nSecond error');
    });
  });

  describe('hasErrorCode', () => {
    test('should find existing error code', () => {
      const errors = [
        { field: 'name', message: 'Error', code: STATUS_VALIDATION_CODES.EMPTY_NAME }
      ];
      
      expect(StatusValidator.hasErrorCode(errors, STATUS_VALIDATION_CODES.EMPTY_NAME)).toBe(true);
    });

    test('should return false for non-existing error code', () => {
      const errors = [
        { field: 'name', message: 'Error', code: STATUS_VALIDATION_CODES.EMPTY_NAME }
      ];
      
      expect(StatusValidator.hasErrorCode(errors, STATUS_VALIDATION_CODES.TOO_LONG)).toBe(false);
    });

    test('should return false for empty error list', () => {
      expect(StatusValidator.hasErrorCode([], STATUS_VALIDATION_CODES.EMPTY_NAME)).toBe(false);
    });
  });
});

describe('StatusValidationHelpers', () => {
  describe('validateBasicName', () => {
    test('should validate without duplicate checking', () => {
      const result = StatusValidationHelpers.validateBasicName('TODO');
      expect(result.isValid).toBe(true);
    });

    test('should still catch basic validation errors', () => {
      const result = StatusValidationHelpers.validateBasicName('');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe(STATUS_VALIDATION_CODES.EMPTY_NAME);
    });
  });

  describe('isValidStatusName', () => {
    test('should return true for valid safe names', () => {
      expect(StatusValidationHelpers.isValidStatusName('Valid Status')).toBe(true);
    });

    test('should return false for invalid names', () => {
      expect(StatusValidationHelpers.isValidStatusName('')).toBe(false);
    });

    test('should return false for unsafe names', () => {
      expect(StatusValidationHelpers.isValidStatusName('<script>')).toBe(false);
    });
  });

  describe('cleanStatusName', () => {
    test('should clean and format status name', () => {
      const result = StatusValidationHelpers.cleanStatusName('  test  status  ');
      expect(result).toBe('Test status');
    });

    test('should handle empty input', () => {
      const result = StatusValidationHelpers.cleanStatusName('');
      expect(result).toBe('');
    });
  });
});