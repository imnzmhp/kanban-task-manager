/**
 * ColorPalette システムのテスト
 * LAB色空間実装とWCAG AA準拠の確認
 */

import { ColorPalette } from '../../utils/ColorPalette';

describe('ColorPalette', () => {
  describe('色生成システム', () => {
    test('基本的な色生成が正常に動作する', () => {
      const colors = ColorPalette.generateStatusColors(5, 0);
      
      expect(colors).toBeDefined();
      expect(colors.backgroundColor).toBeDefined();
      expect(colors.accentColor).toBeDefined();
      expect(colors.contrastRatio).toBeDefined();
      
      // HEX形式の検証
      expect(ColorPalette.isValidHexColor(colors.backgroundColor)).toBe(true);
      expect(ColorPalette.isValidHexColor(colors.accentColor)).toBe(true);
    });

    test('WCAG AA準拠のコントラスト比を保証する', () => {
      const colors = ColorPalette.generateStatusColors(5, 0);
      
      // WCAG AA準拠の最小コントラスト比4.5:1を満たすこと
      expect(colors.contrastRatio).toBeGreaterThanOrEqual(4.5);
    });

    test('複数の状態に対して異なる色を生成する', () => {
      const statusCount = 6;
      const generatedColors = [];
      
      for (let i = 0; i < statusCount; i++) {
        const colors = ColorPalette.generateStatusColors(statusCount, i);
        generatedColors.push(colors);
      }
      
      // すべての背景色が異なることを確認
      const backgroundColors = generatedColors.map(c => c.backgroundColor);
      const uniqueBackgroundColors = new Set(backgroundColors);
      expect(uniqueBackgroundColors.size).toBe(statusCount);
      
      // すべてWCAG AA準拠であることを確認
      generatedColors.forEach(colors => {
        expect(colors.contrastRatio).toBeGreaterThanOrEqual(4.5);
      });
    });
  });

  describe('色変換・計算機能', () => {
    test('コントラスト比計算が正確に動作する', () => {
      // 既知の値でテスト
      const whiteBlackContrast = ColorPalette.calculateContrastRatio('#ffffff', '#000000');
      expect(whiteBlackContrast).toBeCloseTo(21, 0); // 理論的な最大コントラスト比
      
      const sameColorContrast = ColorPalette.calculateContrastRatio('#ff0000', '#ff0000');
      expect(sameColorContrast).toBeCloseTo(1, 1); // 同じ色は1:1
    });

    test('HEX色文字列の妥当性チェックが動作する', () => {
      expect(ColorPalette.isValidHexColor('#ffffff')).toBe(true);
      expect(ColorPalette.isValidHexColor('#fff')).toBe(true);
      expect(ColorPalette.isValidHexColor('#FF0000')).toBe(true);
      
      expect(ColorPalette.isValidHexColor('ffffff')).toBe(false);
      expect(ColorPalette.isValidHexColor('#gggggg')).toBe(false);
      expect(ColorPalette.isValidHexColor('#ff')).toBe(false);
      expect(ColorPalette.isValidHexColor('')).toBe(false);
    });

    test('色の明度計算が適切に動作する', () => {
      const whiteLightness = ColorPalette.getLightness('#ffffff');
      const blackLightness = ColorPalette.getLightness('#000000');
      
      expect(whiteLightness).toBeGreaterThan(blackLightness);
      expect(whiteLightness).toBeGreaterThan(90);
      expect(blackLightness).toBeLessThan(10);
    });
  });

  describe('プリセットとフォールバック', () => {
    test('プリセット色パレットが適切に定義されている', () => {
      const presets = ColorPalette.getPresetPalette();
      
      expect(presets).toHaveLength(6);
      presets.forEach(preset => {
        expect(ColorPalette.isValidHexColor(preset.backgroundColor)).toBe(true);
        expect(ColorPalette.isValidHexColor(preset.accentColor)).toBe(true);
        expect(preset.contrastRatio).toBeGreaterThanOrEqual(4.5);
      });
    });

    test('色情報のデバッグ機能が動作する', () => {
      const colorInfo = ColorPalette.getColorInfo('#3498db');
      
      expect(colorInfo.hex).toBe('#3498db');
      expect(colorInfo.rgb).toBeDefined();
      expect(colorInfo.rgb.r).toBeGreaterThanOrEqual(0);
      expect(colorInfo.rgb.r).toBeLessThanOrEqual(255);
      expect(colorInfo.luminance).toBeGreaterThanOrEqual(0);
      expect(colorInfo.luminance).toBeLessThanOrEqual(1);
      expect(colorInfo.lightness).toBeGreaterThanOrEqual(0);
      expect(colorInfo.lightness).toBeLessThanOrEqual(100);
    });
  });

  describe('エッジケース', () => {
    test('極端な状態数でも適切に動作する', () => {
      // 非常に少ない状態数
      const singleStatus = ColorPalette.generateStatusColors(1, 0);
      expect(singleStatus.contrastRatio).toBeGreaterThanOrEqual(4.5);
      
      // 多数の状態
      const manyStatuses = ColorPalette.generateStatusColors(20, 15);
      expect(manyStatuses.contrastRatio).toBeGreaterThanOrEqual(4.5);
    });

    test('位置が範囲外でも安全に処理する', () => {
      expect(() => {
        ColorPalette.generateStatusColors(5, 10); // 範囲外の位置
      }).not.toThrow();
      
      expect(() => {
        ColorPalette.generateStatusColors(5, -1); // 負の位置
      }).not.toThrow();
    });
  });
});