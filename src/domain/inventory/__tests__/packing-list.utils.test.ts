import { describe, expect, it } from 'vitest';

import type { FabricRollPackingItem } from '@/domain/inventory/packing-list.types';
import {
  calculatePackingSummary,
  exportPackingListToCsvContent,
  filterPackingRolls,
  formatPackingListForExport,
  groupRollsByColorAndBatch,
  normalizeGrade,
  processRollCheckoff,
  roundWeight,
} from '@/domain/inventory/packing-list.utils';

const mockRolls: FabricRollPackingItem[] = [
  {
    id: 'roll-1',
    roll_code: 'VP-MT-01',
    roll_sequence: 1,
    weight_kg: 22.8,
    fabric_type: 'Vảy cá cào',
    color_name: 'Muối Tiêu',
    lot_number: 'L01',
    width_inch: 68,
    length_meters: 50.2,
    grade: 'grade_a',
    checked: true,
  },
  {
    id: 'roll-2',
    roll_code: 'VP-MT-02',
    roll_sequence: 2,
    weight_kg: 24.2,
    fabric_type: 'Vảy cá cào',
    color_name: 'Muối Tiêu',
    lot_number: 'L01',
    width_inch: 68,
    length_meters: 53.0,
    grade: 'grade_a',
    checked: false,
  },
  {
    id: 'roll-3',
    roll_code: 'VP-XD-01',
    roll_sequence: 3,
    weight_kg: 20.5,
    fabric_type: 'Vảy cá cào',
    color_name: 'Xanh Đen',
    lot_number: 'L02',
    width_inch: 68,
    length_meters: 45.1,
    grade: 'grade_b',
    checked: false,
  },
];

