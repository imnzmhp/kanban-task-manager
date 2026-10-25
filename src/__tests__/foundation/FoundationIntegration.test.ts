/**
 * 基盤コンポーネント統合テスト（簡易版）
 * CustomStatus、ColorPalette、StatusValidator の連携動作確認
 */

import { CustomStatus, StatusColor } from '../../types/CustomStatus';
import { ColorPalette } from '../../utils/ColorPalette';
import { StatusValidator } from '../../utils/StatusValidator';

describe('基盤コンポーネント統合テスト', () => {
  describe('CustomStatus + ColorPalette 統合', () => {
    test('状態数と位置に基づく色生成統合', () => {
      const statuses: CustomStatus[] = [
        { id: '1', name: 'To Do', displayOrder: 0, createdAt: new Date() },
        { id: '2', name: 'In Progress', displayOrder: 1, createdAt: new Date() },
        { id: '3', name: 'Review', displayOrder: 2, createdAt: new Date() },
        { id: '4', name: 'Done', displayOrder: 3, createdAt: new Date() }
      ];

      // 各状態に色を割り当て
      const statusColors = new Map<string, StatusColor>();
      
      statuses.forEach(status => {
        const colors = ColorPalette.generateStatusColors(statuses.length, status.displayOrder);
        statusColors.set(status.id, colors);
        
        // WCAG AA準拠の確認
        expect(colors.contrastRatio).toBeGreaterThanOrEqual(4.5);
        
        // HEX形式の確認
        expect(ColorPalette.isValidHexColor(colors.backgroundColor)).toBe(true);
        expect(ColorPalette.isValidHexColor(colors.accentColor)).toBe(true);
      });
      
      // 全ての状態に色が割り当てられたことを確認
      expect(statusColors.size).toBe(statuses.length);
      
      // 全ての背景色が異なることを確認
      const backgroundColors = Array.from(statusColors.values()).map(c => c.backgroundColor);
      const uniqueBackgrounds = new Set(backgroundColors);
      expect(uniqueBackgrounds.size).toBe(backgroundColors.length);
    });
  });

  describe('CustomStatus + StatusValidator 統合', () => {
    test('CustomStatus作成時のバリデーション統合', () => {
      const existingStatuses: CustomStatus[] = [
        {
          id: '1',
          name: 'Existing Status',
          displayOrder: 0,
          createdAt: new Date()
        }
      ];

      // 有効な新しい状態
      const validName = 'New Valid Status';
      const validation = StatusValidator.validateStatusName(validName, existingStatuses);
      
      expect(validation.isValid).toBe(true);
      
      if (validation.isValid) {
        const newStatus: CustomStatus = {
          id: 'new-id',
          name: StatusValidator.formatStatusName(validName),
          displayOrder: existingStatuses.length,
          createdAt: new Date()
        };
        
        expect(newStatus.name).toBe('New Valid Status');
        expect(newStatus.displayOrder).toBe(1);
      }
    });
  });

  describe('エンドツーエンドワークフロー', () => {
    test('新規状態作成の完全なワークフロー', () => {
      // 1. 既存状態のセットアップ
      const existingStatuses: CustomStatus[] = [
        { id: '1', name: 'To Do', displayOrder: 0, createdAt: new Date() },
        { id: '2', name: 'In Progress', displayOrder: 1, createdAt: new Date() }
      ];

      // 2. 新しい状態名の検証
      const newStatusName = '  Testing Phase  ';
      const validation = StatusValidator.validateStatusName(newStatusName, existingStatuses);
      
      expect(validation.isValid).toBe(true);
      
      // 3. 名前の正規化とフォーマット
      const formattedName = StatusValidator.formatStatusName(newStatusName);
      expect(formattedName).toBe('Testing Phase');
      
      // 4. 新しい状態の作成
      const newStatus: CustomStatus = {
        id: 'new-status-id',
        name: formattedName,
        displayOrder: existingStatuses.length,
        createdAt: new Date()
      };
      
      // 5. 状態配列の更新
      const updatedStatuses = [...existingStatuses, newStatus];
      
      // 6. 各状態に色を生成
      const colorsMap = new Map<string, StatusColor>();
      updatedStatuses.forEach(status => {
        const colors = ColorPalette.generateStatusColors(
          updatedStatuses.length, 
          status.displayOrder
        );
        colorsMap.set(status.id, colors);
      });
      
      // 7. 結果の検証
      expect(updatedStatuses).toHaveLength(3);
      expect(colorsMap.size).toBe(3);
      
      // 全ての色がWCAG AA準拠
      Array.from(colorsMap.values()).forEach(colors => {
        expect(colors.contrastRatio).toBeGreaterThanOrEqual(4.5);
      });
      
      // 全ての背景色が異なる
      const backgrounds = Array.from(colorsMap.values()).map(c => c.backgroundColor);
      const uniqueBackgrounds = new Set(backgrounds);
      expect(uniqueBackgrounds.size).toBe(backgrounds.length);
    });
  });
});