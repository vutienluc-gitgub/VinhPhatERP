/**
 * Pure domain utilities for Fabric Roll Packing List (Bảng kê danh sách cây vải).
 * Adheres to 100% test coverage, strict numerical precision, and zero UI dependency.
 */

import type {
  FabricGrade,
  FabricRollPackingItem,
  PackingGroupSummary,
  PackingListTotal,
} from '@/domain/inventory/packing-list.types';

// Re-export specialized utilities for seamless consumption across features
export * from './packing-checkoff.utils';
export * from './packing-export.utils';

/**
 * Normalizes grade string to standardized display grade.
 */
export function normalizeGrade(grade?: FabricGrade): 'A' | 'B' | 'C' | 'Khác' {
  if (!grade) return 'Khác';
  const upper = String(grade).toUpperCase().trim();
  if (upper === 'GRADE_A' || upper === 'A') return 'A';
  if (upper === 'GRADE_B' || upper === 'B') return 'B';
  if (upper === 'GRADE_C' || upper === 'C') return 'C';
  return 'Khác';
}

/**
 * Rounds weight to 1 decimal place with floating point precision guard.
 */
export function roundWeight(weight: number): number {
  if (!Number.isFinite(weight) || weight <= 0) return 0;
  return Math.round((weight + Number.EPSILON) * 10) / 10;
}

/**
 * Calculates overall totals and aggregates for a list of fabric rolls.
 */
export function calculatePackingSummary(
  rolls: FabricRollPackingItem[],
): PackingListTotal {
  if (!rolls || rolls.length === 0) {
    return {
      total_rolls: 0,
      total_weight_kg: 0,
      average_weight_kg: 0,
      total_groups: 0,
      grade_a_count: 0,
      grade_b_count: 0,
      other_grade_count: 0,
      total_checked_rolls: 0,
      total_checked_weight_kg: 0,
      checkoff_percentage: 0,
    };
  }

  let totalWeight = 0;
  let gradeACount = 0;
  let gradeBCount = 0;
  let otherGradeCount = 0;
  let checkedRollsCount = 0;
  let checkedWeight = 0;

  for (const roll of rolls) {
    const w = Number.isFinite(roll.weight_kg) ? Math.max(0, roll.weight_kg) : 0;
    totalWeight += w;

    const normGrade = normalizeGrade(roll.grade);
    if (normGrade === 'A') gradeACount++;
    else if (normGrade === 'B') gradeBCount++;
    else otherGradeCount++;

    if (roll.checked) {
      checkedRollsCount++;
      checkedWeight += w;
    }
  }

  const roundedTotalWeight = roundWeight(totalWeight);
  const roundedCheckedWeight = roundWeight(checkedWeight);
  const avgWeight =
    rolls.length > 0 ? roundWeight(totalWeight / rolls.length) : 0;
  const percentage =
    rolls.length > 0 ? Math.round((checkedRollsCount / rolls.length) * 100) : 0;

  return {
    total_rolls: rolls.length,
    total_weight_kg: roundedTotalWeight,
    average_weight_kg: avgWeight,
    total_groups: 0,
    grade_a_count: gradeACount,
    grade_b_count: gradeBCount,
    other_grade_count: otherGradeCount,
    total_checked_rolls: checkedRollsCount,
    total_checked_weight_kg: roundedCheckedWeight,
    checkoff_percentage: percentage,
  };
}

/**
 * Groups fabric rolls by color (and optionally lot), computing sub-totals per group.
 */
export function groupRollsByColorAndBatch(
  rolls: FabricRollPackingItem[],
): PackingGroupSummary[] {
  if (!rolls || rolls.length === 0) return [];

  const groupsMap = new Map<string, FabricRollPackingItem[]>();

  for (const roll of rolls) {
    const color = roll.color_name?.trim() || 'Chưa phân màu';
    const lot = roll.lot_number?.trim() || '';
    const key = lot ? `${color} (Lô: ${lot})` : color;

    const existing = groupsMap.get(key);
    if (existing) {
      existing.push(roll);
    } else {
      groupsMap.set(key, [roll]);
    }
  }

  const result: PackingGroupSummary[] = [];

  for (const [groupKey, groupRolls] of groupsMap.entries()) {
    let groupWeight = 0;
    let minW = Number.POSITIVE_INFINITY;
    let maxW = Number.NEGATIVE_INFINITY;
    let gradeA = 0;
    let gradeB = 0;
    let checkedCount = 0;
    let checkedW = 0;

    for (const r of groupRolls) {
      const w = Number.isFinite(r.weight_kg) ? Math.max(0, r.weight_kg) : 0;
      groupWeight += w;
      if (w < minW) minW = w;
      if (w > maxW) maxW = w;

      const normGrade = normalizeGrade(r.grade);
      if (normGrade === 'A') gradeA++;
      else if (normGrade === 'B') gradeB++;

      if (r.checked) {
        checkedCount++;
        checkedW += w;
      }
    }

    const firstRoll = groupRolls[0];
    const totalRolls = groupRolls.length;

    result.push({
      group_key: groupKey,
      color_name: firstRoll?.color_name?.trim() || 'Chưa phân màu',
      fabric_type: firstRoll?.fabric_type,
      lot_number: firstRoll?.lot_number,
      rolls: groupRolls,
      total_rolls: totalRolls,
      total_weight_kg: roundWeight(groupWeight),
      average_weight_kg:
        totalRolls > 0 ? roundWeight(groupWeight / totalRolls) : 0,
      min_weight_kg: minW !== Number.POSITIVE_INFINITY ? roundWeight(minW) : 0,
      max_weight_kg: maxW !== Number.NEGATIVE_INFINITY ? roundWeight(maxW) : 0,
      grade_a_count: gradeA,
      grade_b_count: gradeB,
      checked_rolls_count: checkedCount,
      checked_weight_kg: roundWeight(checkedW),
    });
  }

  return result;
}
