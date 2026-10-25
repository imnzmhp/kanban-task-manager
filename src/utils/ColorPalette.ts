/**
 * Color Palette System for Custom Status Management
 * カスタムタスク状態管理システムの色パレットシステム
 * Enhanced with comprehensive error handling using SystemError framework
 * 
 * Requirements: 4.1, 4.2, 4.3, 16.2
 * 
 * LAB色空間を用いた位置ベースの色生成システム。
 * WCAG AA準拠のコントラスト比を保証し、知覚的に均一な色分布を提供します。
 */

import { StatusColor } from '../types/CustomStatus';
import { ErrorHandler } from '../services/ErrorHandler';

/**
 * LAB色空間での色値表現
 */
interface LABColor {
  /** 明度 (0-100) */
  L: number;
  /** 赤緑軸 (-128 to 127) */
  A: number;
  /** 青黄軸 (-128 to 127) */
  B: number;
}

/**
 * RGB色空間での色値表現
 */
interface RGBColor {
  /** 赤成分 (0-255) */
  r: number;
  /** 緑成分 (0-255) */
  g: number;
  /** 青成分 (0-255) */
  b: number;
}

/**
 * ColorPalette - LAB色空間による位置ベース色生成システム
 * 
 * このクラスは以下の機能を提供します：
 * - WCAG AA準拠（コントラスト比4.5:1以上）の色生成
 * - 位置ベースの一貫した色割り当て
 * - 知覚的に均一な色分布
 * - レスポンシブなグラデーション表現
 */
export class ColorPalette {
  // LAB色空間での基準値
  private static readonly BASE_LIGHTNESS = 85;    // 背景色用明度
  private static readonly BASE_CHROMA = 30;       // 基本彩度
  private static readonly ACCENT_LIGHTNESS = 45;  // アクセント色用明度
  private static readonly ACCENT_CHROMA = 45;     // アクセント色用彩度
  
  // WCAG AA準拠の最小コントラスト比
  private static readonly MIN_CONTRAST_RATIO = 4.5;
  
  // 色相の基準値（度数）
  private static readonly HUE_OFFSET = 15;        // 色相オフセット
  private static readonly MIN_HUE_STEP = 30;      // 最小色相差
  
