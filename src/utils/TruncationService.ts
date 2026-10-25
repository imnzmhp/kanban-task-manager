/**
 * Truncation Service for Custom Status Management
 * カスタムタスク状態管理システムの省略表示サービス
 * 
 * Requirements: 5.1, 5.2, 5.3
 * 
 * このファイルは、レスポンシブな状態名表示のための省略ロジック、
 * ツールチップ表示判定、画面サイズ対応を提供します。
 */

import { TruncatedDisplayResult } from '../types/CustomStatus';

/**
 * 画面サイズタイプ
 */
export type ScreenSize = 'desktop' | 'mobile' | 'tablet';

/**
 * TruncationService - レスポンシブ状態名表示の省略管理
 * 
 * このクラスは以下の機能を提供します：
 * - 画面サイズに応じた省略表示
 * - ツールチップ必要性の判定
 * - Unicode対応の文字数計算
 * - アクセシビリティ考慮の省略処理
 */
export class TruncationService {
  /** デスクトップでの最大文字数 */
  private static readonly DESKTOP_MAX_LENGTH = 20;
  
  /** モバイルでの最大文字数 */
  private static readonly MOBILE_MAX_LENGTH = 15;
  
  /** タブレットでの最大文字数 */
  private static readonly TABLET_MAX_LENGTH = 18;
  
  /** 省略記号 */
  private static readonly ELLIPSIS = '…';
  
  /** 最小表示文字数（省略時でも保持） */
  private static readonly MIN_DISPLAY_LENGTH = 3;

  /**
   * 状態名の省略表示を取得
   * 
   * @param statusName 元の状態名
   * @param screenSize 画面サイズ
   * @returns 省略表示結果
   */
  static getTruncatedDisplay(
    statusName: string, 
    screenSize: ScreenSize = 'desktop'
  ): TruncatedDisplayResult {
    // 入力の正規化
    const cleanedName = this.normalizeStatusName(statusName);
    
    if (!cleanedName) {
      return {
        displayText: '',
        shouldShowTooltip: false,
        fullText: statusName
      };
    }

    // 画面サイズに応じた最大長を取得
    const maxLength = this.getMaxLength(screenSize);
    
    // Unicode文字を考慮した文字数計算
    const actualLength = this.getDisplayLength(cleanedName);
    
    // 省略が不要な場合
    if (actualLength <= maxLength) {
      return {
        displayText: cleanedName,
        shouldShowTooltip: false,
        fullText: statusName
      };
    }

    // 省略処理
    const truncatedText = this.truncateText(cleanedName, maxLength);
    
    return {
      displayText: truncatedText,
      shouldShowTooltip: true,
      fullText: statusName
    };
  }

  /**
   * 複数の状態名を一括で省略表示処理
   * 
   * @param statusNames 状態名の配列
   * @param screenSize 画面サイズ
   * @returns 省略表示結果の配列
   */
  static getTruncatedDisplayBatch(
    statusNames: string[], 
    screenSize: ScreenSize = 'desktop'
  ): TruncatedDisplayResult[] {
    return statusNames.map(name => this.getTruncatedDisplay(name, screenSize));
  }

  /**
   * ブレークポイントから画面サイズを判定
   * 
   * @param width 画面幅（ピクセル）
   * @returns 画面サイズタイプ
   */
  static getScreenSizeFromWidth(width: number): ScreenSize {
    if (width <= 480) {
      return 'mobile';
    } else if (width <= 768) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }

  /**
   * メディアクエリから画面サイズを取得
   * ブラウザ環境での動的判定用
   * 
   * @returns 現在の画面サイズタイプ
   */
  static getCurrentScreenSize(): ScreenSize {
    if (typeof window === 'undefined') {
      return 'desktop'; // SSR環境ではデスクトップをデフォルト
    }

    const width = window.innerWidth;
    return this.getScreenSizeFromWidth(width);
  }

  /**
   * CSS省略スタイル生成
   * CSSのtext-overflowと組み合わせて使用
   * 
   * @param screenSize 画面サイズ
   * @returns CSS-in-JSオブジェクト
   */
  static getEllipsisStyles(screenSize: ScreenSize = 'desktop'): React.CSSProperties {
    const maxLength = this.getMaxLength(screenSize);
    
    return {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: `${maxLength}ch`, // chユニットで文字数ベースの幅指定
      display: 'inline-block'
    };
  }

