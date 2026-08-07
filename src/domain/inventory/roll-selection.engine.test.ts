import { describe, it, expect } from 'vitest';

import {
  computeRollSelectionState,
  getRollsForLot,
  validateSelection,
} from './roll-selection.engine';
import type { RawFabricRoll } from './raw-fabric.types';

describe('Roll Selection Engine', () => {
  const mockRolls = [
    { id: 'R1', lot_number: 'LOT-A', status: 'in_stock' },
    { id: 'R2', lot_number: 'LOT-A', status: 'in_stock' },
    { id: 'R3', lot_number: 'LOT-A', status: 'in_stock' },
    { id: 'R4', lot_number: 'LOT-B', status: 'in_stock' },
    { id: 'R5', lot_number: 'LOT-B', status: 'in_stock' },
  ] as RawFabricRoll[];

  describe('computeRollSelectionState', () => {
    it('should compute correctly when no rolls are selected', () => {
      const state = computeRollSelectionState(mockRolls, []);
      expect(state.unselectedRolls.length).toBe(5);

      expect(state.lotSummary['LOT-A']).toMatchObject({
        total: 3,
        available: 3,
        selected: 0,
        remaining: 3,
        disabled: false,
      });

      expect(state.lotSummary['LOT-B']).toMatchObject({
        total: 2,
        available: 2,
        selected: 0,
        remaining: 2,
        disabled: false,
      });
    });

    it('should filter out selected rolls and update lot summary', () => {
      const state = computeRollSelectionState(mockRolls, ['R1', 'R4']);

      // R1 and R4 should be filtered out
      expect(state.unselectedRolls.length).toBe(3);
      expect(state.unselectedRolls.map((r) => r.id)).toEqual([
        'R2',
        'R3',
        'R5',
      ]);

      expect(state.lotSummary['LOT-A']).toMatchObject({
        total: 3,
        selected: 1,
        remaining: 2,
        disabled: false,
      });

      expect(state.lotSummary['LOT-B']).toMatchObject({
        total: 2,
        selected: 1,
        remaining: 1,
        disabled: false,
      });
    });

    it('should disable lot if all rolls are selected', () => {
      const state = computeRollSelectionState(mockRolls, ['R4', 'R5']);
      expect(state.lotSummary['LOT-B']).toMatchObject({
        total: 2,
        selected: 2,
        remaining: 0,
        disabled: true,
      });
    });
  });

  describe('getRollsForLot', () => {
    it('should return only unselected rolls for a specific lot', () => {
      // User selected R1 from LOT-A
      const result = getRollsForLot('LOT-A', mockRolls, ['R1']);
      expect(result.length).toBe(2);
      expect(result.map((r) => r.id)).toEqual(['R2', 'R3']);
    });

    it('should return empty if all rolls in lot are selected', () => {
      const result = getRollsForLot('LOT-B', mockRolls, ['R4', 'R5']);
      expect(result.length).toBe(0);
    });
  });

  describe('validateSelection', () => {
    it('should pass if all selections are valid and unique', () => {
      const result = validateSelection(mockRolls, ['R1', 'R2']);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should fail if there are duplicated rolls', () => {
      const result = validateSelection(mockRolls, ['R1', 'R1']);
      expect(result.valid).toBe(false);
      expect(result.duplicatedRollIds).toContain('R1');
      expect(result.errors.some((e) => e.includes('trùng lặp'))).toBe(true);
    });

    it('should fail if a roll is unavailable', () => {
      // R999 does not exist in availableRolls
      const result = validateSelection(mockRolls, ['R1', 'R999']);
      expect(result.valid).toBe(false);
      expect(result.unavailableRollIds).toContain('R999');
      expect(result.errors.some((e) => e.includes('không còn khả dụng'))).toBe(
        true,
      );
    });

    it('should fail if a roll status is not in_stock', () => {
      const rollsWithBadStatus = [
        ...mockRolls,
        { id: 'R6', lot_number: 'LOT-C', status: 'dyeing' },
      ] as RawFabricRoll[];

      const result = validateSelection(rollsWithBadStatus, ['R6']);
      expect(result.valid).toBe(false);
      expect(result.statusConflictRollIds).toContain('R6');
      expect(
        result.errors.some((e) =>
          e.includes('Trạng thái cây vải không hợp lệ'),
        ),
      ).toBe(true);
    });
  });
});