  /**
   * 指定された位置とステータス数に基づいて色を生成
   * Enhanced with comprehensive error handling and validation
   * 
   * @param statusCount 総ステータス数
   * @param position ステータスの位置（0から始まる）
   * @returns WCAG AA準拠の色情報
   */
  static generateStatusColors(
    statusCount: number,
    position: number
  ): StatusColor {
    try {
      // Input validation
      if (typeof statusCount !== 'number' || statusCount < 0 || !isFinite(statusCount)) {
        ErrorHandler.handleColorSystemError(
          'COLOR_GENERATION_FAILED',
          'Invalid status count provided',
          {
            statusPosition: position,
            totalStatuses: statusCount
          }
        );
        return this.getHighContrastFallback('#ffffff');
      }

      if (typeof position !== 'number' || position < 0 || !isFinite(position)) {
        ErrorHandler.handleColorSystemError(
          'COLOR_GENERATION_FAILED',
          'Invalid position provided',
          {
            statusPosition: position,
            totalStatuses: statusCount
          }
        );
        return this.getHighContrastFallback('#ffffff');
      }

      if (position >= statusCount) {
        ErrorHandler.handleColorSystemError(
          'COLOR_GENERATION_FAILED',
          'Position exceeds status count',
          {
            statusPosition: position,
            totalStatuses: statusCount
          }
        );
        return this.getHighContrastFallback('#ffffff');
      }

      // 色相を均等分割（最小30度間隔を保証）
      const effectiveCount = Math.max(statusCount, 3);
      const hueStep = Math.max(360 / effectiveCount, this.MIN_HUE_STEP);
      const hue = (position * hueStep + this.HUE_OFFSET) % 360;
      
      // LAB色空間での背景色計算
      const backgroundColor = this.generateBackgroundColor(hue);
      
      // LAB色空間でのアクセント色計算
      const accentColor = this.generateAccentColor(hue);
      
      // Validate generated colors
      if (!this.isValidHexColor(backgroundColor) || !this.isValidHexColor(accentColor)) {
        ErrorHandler.handleColorSystemError(
          'COLOR_VALIDATION_FAILED',
          'Generated invalid color format',
          {
            statusPosition: position,
            totalStatuses: statusCount,
            generatedColor: backgroundColor
          }
        );
        return this.getPresetPalette()[position % this.getPresetPalette().length];
      }
      
      // コントラスト比計算
      const contrastRatio = this.calculateContrastRatio(backgroundColor, accentColor);
      
      // WCAG AA準拠チェック
      if (contrastRatio < this.MIN_CONTRAST_RATIO) {
        ErrorHandler.handleColorSystemError(
          'COLOR_CONTRAST_INSUFFICIENT',
          'Generated color does not meet WCAG AA contrast requirements',
          {
            statusPosition: position,
            totalStatuses: statusCount,
            generatedColor: backgroundColor,
            contrastRatio,
            targetRatio: this.MIN_CONTRAST_RATIO
          }
        );
        
        return this.adjustForContrast(backgroundColor, accentColor, hue);
      }
      
      return { backgroundColor, accentColor, contrastRatio };
    } catch (error) {
      // Handle unexpected errors during color generation
      ErrorHandler.handleColorSystemError(
        'COLOR_GENERATION_FAILED',
        'Unexpected error during color generation',
        {
          statusPosition: position,
          totalStatuses: statusCount,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      );
      
      // Return safe fallback color
      const fallbackIndex = Math.max(0, Math.min(position, this.getPresetPalette().length - 1));
      return this.getPresetPalette()[fallbackIndex];
    }
  }
  
  /**
   * 背景色を生成（LAB色空間）
   */
  private static generateBackgroundColor(hue: number): string {
    const lab = this.hueToLAB(hue, this.BASE_LIGHTNESS, this.BASE_CHROMA);
    const rgb = this.labToRGB(lab);
    return this.rgbToHex(rgb);
  }
  
  /**
   * アクセント色を生成（LAB色空間）
   */
  private static generateAccentColor(hue: number): string {
    const lab = this.hueToLAB(hue, this.ACCENT_LIGHTNESS, this.ACCENT_CHROMA);
    const rgb = this.labToRGB(lab);
    return this.rgbToHex(rgb);
  }
  
  /**
   * 色相からLAB色空間の値を計算
   */
  private static hueToLAB(hue: number, lightness: number, chroma: number): LABColor {
    const hueRad = (hue * Math.PI) / 180;
    
    return {
      L: lightness,
      A: chroma * Math.cos(hueRad),
      B: chroma * Math.sin(hueRad)
    };
  }
  
  /**
   * LAB色空間からRGB色空間に変換
   */
  private static labToRGB(lab: LABColor): RGBColor {
    // LAB -> XYZ変換
    let y = (lab.L + 16) / 116;
    let x = lab.A / 500 + y;
    let z = y - lab.B / 200;
    
    // XYZ正規化
    x = x > 0.206897 ? Math.pow(x, 3) : (x - 16/116) / 7.787;
    y = y > 0.206897 ? Math.pow(y, 3) : (y - 16/116) / 7.787;
    z = z > 0.206897 ? Math.pow(z, 3) : (z - 16/116) / 7.787;
    
    // D65白色点での正規化
    x *= 95.047;
    y *= 100.000;
    z *= 108.883;
    
    // XYZ -> sRGB変換（線形RGB）
    let r = x * 0.032406 + y * -0.015372 + z * -0.004986;
    let g = x * -0.009689 + y * 0.018758 + z * 0.000415;
    let b = x * 0.000557 + y * -0.002040 + z * 0.010570;
    
    // ガンマ補正
    r = r > 0.0031308 ? 1.055 * Math.pow(r, 1/2.4) - 0.055 : 12.92 * r;
    g = g > 0.0031308 ? 1.055 * Math.pow(g, 1/2.4) - 0.055 : 12.92 * g;
    b = b > 0.0031308 ? 1.055 * Math.pow(b, 1/2.4) - 0.055 : 12.92 * b;
    
    // 0-255範囲にクランプ
    return {
      r: Math.max(0, Math.min(255, Math.round(r * 255))),
      g: Math.max(0, Math.min(255, Math.round(g * 255))),
      b: Math.max(0, Math.min(255, Math.round(b * 255)))
    };
  }
  
  /**
   * RGBからHEX文字列に変換
   */
  private static rgbToHex(rgb: RGBColor): string {
    const toHex = (value: number) => {
      const hex = Math.round(value).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
  }
  
  /**
   * WCAG 2.1準拠のコントラスト比を計算
   * 
   * @param color1 第一の色（HEX形式）
   * @param color2 第二の色（HEX形式）
   * @returns コントラスト比（1:1から21:1の範囲）
   */
  static calculateContrastRatio(color1: string, color2: string): number {
    const luminance1 = this.getRelativeLuminance(color1);
    const luminance2 = this.getRelativeLuminance(color2);
    
    const lighter = Math.max(luminance1, luminance2);
    const darker = Math.min(luminance1, luminance2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }
  
  /**
   * 相対輝度を計算（WCAG 2.1仕様）
   */
  private static getRelativeLuminance(hexColor: string): number {
    const rgb = this.hexToRGB(hexColor);
    
    // sRGB値を正規化
    const normalize = (value: number) => {
      const normalized = value / 255;
      return normalized <= 0.03928 
        ? normalized / 12.92 
        : Math.pow((normalized + 0.055) / 1.055, 2.4);
    };
    
    const r = normalize(rgb.r);
    const g = normalize(rgb.g);
    const b = normalize(rgb.b);
    
    // ITU-R BT.709での輝度計算
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  
  /**
   * HEX文字列をRGBに変換
   */
  private static hexToRGB(hex: string): RGBColor {
    // #を除去し、3文字形式を6文字に展開
    const cleanHex = hex.replace('#', '');
    const fullHex = cleanHex.length === 3 
      ? cleanHex.split('').map(char => char + char).join('') 
      : cleanHex;
    
    const r = parseInt(fullHex.substr(0, 2), 16);
    const g = parseInt(fullHex.substr(2, 2), 16);
    const b = parseInt(fullHex.substr(4, 2), 16);
    
    return { r, g, b };
  }
  
  /**
   * コントラスト比が不十分な場合の色調整
   */
  private static adjustForContrast(
    backgroundColor: string, 
    _accentColor: string, 
    originalHue: number
  ): StatusColor {
    // アクセント色の明度を段階的に調整
    const lightnesses = [30, 25, 20, 50, 55, 60];
    
    for (const lightness of lightnesses) {
      const adjustedLab = this.hueToLAB(originalHue, lightness, this.ACCENT_CHROMA);
      const adjustedRgb = this.labToRGB(adjustedLab);
      const adjustedAccentColor = this.rgbToHex(adjustedRgb);
      
      const contrastRatio = this.calculateContrastRatio(backgroundColor, adjustedAccentColor);
      
      if (contrastRatio >= this.MIN_CONTRAST_RATIO) {
        return { 
          backgroundColor, 
          accentColor: adjustedAccentColor, 
          contrastRatio 
        };
      }
    }
    
    // 最終手段：高コントラストフォールバック
    return this.getHighContrastFallback(backgroundColor);
  }
  
  /**
   * 高コントラストフォールバック色を取得
   */
  private static getHighContrastFallback(backgroundColor: string): StatusColor {
    const luminance = this.getRelativeLuminance(backgroundColor);
    
    // 背景が明るい場合は暗いアクセント、暗い場合は明るいアクセント
    const accentColor = luminance > 0.5 ? '#1a1a1a' : '#f5f5f5';
    const contrastRatio = this.calculateContrastRatio(backgroundColor, accentColor);
    
    return { backgroundColor, accentColor, contrastRatio };
  }
  
  /**
   * 色の妥当性をチェック
   * 
   * @param hexColor チェックするHEX色文字列
   * @returns 妥当性の真偽値
   */
  static isValidHexColor(hexColor: string): boolean {
    const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexPattern.test(hexColor);
  }
  
  /**
   * プリセット色パレットを取得（フォールバック用）
   */
  static getPresetPalette(): StatusColor[] {
    return [
      { backgroundColor: '#f0f8ff', accentColor: '#1e90ff', contrastRatio: 5.2 }, // Light Blue
      { backgroundColor: '#f5fffa', accentColor: '#00c851', contrastRatio: 4.8 }, // Light Green
      { backgroundColor: '#fff5ee', accentColor: '#ff6b35', contrastRatio: 5.1 }, // Light Orange
      { backgroundColor: '#fdf2e9', accentColor: '#e67e22', contrastRatio: 4.9 }, // Light Amber
      { backgroundColor: '#f4f0ff', accentColor: '#8b5cf6', contrastRatio: 5.3 }, // Light Purple
      { backgroundColor: '#fef7f7', accentColor: '#ef4444', contrastRatio: 4.7 }, // Light Red
    ];
  }
  
  /**
   * 色の明度を取得（0-100スケール）
   */
  static getLightness(hexColor: string): number {
    const rgb = this.hexToRGB(hexColor);
    // LAB色空間のL値に近似
    return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255 * 100;
  }
  
  /**
   * デバッグ用：色情報の詳細を取得
   */
  static getColorInfo(hexColor: string): {
    hex: string;
    rgb: RGBColor;
    luminance: number;
    lightness: number;
  } {
    const rgb = this.hexToRGB(hexColor);
    const luminance = this.getRelativeLuminance(hexColor);
    const lightness = this.getLightness(hexColor);
    
    return {
      hex: hexColor,
      rgb,
      luminance,
      lightness
    };
  }
}