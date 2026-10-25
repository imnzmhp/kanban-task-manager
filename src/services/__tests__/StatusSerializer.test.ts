/**
 * StatusSerializer Tests
 * カスタムタスク状態管理システムのシリアライザーテスト
 */

import { StatusSerializer } from '../StatusSerializer';
import { CustomStatus } from '../../types/CustomStatus';

const mockStatuses: CustomStatus[] = [
  {
    id: '1',
    name: 'TODO',
    displayOrder: 0,
    createdAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: '2',
    name: 'IN PROGRESS',
    displayOrder: 1,
    createdAt: new Date('2023-01-02T00:00:00Z')
  },
  {
    id: '3',
    name: 'DONE',
    displayOrder: 2,
    createdAt: new Date('2023-01-03T00:00:00Z')
  }
];

describe('StatusSerializer', () => {
  describe('serialize', () => {
    it('should serialize valid statuses', () => {
      const result = StatusSerializer.serialize(mockStatuses);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.error).toBeUndefined();
      
      const parsed = JSON.parse(result.data!);
      expect(parsed).toHaveProperty('statuses');
      expect(parsed).toHaveProperty('metadata');
      expect(parsed.statuses).toHaveLength(3);
    });

    it('should reject empty status array', () => {
      const result = StatusSerializer.serialize([]);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('最低1つのステータスが必要です');
    });

    it('should reject duplicate IDs', () => {
      const duplicateStatuses = [
        mockStatuses[0],
        { ...mockStatuses[1], id: '1' }
      ];
      
      const result = StatusSerializer.serialize(duplicateStatuses);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('ステータスIDに重複があります');
    });

    it('should reject duplicate names', () => {
      const duplicateStatuses = [
        mockStatuses[0],
        { ...mockStatuses[1], name: 'TODO' }
      ];
      
      const result = StatusSerializer.serialize(duplicateStatuses);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('ステータス名に重複があります');
    });
  });

  describe('deserialize', () => {
    it('should deserialize valid JSON', () => {
      const serialized = StatusSerializer.serialize(mockStatuses);
      const result = StatusSerializer.deserialize(serialized.data!);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.statuses).toHaveLength(3);
    });

    it('should handle invalid JSON', () => {
      const result = StatusSerializer.deserialize('invalid json');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle invalid structure', () => {
      const invalidData = JSON.stringify({ invalid: 'structure' });
      const result = StatusSerializer.deserialize(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid serialized config structure');
    });
  });

  describe('testRoundTrip', () => {
    it('should pass round-trip test for valid statuses', () => {
      const result = StatusSerializer.testRoundTrip(mockStatuses);
      expect(result).toBe(true);
    });

    it('should fail round-trip test for invalid statuses', () => {
      const invalidStatuses = [
        { ...mockStatuses[0], id: '' }
      ];
      
      const result = StatusSerializer.testRoundTrip(invalidStatuses);
      expect(result).toBe(false);
    });
  });

  describe('getDefaultConfig', () => {
    it('should return default configuration', () => {
      const config = StatusSerializer.getDefaultConfig();
      
      expect(config).toHaveProperty('statuses');
      expect(config).toHaveProperty('metadata');
      expect(config.statuses.length).toBeGreaterThan(0);
      expect(config.metadata.version).toBe('2.0.0');
    });
  });

  describe('getSerializationInfo', () => {
    it('should return serialization information', () => {
      const info = StatusSerializer.getSerializationInfo(mockStatuses);
      
      expect(info).toHaveProperty('statusCount', 3);
      expect(info).toHaveProperty('estimatedSize');
      expect(info).toHaveProperty('version', '2.0.0');
      expect(info).toHaveProperty('isValid', true);
    });
  });
});
