import { describe, expect, it } from 'vitest';

import type { FabricRollPackingItem } from '@/domain/inventory/packing-list.types';
import {
  buildPackingMatrixGroups,
  buildPackingMatrixRows,
} from '@/domain/inventory/packing-list.utils';

function createMockRolls(
  count: number,
  baseWeight = 25.0,
  overrides?: Partial<FabricRollPackingItem>,
): FabricRollPackingItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `roll-${i + 1}`,
    roll_code: `VP-TEST-${String(i + 1).padStart(3, '0')}`,
    roll_sequence: i + 1,
    weight_kg: Number((baseWeight + (i % 5) * 0.2).toFixed(1)),
    color_name: 'Xanh Navy',
    fabric_type: 'Cotton 100% 4C',
    lot_number: 'L2026',
    grade: i % 10 === 0 ? 'grade_b' : 'grade_a',
    checked: i % 2 === 0,
    ...overrides,
  }));
}

describe('packing-matrix.utils', () => {
  describe('buildPackingMatrixRows', () => {
    it('returns empty array when rolls is empty or undefined', () => {
      expect(buildPackingMatrixRows([])).toEqual([]);
      // @ts-expect-error test undefined input
      expect(buildPackingMatrixRows(undefined)).toEqual([]);
    });

    it('builds single row correctly when rolls count is less than 10', () => {
      const rolls = createMockRolls(3, 20.0); // 20.0, 20.2, 20.4
      const rows = buildPackingMatrixRows(rolls, 10);

      expect(rows).toHaveLength(1);
      const row = rows[0]!;
      expect(row.row_index).toBe(0);
      expect(row.range_label).toBe('01 - 03');
      expect(row.roll_count).toBe(3);
      expect(row.subtotal_weight_kg).toBe(60.6);

      // Exactly 10 cells in row
      expect(row.cells).toHaveLength(10);
      expect(row.cells[0]?.weight_kg).toBe(20.0);
      expect(row.cells[0]?.roll_code).toBe('VP-TEST-001');
      expect(row.cells[1]?.weight_kg).toBe(20.2);
      expect(row.cells[2]?.weight_kg).toBe(20.4);

      // Remaining cells must be empty slots
      expect(row.cells[3]?.weight_kg).toBeUndefined();
      expect(row.cells[3]?.roll).toBeUndefined();
      expect(row.cells[9]?.weight_kg).toBeUndefined();
    });

    it('builds exactly 1 full row for 10 rolls', () => {
      const rolls = createMockRolls(10, 25.0);
      const rows = buildPackingMatrixRows(rolls, 10);

      expect(rows).toHaveLength(1);
      const row = rows[0]!;
      expect(row.range_label).toBe('01 - 10');
      expect(row.roll_count).toBe(10);
      expect(row.cells).toHaveLength(10);
      expect(row.cells.every((c) => c.weight_kg !== undefined)).toBe(true);
    });

    it('builds multiple rows with correct labels and subtotals for 25 rolls', () => {
      const rolls = createMockRolls(25, 24.0);
      const rows = buildPackingMatrixRows(rolls, 10);

      expect(rows).toHaveLength(3);

      expect(rows[0]?.range_label).toBe('01 - 10');
      expect(rows[0]?.roll_count).toBe(10);

      expect(rows[1]?.range_label).toBe('11 - 20');
      expect(rows[1]?.roll_count).toBe(10);

      expect(rows[2]?.range_label).toBe('21 - 25');
      expect(rows[2]?.roll_count).toBe(5);
      expect(rows[2]?.cells[4]?.weight_kg).toBeDefined();
      expect(rows[2]?.cells[5]?.weight_kg).toBeUndefined();

      // Total sum of all subtotals matches sum of all roll weights
      const totalFromRows = rows.reduce(
        (sum, r) => sum + r.subtotal_weight_kg,
        0,
      );
      const directTotal = rolls.reduce((sum, r) => sum + r.weight_kg, 0);
      expect(Math.round(totalFromRows * 10) / 10).toBe(
        Math.round(directTotal * 10) / 10,
      );
    });

    it('handles 100 rolls cleanly in exactly 10 rows (A5 Landscape benchmark)', () => {
      const rolls = createMockRolls(100, 25.0);
      const rows = buildPackingMatrixRows(rolls, 10);

      expect(rows).toHaveLength(10);
      expect(rows[0]?.range_label).toBe('01 - 10');
      expect(rows[9]?.range_label).toBe('91 - 100');
      expect(rows.every((r) => r.roll_count === 10)).toBe(true);
      expect(rows.every((r) => r.cells.length === 10)).toBe(true);
    });

    it('preserves floating point precision for decimal weights', () => {
      const rolls: FabricRollPackingItem[] = [
        {
          id: '1',
          roll_code: 'R1',
          roll_sequence: 1,
          weight_kg: 25.1,
        },
        {
          id: '2',
          roll_code: 'R2',
          roll_sequence: 2,
          weight_kg: 25.2,
        },
        {
          id: '3',
          roll_code: 'R3',
          roll_sequence: 3,
          weight_kg: 25.3,
        },
      ];
      const rows = buildPackingMatrixRows(rolls, 10);
      // 25.1 + 25.2 + 25.3 = 75.6 (no 75.60000000000001)
      expect(rows[0]?.subtotal_weight_kg).toBe(75.6);
    });
  });

  describe('buildPackingMatrixGroups', () => {
    it('groups by color and lot correctly and builds matrix rows for each group', () => {
      const rollsNavy = createMockRolls(15, 25.0, {
        color_name: 'Xanh Navy',
        lot_number: 'L01',
      });
      const rollsRed = createMockRolls(8, 22.0, {
        color_name: 'Đỏ Đô',
        lot_number: 'L02',
      });
      const allRolls = [...rollsNavy, ...rollsRed];

      const groups = buildPackingMatrixGroups(allRolls, 10);
      expect(groups).toHaveLength(2);

      const navyGroup = groups.find((g) => g.color_name === 'Xanh Navy');
      expect(navyGroup).toBeDefined();
      expect(navyGroup?.total_rolls).toBe(15);
      expect(navyGroup?.rows).toHaveLength(2); // 10 and 5
      expect(navyGroup?.rows[0]?.range_label).toBe('01 - 10');
      expect(navyGroup?.rows[1]?.range_label).toBe('11 - 15');

      const redGroup = groups.find((g) => g.color_name === 'Đỏ Đô');
      expect(redGroup).toBeDefined();
      expect(redGroup?.total_rolls).toBe(8);
      expect(redGroup?.rows).toHaveLength(1);
      expect(redGroup?.rows[0]?.range_label).toBe('01 - 08');
    });
  });
});
