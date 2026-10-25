/**
 * Unit Tests for ColorPalette Class
 * カスタムタスク状態管理システムの色パレットテスト
 */

import { ColorPalette } from '../ColorPalette';
import { StatusColor } from '../../types/CustomStatus';

describe('ColorPalette', () => {
  describe('generateStatusColors', () => {
    it('should generate colors with valid contrast ratio', () => {
      const result = ColorPalette.generateStatusColors(3, 0);
      
      expect(result).toHaveProperty('backgroundColor');
      expect(result).toHaveProperty('accentColor');
      expect(result).toHaveProperty('contrastRatio');
      expect(result.contrastRatio).toBeGreaterThanOrEqual(4.5);
    });

    it('should generate different colors for different positions', () => {
      const color1 = ColorPalette.generateStatusColors(3, 0);
      const color2 = ColorPalette.generateStatusColors(3, 1);
      
      expect(color1.backgroundColor).not.toBe(color2.backgroundColor);
      expect(color1.accentColor).not.toBe(color2.accentColor);
    });

    it('should maintain consistent colors for same position', () => {
      const color1 = ColorPalette.generateStatusColors(5, 2);
      const color2 = ColorPalette.generateStatusColors(5, 2);
      
      expect(color1).toEqual(color2);
    });

    it('should generate valid hex colors', () => {
      const result = ColorPalette.generateStatusColors(4, 1);
      
      expect(ColorPalette.isValidHexColor(result.backgroundColor)).toBe(true);
      expect(ColorPalette.isValidHexColor(result.accentColor)).toBe(true);
    });
  });

  describe('calculateContrastRatio', () => {
    it('should calculate correct contrast ratio for black on white', () => {
      const ratio = ColorPalette.calculateContrastRatio('#000000', '#ffffff');
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('should calculate correct contrast ratio for white on black', () => {
      const ratio = ColorPalette.calculateContrastRatio('#ffffff', '#000000');
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('should return 1 for same colors', () => {
      const ratio = ColorPalette.calculateContrastRatio('#808080', '#808080');
      expect(ratio).toBeCloseTo(1, 1);
    });

    it('should be symmetric (order independent)', () => {
      const ratio1 = ColorPalette.calculateContrastRatio('#ff0000', '#00ff00');
      const ratio2 = ColorPalette.calculateContrastRatio('#00ff00', '#ff0000');
      expect(ratio1).toBeCloseTo(ratio2, 2);
    });
  });

  describe('isValidHexColor', () => {
    it('should validate correct 6-digit hex colors', () => {
      expect(ColorPalette.isValidHexColor('#ff0000')).toBe(true);
      expect(ColorPalette.isValidHexColor('#00FF00')).toBe(true);
      expect(ColorPalette.isValidHexColor('#123abc')).toBe(true);
    });

    it('should validate correct 3-digit hex colors', () => {
      expect(ColorPalette.isValidHexColor('#f00')).toBe(true);
      expect(ColorPalette.isValidHexColor('#0F0')).toBe(true);
      expect(ColorPalette.isValidHexColor('#abc')).toBe(true);
    });

    it('should reject invalid hex colors', () => {
      expect(ColorPalette.isValidHexColor('ff0000')).toBe(false);  // Missing #
      expect(ColorPalette.isValidHexColor('#ff00')).toBe(false);   // Wrong length
      expect(ColorPalette.isValidHexColor('#gggggg')).toBe(false); // Invalid chars
      expect(ColorPalette.isValidHexColor('')).toBe(false);        // Empty string
    });
  });

  describe('getPresetPalette', () => {
    it('should return array of preset colors', () => {
      const palette = ColorPalette.getPresetPalette();
      
      expect(Array.isArray(palette)).toBe(true);
      expect(palette.length).toBeGreaterThan(0);
      
      palette.forEach(color => {
        expect(color).toHaveProperty('backgroundColor');
        expect(color).toHaveProperty('accentColor');
        expect(color).toHaveProperty('contrastRatio');
        expect(color.contrastRatio).toBeGreaterThanOrEqual(4.5);
      });
    });
  });

  describe('getLightness', () => {
    it('should return 0 for black', () => {
      expect(ColorPalette.getLightness('#000000')).toBeCloseTo(0, 1);
    });

    it('should return close to 100 for white', () => {
      expect(ColorPalette.getLightness('#ffffff')).toBeCloseTo(100, 0);
    });

    it('should return values between 0 and 100', () => {
      const colors = ['#ff0000', '#00ff00', '#0000ff', '#808080', '#c0c0c0'];
      
      colors.forEach(color => {
        const lightness = ColorPalette.getLightness(color);
        expect(lightness).toBeGreaterThanOrEqual(0);
        expect(lightness).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('getColorInfo', () => {
    it('should return complete color information', () => {
      const info = ColorPalette.getColorInfo('#ff6b35');
      
      expect(info).toHaveProperty('hex');
      expect(info).toHaveProperty('rgb');
      expect(info).toHaveProperty('luminance');
      expect(info).toHaveProperty('lightness');
      
      expect(info.hex).toBe('#ff6b35');
      expect(info.rgb).toHaveProperty('r');
      expect(info.rgb).toHaveProperty('g');
      expect(info.rgb).toHaveProperty('b');
      expect(typeof info.luminance).toBe('number');
      expect(typeof info.lightness).toBe('number');
    });
  });

  describe('WCAG AA compliance', () => {
    it('should generate colors meeting WCAG AA standards for multiple statuses', () => {
      const statusCounts = [3, 5, 7, 10];
      
      statusCounts.forEach(count => {
        for (let i = 0; i < count; i++) {
          const color = ColorPalette.generateStatusColors(count, i);
          expect(color.contrastRatio).toBeGreaterThanOrEqual(4.5);
        }
      });
    });
  });

  describe('color consistency', () => {
    it('should generate consistent colors regardless of total status count for same position', () => {
      // Same position (0) should generate similar hues regardless of total count
      const color3 = ColorPalette.generateStatusColors(3, 0);
      const color5 = ColorPalette.generateStatusColors(5, 0);
      const color7 = ColorPalette.generateStatusColors(7, 0);
      
      // All should be valid colors
      expect(ColorPalette.isValidHexColor(color3.backgroundColor)).toBe(true);
      expect(ColorPalette.isValidHexColor(color5.backgroundColor)).toBe(true);
      expect(ColorPalette.isValidHexColor(color7.backgroundColor)).toBe(true);
      
      // All should meet contrast requirements
      expect(color3.contrastRatio).toBeGreaterThanOrEqual(4.5);
      expect(color5.contrastRatio).toBeGreaterThanOrEqual(4.5);
      expect(color7.contrastRatio).toBeGreaterThanOrEqual(4.5);
    });
  });
});