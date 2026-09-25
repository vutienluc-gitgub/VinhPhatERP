/**
 * Roll check-off and filtering utilities for Fabric Roll Packing List.
 * Pure TypeScript — zero dependencies on UI.
 */

import type {
  FabricRollPackingItem,
  PackingListFilter,
  RollCheckoffResult,
} from '@/domain/inventory/packing-list.types';
import {
  normalizeGrade,
  roundWeight,
} from '@/domain/inventory/packing-list.utils';

/**
 * Handles barcode / QR code roll scanning during warehouse check-off.
 */
export function processRollCheckoff(
  rolls: FabricRollPackingItem[],
  scannedCode: string,
): RollCheckoffResult {
  const code = (scannedCode ?? '').trim().toLowerCase();
  if (!code) {
    return {
      success: false,
      message: 'Mã quét không hợp lệ hoặc để trống.',
      not_found: true,
      updated_rolls: rolls,
    };
  }

  const rollIndex = rolls.findIndex(
    (r) =>
      r.roll_code.trim().toLowerCase() === code ||
      r.id.trim().toLowerCase() === code,
  );

  if (rollIndex === -1) {
    return {
      success: false,
      message: `Cây vải "${scannedCode.trim()}" không thuộc bảng kê này.`,
      not_found: true,
      updated_rolls: rolls,
    };
  }

  const targetRoll = rolls[rollIndex];
  if (targetRoll && targetRoll.checked) {
    return {
      success: false,
      roll: targetRoll,
      message: `Cây vải "${targetRoll.roll_code}" đã được kiểm đếm trước đó.`,
      already_checked: true,
      updated_rolls: rolls,
    };
  }

  const updatedRoll: FabricRollPackingItem = {
    ...targetRoll!,
    checked: true,
    checked_at: new Date().toISOString(),
  };

  const updatedRolls = [...rolls];
  updatedRolls[rollIndex] = updatedRoll;

  return {
    success: true,
    roll: updatedRoll,
    message: `Đã kiểm đếm cây vải "${updatedRoll.roll_code}" (${roundWeight(updatedRoll.weight_kg)} kg).`,
    updated_rolls: updatedRolls,
  };
}

/**
 * Filters roll list by search text, color, grade, and checkoff status.
 */
export function filterPackingRolls(
  rolls: FabricRollPackingItem[],
  filter: PackingListFilter,
): FabricRollPackingItem[] {
  if (!rolls || rolls.length === 0) return [];

  const query = filter.search_query?.trim().toLowerCase() || '';
  const colorFilter = filter.color_name?.trim().toLowerCase() || '';
  const gradeFilter = filter.grade ? normalizeGrade(filter.grade) : '';
  const statusFilter = filter.checked_status || 'all';

  return rolls.filter((roll) => {
    if (query) {
      const matchCode = roll.roll_code.toLowerCase().includes(query);
      const matchType =
        roll.fabric_type?.toLowerCase().includes(query) ?? false;
      const matchLot = roll.lot_number?.toLowerCase().includes(query) ?? false;
      if (!matchCode && !matchType && !matchLot) return false;
    }

    if (colorFilter) {
      const rollColor = (roll.color_name || '').toLowerCase();
      if (!rollColor.includes(colorFilter)) return false;
    }

    if (gradeFilter) {
      if (normalizeGrade(roll.grade) !== gradeFilter) return false;
    }

    if (statusFilter === 'checked' && !roll.checked) return false;
    if (statusFilter === 'unchecked' && roll.checked) return false;

    return true;
  });
}
