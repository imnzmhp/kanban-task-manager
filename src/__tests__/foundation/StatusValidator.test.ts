/**
 * StatusValidator システムのテスト
 * バリデーション機能と入力正規化の確認
 */

import { StatusValidator, STATUS_VALIDATION_CODES, StatusValidationHelpers } from '../../utils/StatusValidator';
import { CustomStatus } from '../../types/CustomStatus';

describe('StatusValidator', () => {
  const mockStatuses: CustomStatus[] = [
    {
      id: '1',
      name: 'To Do',
      displayOrder: 0,
      createdAt: new Date()
    },
    {
      id: '2', 
      name: 'In Progress',
      displayOrder: 1,
      createdAt: new Date()
    }
  ];

  describe('基本的な名前検証', () => {
    test('有効な名前を受け入れる', () => {
      const result = StatusValidator.validateStatusName('Valid Status', mockStatuses);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('空の名前を拒否する', () => {
      const result = StatusValidator.validateStatusName('', mockStatuses);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe(STATUS_VALIDATION_CODES.EMPTY_NAME);
    });

    test('空白文字のみの名前を拒否する', () => {
      const result = StatusValidator.validateStatusName('   ', mockStatuses);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe(STATUS_VALIDATION_CODES.WHITESPACE_ONLY);
    });

    test('長すぎる名前を拒否する', () => {
      const longName = 'a'.repeat(51); // 51文字
      const result = StatusValidator.validateStatusName(longName, mockStatuses);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe(STATUS_VALIDATION_CODES.TOO_LONG);
    });
  });

  describe('重複チェック', () => {
    test('重複する名前を拒否する（完全一致）', () => {
      const result = StatusValidator.validateStatusName('To Do', mockStatuses);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe(STATUS_VALIDATION_CODES.DUPLICATE_NAME);
    });

    test('重複する名前を拒否する（大文字小文字の違いを無視）', () => {
      const result = StatusValidator.validateStatusName('to do', mockStatuses);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe(STATUS_VALIDATION_CODES.DUPLICATE_NAME);
    });

    test('除外IDが指定されている場合は重複を許可する', () => {
      const result = StatusValidator.validateStatusName('To Do', mockStatuses, '1');
      expect(result.isValid).toBe(true);
    });
  });

  describe('セキュリティ検証', () => {
    test('無効な文字を含む名前を拒否する', () => {
      const result = StatusValidator.validateStatusName('<script>', mockStatuses);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === STATUS_VALIDATION_CODES.INVALID_CHARACTERS)).toBe(true);
    });

    test('安全な名前のチェックが動作する', () => {
      expect(StatusValidator.isSafeName('Safe Status')).toBe(true);
      expect(StatusValidator.isSafeName('<script>alert("xss")</script>')).toBe(false);
    });
  });

  describe('文字列正規化', () => {
    test('入力のトリムと正規化が動作する', () => {
      expect(StatusValidator.trimAndNormalize('  Test Status  ')).toBe('Test Status');
      expect(StatusValidator.trimAndNormalize('Test   Multiple   Spaces')).toBe('Test Multiple Spaces');
      expect(StatusValidator.trimAndNormalize('')).toBe('');
    });

    test('比較用正規化が動作する', () => {
      expect(StatusValidator.normalizeForComparison('  Test Status  ')).toBe('teststatus');
      expect(StatusValidator.normalizeForComparison('Test Status')).toBe('teststatus');
      expect(StatusValidator.normalizeForComparison('TEST STATUS')).toBe('teststatus');
    });

    test('表示用フォーマットが動作する', () => {
      expect(StatusValidator.formatStatusName('test status')).toBe('Test status');
      expect(StatusValidator.formatStatusName('  test status  ')).toBe('Test status');
      expect(StatusValidator.formatStatusName('テストステータス')).toBe('テストステータス');
    });
  });

  describe('ヘルパー機能', () => {
    test('エラーメッセージの取得が動作する', () => {
      const result = StatusValidator.validateStatusName('', mockStatuses);
      const message = StatusValidator.getErrorMessage(result.errors);
      
      expect(message).toBeTruthy();
      expect(typeof message).toBe('string');
    });

    test('エラーコードの存在チェックが動作する', () => {
      const result = StatusValidator.validateStatusName('', mockStatuses);
      
      expect(StatusValidator.hasErrorCode(result.errors, STATUS_VALIDATION_CODES.EMPTY_NAME)).toBe(true);
      expect(StatusValidator.hasErrorCode(result.errors, STATUS_VALIDATION_CODES.DUPLICATE_NAME)).toBe(false);
    });
  });

  describe('ヘルパー関数', () => {
    test('基本検証ヘルパーが動作する', () => {
      expect(StatusValidationHelpers.validateBasicName('Valid Name').isValid).toBe(true);
      expect(StatusValidationHelpers.validateBasicName('').isValid).toBe(false);
      
      expect(StatusValidationHelpers.isValidStatusName('Valid Name')).toBe(true);
      expect(StatusValidationHelpers.isValidStatusName('<script>')).toBe(false);
      
      expect(StatusValidationHelpers.cleanStatusName('  test name  ')).toBe('Test name');
    });
  });
});