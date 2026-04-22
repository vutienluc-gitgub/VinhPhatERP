/**
 * Utility functions for Work Order yarn requirement calculations.
 * Extracted from UI to comply with Separation of Concerns (Level 9).
 */

interface YarnRequirementRow {
  bom_ratio_pct: number;
  required_kg: number;
}

/** Sum of all BOM ratio percentages */
export function calcTotalBomRatio(rows: YarnRequirementRow[]): number {
  let total = 0;
  for (const row of rows) {
    total += Number(row.bom_ratio_pct) || 0;
  }
  return total;
}

/** Sum of all required kg */
export function calcTotalRequiredKg(rows: YarnRequirementRow[]): number {
  let total = 0;
  for (const row of rows) {
    total += Number(row.required_kg) || 0;
  }
  return total;
}

/** Sum of all allocated kg */
export function calcTotalAllocatedKg(rows: { allocated_kg: number }[]): number {
  let total = 0;
  for (const row of rows) {
    total += Number(row.allocated_kg) || 0;
  }
  return total;
}
