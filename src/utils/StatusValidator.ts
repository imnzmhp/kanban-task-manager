/**
 * Status Validation Utilities for Custom Task Status Manager
 * カスタムタスク状態管理システムのバリデーションユーティリティ
 * 
 * Requirements: 9.1, 9.2, 9.4
 * 
 * このファイルは、カスタム状態の名前検証、重複チェック、
 * 入力の正規化を行うStatusValidatorクラスを提供します。
 */

import { CustomStatus, ValidationResult, ValidationError } from '../types/CustomStatus';

/**
 * 状態名検証のためのエラーコード定数
 */
export const STATUS_VALIDATION_CODES = {
  EMPTY_NAME: 'EMPTY_NAME',
  WHITESPACE_ONLY: 'WHITESPACE_ONLY',
  TOO_LONG: 'TOO_LONG',
  DUPLICATE_NAME: 'DUPLICATE_NAME',
  INVALID_CHARACTERS: 'INVALID_CHARACTERS',
} as const;

/**
 * カスタム状態の検証とフォーマットを行うクラス
 * 
 * Requirements:
 * - 9.1: 状態名の解析と検証
 * - 9.2: 空の名前または空白文字のみを含む名前の拒否
 * - 9.4: 説明的なエラーメッセージの返却
 */
export class StatusValidator {
  /** 状態名の最大文字数制限 */
  private static readonly MAX_NAME_LENGTH = 50;
  
