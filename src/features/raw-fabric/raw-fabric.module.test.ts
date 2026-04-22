import { describe, expect, it, vi } from 'vitest';

vi.mock('@/core/registry/moduleRegistry', () => ({
  createModule: vi.fn((config) => config),
}));

import {
  bulkInputDefaults,
  bulkInputSchema,
  findDuplicateRollNumbers,
  formatBulkRollNumber,
  rawFabricSchema,
  rawFabricDefaults,
} from '@/features/raw-fabric/raw-fabric.module';
import {
  rawFabricFeature,
  rawFabricPlugin,
} from '@/features/raw-fabric/raw-fabric.module';

describe('raw-fabric.module', () => {
  describe('Feature & Plugin Definitions', () => {
    it('exports rawFabricFeature configuration correctly', () => {
      expect(rawFabricFeature.key).toBe('raw-fabric');
      expect(rawFabricFeature.route).toBe('/raw-fabric');
      expect(rawFabricFeature.entities).toContain('raw_fabric_rolls');
    });

    it('exports rawFabricPlugin configuration correctly', () => {
      expect(rawFabricPlugin.key).toBe('raw-fabric');
      expect(rawFabricPlugin.route).toBe('raw-fabric');
      expect(rawFabricPlugin.requiredRoles).toContain('admin');
    });
  });

  describe('bulkInputSchema & utilities', () => {
    it('formats auto roll numbers from trimmed prefix and sequence', () => {
      expect(formatBulkRollNumber(' RM- ', 7)).toBe('RM-007');
    });

    it('detects duplicate roll numbers within a bulk batch', () => {
      const duplicates = findDuplicateRollNumbers([
        { roll_number: ' RM-001 ' },
        { roll_number: 'RM-002' },
        { roll_number: 'RM-001' },
      ]);

      expect(duplicates).toEqual(['RM-001']);
    });

    it('accepts valid bulk input and trims shared fields', () => {
      const result = bulkInputSchema.parse({
        ...bulkInputDefaults,
        fabric_type: '  Dệt thoi 60/40 TC  ',
        roll_prefix: ' RM- ',
        start_number: '5',
        warehouse_location: ' A1-R3-S2 ',
        rolls: [
          {
            roll_number: ' RM-005 ',
            weight_kg: '25.5',
            length_m: '52.2',
            quality_grade: 'A',
            notes: '  Cuộn đầu  ',
          },
          {
            roll_number: 'RM-006',
            weight_kg: '24.8',
            length_m: '',
            notes: '',
          },
        ],
      });

      expect(result.fabric_type).toBe('Dệt thoi 60/40 TC');
      expect(result.roll_prefix).toBe('RM-');
      expect(result.start_number).toBe(5);
      expect(result.warehouse_location).toBe('A1-R3-S2');
      expect(result.rolls[0]!.roll_number).toBe('RM-005');
      expect(result.rolls[0]!.weight_kg).toBe(25.5);
      expect(result.rolls[0]!.notes).toBe('Cuộn đầu');
      expect(result.rolls[1]!.length_m).toBeUndefined();
    });

    it('rejects duplicate roll numbers inside bulk input', () => {
      const result = bulkInputSchema.safeParse({
        ...bulkInputDefaults,
        fabric_type: 'Dệt thoi 60/40 TC',
        rolls: [
          {
            roll_number: 'RM-001',
            weight_kg: 25.5,
            notes: '',
          },
          {
            roll_number: ' RM-001 ',
            weight_kg: 26.1,
            notes: '',
          },
        ],
      });

      expect(result.success).toBe(false);
      if (result.success) {
        throw new Error(
          'Expected bulkInputSchema to reject duplicate roll numbers',
        );
      }

      expect(
        result.error.issues.some(
          (issue) => issue.path.join('.') === 'rolls.0.roll_number',
        ),
      ).toBe(true);
      expect(
        result.error.issues.some(
          (issue) => issue.path.join('.') === 'rolls.1.roll_number',
        ),
      ).toBe(true);
    });

    it('keeps stable defaults for bulk input', () => {
      expect(bulkInputDefaults.status).toBe('in_stock');
      expect(bulkInputDefaults.roll_prefix).toBe('RM-');
      expect(bulkInputDefaults.rolls[0]!.roll_number).toBe('RM-001');
    });
  });

  describe('rawFabricSchema', () => {
    it('accepts valid raw fabric input with all required fields', () => {
      const validData = {
        ...rawFabricDefaults,
        roll_number: 'RM-100',
        fabric_type: 'Cotton 100%',
        weight_kg: 25.5,
      };
      const result = rawFabricSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects input missing required roll_number or fabric_type', () => {
      const invalidData = {
        ...rawFabricDefaults,
        roll_number: ' ',
        fabric_type: '',
      };
      const result = rawFabricSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((i) => i.path.includes('roll_number')),
        ).toBe(true);
        expect(
          result.error.issues.some((i) => i.path.includes('fabric_type')),
        ).toBe(true);
      }
    });

    it('coerces empty string or null to undefined for numeric fields', () => {
      const dataWithEmptyNumbers = {
        ...rawFabricDefaults,
        roll_number: 'RM-101',
        fabric_type: 'Poly',
        width_cm: '',
        length_m: null,
        weight_kg: undefined,
      };
      const result = rawFabricSchema.parse(dataWithEmptyNumbers);
      expect(result.width_cm).toBeUndefined();
      expect(result.length_m).toBeUndefined();
      expect(result.weight_kg).toBeUndefined();
    });

    it('allows empty string for optional UUID fields', () => {
      const dataWithEmptyUUIDs = {
        ...rawFabricDefaults,
        roll_number: 'RM-102',
        fabric_type: 'Silk',
        yarn_receipt_id: '',
        work_order_id: '',
        weaving_partner_id: '',
      };
      const result = rawFabricSchema.parse(dataWithEmptyUUIDs);
      expect(result.yarn_receipt_id).toBe('');
      expect(result.work_order_id).toBe('');
      expect(result.weaving_partner_id).toBe('');
    });

    it('accepts valid UUID strings for optional UUID fields', () => {
      const dataWithValidUUIDs = {
        ...rawFabricDefaults,
        roll_number: 'RM-103',
        fabric_type: 'Linen',
        yarn_receipt_id: '123e4567-e89b-12d3-a456-426614174000',
      };
      const result = rawFabricSchema.safeParse(dataWithValidUUIDs);
      expect(result.success).toBe(true);
    });
  });
});
