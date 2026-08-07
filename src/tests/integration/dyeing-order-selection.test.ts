import { describe, it, expect, beforeEach } from 'vitest';

import {
  computeRollSelectionState,
  getRollsForLot,
  validateSelection,
} from '@/domain/inventory/roll-selection.engine';
import type { RawFabricRoll } from '@/domain/inventory/raw-fabric.types';

describe('Integration: Dyeing Order Roll Selection', () => {
  let mockRolls: RawFabricRoll[];

  beforeEach(() => {
    mockRolls = [
      {
        id: 'roll-1',
        roll_number: 'R1',
        fabric_type: 'Cotton',
        weight_kg: 20,
        lot_number: 'L-100',
        status: 'in_stock',
      },
      {
        id: 'roll-2',
        roll_number: 'R2',
        fabric_type: 'Cotton',
        weight_kg: 25,
        lot_number: 'L-100',
        status: 'in_stock',
      },
      {
        id: 'roll-3',
        roll_number: 'R3',
        fabric_type: 'Cotton',
        weight_kg: 22,
        lot_number: 'L-100',
        status: 'in_stock',
      },
      {
        id: 'roll-4',
        roll_number: 'R4',
        fabric_type: 'Poly',
        weight_kg: 15,
        lot_number: 'L-200',
        status: 'in_stock',
      },
      {
        id: 'roll-5',
        roll_number: 'R5',
        fabric_type: 'Poly',
        weight_kg: 18,
        lot_number: 'L-200',
        status: 'in_stock',
      },
    ] as RawFabricRoll[];
  });

  it('should process batch addition correctly and update unselected options', () => {
    // 1. Initial State
    let selectedRollIds: string[] = [];
    let state = computeRollSelectionState(mockRolls, selectedRollIds);

    expect(state.unselectedRolls.length).toBe(5);
    expect(state.lotSummary['L-100']!.remaining).toBe(3);
    expect(state.lotSummary['L-100']!.remainingWeight).toBe(67);

    // 2. User adds lot L-100
    const rollsToAdd = getRollsForLot('L-100', mockRolls, selectedRollIds);
    expect(rollsToAdd.length).toBe(3);

    // Simulate updating form state
    selectedRollIds = [...selectedRollIds, ...rollsToAdd.map((r) => r.id)];

    // 3. Next State
    state = computeRollSelectionState(mockRolls, selectedRollIds);
    expect(state.unselectedRolls.length).toBe(2); // Only L-200 rolls left
    expect(state.lotSummary['L-100']!.remaining).toBe(0);
    expect(state.lotSummary['L-100']!.disabled).toBe(true);

    // 4. Validate
    const validation = validateSelection(mockRolls, selectedRollIds);
    expect(validation.valid).toBe(true);
  });

  it('should restore batch options when user removes an item', () => {
    // Simulate all L-100 selected
    let selectedRollIds: string[] = ['roll-1', 'roll-2', 'roll-3'];
    let state = computeRollSelectionState(mockRolls, selectedRollIds);

    expect(state.lotSummary['L-100']!.disabled).toBe(true);
    expect(state.lotSummary['L-100']!.remaining).toBe(0);

    // User removes roll-2
    selectedRollIds = selectedRollIds.filter((id) => id !== 'roll-2');
    state = computeRollSelectionState(mockRolls, selectedRollIds);

    // Lot L-100 is enabled again for the remaining 1 roll
    expect(state.lotSummary['L-100']!.disabled).toBe(false);
    expect(state.lotSummary['L-100']!.remaining).toBe(1);
    expect(state.lotSummary['L-100']!.remainingWeight).toBe(25);
    expect(state.unselectedRolls.map((r) => r.id)).toContain('roll-2');
  });

  it('should fail validation on duplicate selection', () => {
    // Simulate race condition or weird UI state where a roll is selected twice
    const selectedRollIds: string[] = ['roll-1', 'roll-1', 'roll-4'];
    const validation = validateSelection(mockRolls, selectedRollIds);

    expect(validation.valid).toBe(false);
    expect(validation.errors[0]).toContain(
      'Cây vải bị chọn trùng lặp (2 lần).',
    );
  });
});