  /** 状態名に使用不可能な文字パターン */
  private static readonly INVALID_CHARS_PATTERN = /[<>&"']/;

  /**
   * 状態名を検証します
   * 
   * @param name 検証する状態名
   * @param existingStatuses 重複チェック用の既存状態リスト
   * @param excludeId 重複チェックから除外するID（更新時に使用）
   * @returns 検証結果
   */
  static validateStatusName(
    name: string,
    existingStatuses: CustomStatus[] = [],
    excludeId?: string
  ): ValidationResult {
    const errors: ValidationError[] = [];
    
    // 入力をトリム（Requirements 9.1）
    const trimmedName = this.trimAndNormalize(name);
    
    // 空白文字のみチェック（Requirements 9.2）
    if (/^\s*$/.test(name)) {
      if (name.length === 0) {
        errors.push({
          field: 'name',
          message: 'ステータス名を入力してください',
          code: STATUS_VALIDATION_CODES.EMPTY_NAME
        });
      } else {
        errors.push({
          field: 'name',
          message: '空白文字のみのステータス名は無効です',
          code: STATUS_VALIDATION_CODES.WHITESPACE_ONLY
        });
      }
    }
    
    // 文字数制限チェック（Requirements 9.1）
    if (trimmedName.length > this.MAX_NAME_LENGTH) {
      errors.push({
        field: 'name',
        message: `ステータス名は${this.MAX_NAME_LENGTH}文字以内で入力してください`,
        code: STATUS_VALIDATION_CODES.TOO_LONG
      });
    }
    
    // 無効な文字チェック（セキュリティ対策）
    if (this.INVALID_CHARS_PATTERN.test(trimmedName)) {
      errors.push({
        field: 'name',
        message: '特殊文字（< > & " \')は使用できません',
        code: STATUS_VALIDATION_CODES.INVALID_CHARACTERS
      });
    }
    
    // 重複チェック（Requirements 9.3）
    const duplicateStatus = existingStatuses.find(
      status => status.id !== excludeId && 
                this.normalizeForComparison(status.name) === this.normalizeForComparison(trimmedName)
    );
    
    if (duplicateStatus) {
      errors.push({
        field: 'name',
        message: `「${trimmedName}」は既に存在するステータス名です`,
        code: STATUS_VALIDATION_CODES.DUPLICATE_NAME
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 入力文字列をトリムし、正規化します
   * 
   * @param input 入力文字列
   * @returns トリム・正規化された文字列
   */
  static trimAndNormalize(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }
    
    return input
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // 不可視文字を除去
      .trim()                              // 前後の空白文字を除去
      .replace(/\s+/g, ' ');               // 連続する空白文字を単一のスペースに変換
  }

  /**
   * 比較用に文字列を正規化します（大文字小文字の区別なし、空白の正規化）
   * 
   * @param input 入力文字列
   * @returns 比較用に正規化された文字列
   */
  static normalizeForComparison(input: string): string {
    return this.trimAndNormalize(input)
      .toLowerCase()                       // 小文字に変換
      .replace(/\s/g, '');                // 全ての空白文字を除去
  }

  /**
   * 表示用に状態名をフォーマットします
   * 
   * @param name 状態名
   * @returns フォーマットされた状態名
   */
  static formatStatusName(name: string): string {
    const trimmed = this.trimAndNormalize(name);
    
    // 先頭文字を大文字に（英語の場合のみ）
    if (trimmed && /^[a-zA-Z]/.test(trimmed)) {
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    }
    
    return trimmed;
  }

  /**
   * バッチで複数の状態名を検証します
   * 
   * @param names 検証する状態名のリスト
   * @param existingStatuses 重複チェック用の既存状態リスト
   * @returns 各名前の検証結果マップ
   */
  static validateMultipleNames(
    names: string[],
    existingStatuses: CustomStatus[] = []
  ): Map<string, ValidationResult> {
    const results = new Map<string, ValidationResult>();
    const processedNames = new Set<string>();
    
    // 入力リスト内での重複もチェック
    names.forEach((name, index) => {
      const normalizedName = this.normalizeForComparison(name);
      
      // 現在のリスト内で既に処理済みの名前かチェック
      const isDuplicateInBatch = processedNames.has(normalizedName);
      
      let validation = this.validateStatusName(name, existingStatuses);
      
      if (isDuplicateInBatch && validation.isValid) {
        // バッチ内重複エラーを追加
        validation = {
          isValid: false,
          errors: [
            ...validation.errors,
            {
              field: 'name',
              message: `「${name}」がリスト内で重複しています`,
              code: STATUS_VALIDATION_CODES.DUPLICATE_NAME
            }
          ]
        };
      }
      
      results.set(`${index}:${name}`, validation);
      processedNames.add(normalizedName);
    });
    
    return results;
  }

  /**
   * 状態名が安全かどうかをチェックします（XSS防御）
   * 
   * @param name 状態名
   * @returns 安全かどうかのブール値
   */
  static isSafeName(name: string): boolean {
    const trimmed = this.trimAndNormalize(name);
    
    // HTMLタグや危険なパターンをチェック
    const dangerousPatterns = [
      /<[^>]*>/,          // HTMLタグ
      /javascript:/i,     // JavaScriptプロトコル
      /on\w+\s*=/i,      // イベントハンドラー
      /data:/i,           // データURI
      /vbscript:/i        // VBScript
    ];
    
    return !dangerousPatterns.some(pattern => pattern.test(trimmed));
  }

  /**
   * エラーメッセージを取得します
   * 
   * @param errors エラーリスト
   * @returns 結合されたエラーメッセージ
   */
  static getErrorMessage(errors: ValidationError[]): string {
    if (errors.length === 0) {
      return '';
    }
    
    if (errors.length === 1) {
      return errors[0].message;
    }
    
    return errors.map(error => error.message).join('\n');
  }

  /**
   * 特定のエラーコードが存在するかチェックします
   * 
   * @param errors エラーリスト
   * @param code 検索するエラーコード
   * @returns エラーコードが存在するかどうか
   */
  static hasErrorCode(errors: ValidationError[], code: string): boolean {
    return errors.some(error => error.code === code);
  }

  /**
   * デバッグ用：検証結果の詳細情報を取得
   * 
   * @param result 検証結果
   * @returns デバッグ情報
   */
  static getValidationDebugInfo(result: ValidationResult): object {
    return {
      isValid: result.isValid,
      errorCount: result.errors.length,
      errorCodes: result.errors.map(e => e.code),
      errorMessages: result.errors.map(e => e.message)
    };
  }
}

/**
 * よく使用される検証パターンのヘルパー関数
 */
export const StatusValidationHelpers = {
  /**
   * 基本的な状態名検証（重複チェックなし）
   */
  validateBasicName: (name: string): ValidationResult => {
    return StatusValidator.validateStatusName(name, []);
  },

  /**
   * 安全な状態名かどうかの簡易チェック
   */
  isValidStatusName: (name: string): boolean => {
    const result = StatusValidator.validateStatusName(name, []);
    return result.isValid && StatusValidator.isSafeName(name);
  },

  /**
   * 状態名のクリーンアップ（自動修正）
   */
  cleanStatusName: (name: string): string => {
    return StatusValidator.formatStatusName(name);
  }
};