describe('packing-list.utils', () => {
  describe('normalizeGrade', () => {
    it('normalizes various grade inputs correctly', () => {
      expect(normalizeGrade('grade_a')).toBe('A');
      expect(normalizeGrade('GRADE_A')).toBe('A');
      expect(normalizeGrade('A')).toBe('A');
      expect(normalizeGrade('grade_b')).toBe('B');
      expect(normalizeGrade('B')).toBe('B');
      expect(normalizeGrade('grade_c')).toBe('C');
      expect(normalizeGrade('reject')).toBe('Khác');
      expect(normalizeGrade(undefined)).toBe('Khác');
    });
  });

  describe('roundWeight', () => {
    it('handles rounding to 1 decimal place with boundary protection', () => {
      expect(roundWeight(23.456)).toBe(23.5);
      expect(roundWeight(22.8)).toBe(22.8);
      expect(roundWeight(0)).toBe(0);
      expect(roundWeight(-5)).toBe(0);
      expect(roundWeight(NaN)).toBe(0);
    });
  });

  describe('calculatePackingSummary', () => {
    it('returns zeroes safely for empty array', () => {
      const summary = calculatePackingSummary([]);
      expect(summary.total_rolls).toBe(0);
      expect(summary.total_weight_kg).toBe(0);
      expect(summary.average_weight_kg).toBe(0);
      expect(summary.checkoff_percentage).toBe(0);
    });

    it('accurately calculates aggregates across rolls', () => {
      const summary = calculatePackingSummary(mockRolls);
      expect(summary.total_rolls).toBe(3);
      // 22.8 + 24.2 + 20.5 = 67.5
      expect(summary.total_weight_kg).toBe(67.5);
      // 67.5 / 3 = 22.5
      expect(summary.average_weight_kg).toBe(22.5);
      expect(summary.grade_a_count).toBe(2);
      expect(summary.grade_b_count).toBe(1);
      expect(summary.total_checked_rolls).toBe(1);
      expect(summary.total_checked_weight_kg).toBe(22.8);
      // 1 out of 3 = 33%
      expect(summary.checkoff_percentage).toBe(33);
    });
  });

  describe('groupRollsByColorAndBatch', () => {
    it('returns empty array when rolls are empty', () => {
      expect(groupRollsByColorAndBatch([])).toEqual([]);
    });

    it('groups by color and lot computing sub-totals', () => {
      const groups = groupRollsByColorAndBatch(mockRolls);
      expect(groups).toHaveLength(2);

      const groupMT = groups.find((g) => g.color_name === 'Muối Tiêu');
      expect(groupMT).toBeDefined();
      expect(groupMT?.total_rolls).toBe(2);
      expect(groupMT?.total_weight_kg).toBe(47.0);
      expect(groupMT?.min_weight_kg).toBe(22.8);
      expect(groupMT?.max_weight_kg).toBe(24.2);
      expect(groupMT?.grade_a_count).toBe(2);
      expect(groupMT?.checked_rolls_count).toBe(1);

      const groupXD = groups.find((g) => g.color_name === 'Xanh Đen');
      expect(groupXD).toBeDefined();
      expect(groupXD?.total_rolls).toBe(1);
      expect(groupXD?.total_weight_kg).toBe(20.5);
      expect(groupXD?.grade_b_count).toBe(1);
    });
  });

  describe('processRollCheckoff', () => {
    it('returns error when scanned code is blank', () => {
      const result = processRollCheckoff(mockRolls, '   ');
      expect(result.success).toBe(false);
      expect(result.not_found).toBe(true);
    });

    it('returns error when roll is not found in packing list', () => {
      const result = processRollCheckoff(mockRolls, 'VP-UNKNOWN-99');
      expect(result.success).toBe(false);
      expect(result.not_found).toBe(true);
      expect(result.message).toContain('VP-UNKNOWN-99');
    });

    it('returns error when roll was already checked', () => {
      const result = processRollCheckoff(mockRolls, 'VP-MT-01');
      expect(result.success).toBe(false);
      expect(result.already_checked).toBe(true);
    });

    it('successfully marks unchecked roll as checked', () => {
      const result = processRollCheckoff(mockRolls, 'vp-mt-02');
      expect(result.success).toBe(true);
      expect(result.roll?.roll_code).toBe('VP-MT-02');
      expect(result.roll?.checked).toBe(true);
      expect(result.roll?.checked_at).toBeDefined();

      const updatedRoll = result.updated_rolls.find(
        (r) => r.roll_code === 'VP-MT-02',
      );
      expect(updatedRoll?.checked).toBe(true);
    });
  });

  describe('filterPackingRolls', () => {
    it('filters by search query', () => {
      const filtered = filterPackingRolls(mockRolls, { search_query: 'XD' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.roll_code).toBe('VP-XD-01');
    });

    it('filters by color', () => {
      const filtered = filterPackingRolls(mockRolls, {
        color_name: 'Muối Tiêu',
      });
      expect(filtered).toHaveLength(2);
    });

    it('filters by grade', () => {
      const filtered = filterPackingRolls(mockRolls, { grade: 'B' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.roll_code).toBe('VP-XD-01');
    });

    it('filters by checked status', () => {
      const checked = filterPackingRolls(mockRolls, {
        checked_status: 'checked',
      });
      expect(checked).toHaveLength(1);
      expect(checked[0]?.roll_code).toBe('VP-MT-01');

      const unchecked = filterPackingRolls(mockRolls, {
        checked_status: 'unchecked',
      });
      expect(unchecked).toHaveLength(2);
    });
  });

  describe('formatPackingListForExport and CSV content', () => {
    it('formats rows with readable Vietnamese columns', () => {
      const rows = formatPackingListForExport(mockRolls);
      expect(rows).toHaveLength(3);
      expect(rows[0]?.ma_cay_vai).toBe('VP-MT-01');
      expect(rows[0]?.can_nang_kg).toBe('22.8');
      expect(rows[0]?.pham_cap).toBe('Loại A');
      expect(rows[0]?.trang_thai_kiem_dem).toBe('Đã kiểm đếm');
    });

    it('generates UTF-8 with BOM CSV string for Excel', () => {
      const csv = exportPackingListToCsvContent(mockRolls);
      expect(csv.startsWith('\uFEFF')).toBe(true);
      expect(csv).toContain('BẢNG KÊ DANH SÁCH CÂY VẢI');
      expect(csv).toContain('VP-MT-01');
      expect(csv).toContain('67.5 kg');
    });
  });
});