  /**
   * 状態名の正規化処理
   * 前後の空白除去、連続空白の正規化
   */
  private static normalizeStatusName(name: string): string {
    if (typeof name !== 'string') {
      return '';
    }

    return name
      .trim()                              // 前後の空白除去
      .replace(/\s+/g, ' ')               // 連続空白を単一スペースに
      .replace(/[\u200B-\u200D\uFEFF]/g, ''); // 不可視文字除去
  }

  /**
   * 画面サイズに応じた最大文字数を取得
   */
  private static getMaxLength(screenSize: ScreenSize): number {
    switch (screenSize) {
      case 'mobile':
        return this.MOBILE_MAX_LENGTH;
      case 'tablet':
        return this.TABLET_MAX_LENGTH;
      case 'desktop':
      default:
        return this.DESKTOP_MAX_LENGTH;
    }
  }

  /**
   * Unicode対応の表示文字数計算
   * 絵文字や結合文字を考慮
   */
  private static getDisplayLength(text: string): number {
    // Intl.Segmenterが利用可能な場合は使用（より正確）
    if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
      try {
        const segmenter = new (Intl as any).Segmenter('ja', { granularity: 'grapheme' });
        return Array.from(segmenter.segment(text)).length;
      } catch (error) {
        // フォールバック処理
      }
    }

    // フォールバック：Array.fromによるUnicodeポイント分割
    return Array.from(text).length;
  }

  /**
   * テキストの省略処理
   * 最小表示文字数を保証
   */
  private static truncateText(text: string, maxLength: number): string {
    if (maxLength <= this.MIN_DISPLAY_LENGTH) {
      // 最大長が最小表示文字数以下の場合
      const chars = Array.from(text);
      return chars.slice(0, this.MIN_DISPLAY_LENGTH).join('') + this.ELLIPSIS;
    }

    // 省略記号の分を考慮して切り詰め
    const truncateLength = maxLength - this.ELLIPSIS.length;
    const chars = Array.from(text);
    
    if (chars.length <= truncateLength) {
      return text;
    }

    return chars.slice(0, truncateLength).join('') + this.ELLIPSIS;
  }

  /**
   * アクセシビリティ対応のaria-label生成
   * スクリーンリーダー用の完全な状態名を提供
   * 
   * @param displayText 表示テキスト
   * @param fullText 完全なテキスト
   * @returns aria-label文字列
   */
  static generateAriaLabel(displayText: string, fullText: string): string {
    if (displayText === fullText) {
      return fullText;
    }

    return `${displayText}、完全名：${fullText}`;
  }

  /**
   * ツールチップ用のタイトル属性生成
   * 
   * @param result 省略表示結果
   * @returns title属性値
   */
  static generateTooltipTitle(result: TruncatedDisplayResult): string | undefined {
    if (!result.shouldShowTooltip) {
      return undefined;
    }

    return result.fullText;
  }

  /**
   * デバッグ情報の取得
   * 開発時の省略動作確認用
   */
  static getDebugInfo(
    statusName: string, 
    screenSize: ScreenSize = 'desktop'
  ): {
    originalLength: number;
    displayLength: number;
    maxAllowed: number;
    screenSize: ScreenSize;
    wasTruncated: boolean;
  } {
    const cleanedName = this.normalizeStatusName(statusName);
    const displayLength = this.getDisplayLength(cleanedName);
    const maxAllowed = this.getMaxLength(screenSize);
    const wasTruncated = displayLength > maxAllowed;

    return {
      originalLength: this.getDisplayLength(statusName),
      displayLength,
      maxAllowed,
      screenSize,
      wasTruncated
    };
  }

  /**
   * 一括省略処理のパフォーマンス測定
   * 大量データ処理時の最適化用
   */
  static measureBatchPerformance(
    statusNames: string[], 
    screenSize: ScreenSize = 'desktop'
  ): {
    processedCount: number;
    processingTime: number;
    averageTime: number;
  } {
    const startTime = performance.now();
    
    const results = this.getTruncatedDisplayBatch(statusNames, screenSize);
    
    const endTime = performance.now();
    const processingTime = endTime - startTime;

    return {
      processedCount: results.length,
      processingTime,
      averageTime: processingTime / results.length
    };
  }
}
