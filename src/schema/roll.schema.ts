/**
 * Shared roll constants used by both raw-fabric and finished-fabric domains.
 * Import from this file to avoid defining these constants twice.
 *
 * Consumers should import via their domain schema (raw-fabric.schema / finished-fabric.schema)
 * which re-export from here.
 */

export const QUALITY_GRADES = ['A', 'B', 'C'] as const;
export type QualityGrade = (typeof QUALITY_GRADES)[number];

export const QUALITY_GRADE_LABELS: Record<QualityGrade, string> = {
  A: 'Loại A',
  B: 'Loại B',
  C: 'Loại C',
};

export const ROLL_STATUSES = [
  'in_stock',
  'reserved',
  'in_process',
  'shipped',
  'damaged',
  'written_off',
] as const;
export type RollStatus = (typeof ROLL_STATUSES)[number];

export const ROLL_STATUS_LABELS: Record<RollStatus, string> = {
  in_stock: 'Trong kho',
  reserved: 'Đã đặt trước',
  in_process: 'Đang xử lý',
  shipped: 'Đã xuất kho',
  damaged: 'Hư hỏng',
  written_off: 'Xóa sổ',
};

const BULK_ROLL_NUMBER_PAD = 3;

export function formatBulkRollNumber(prefix: string, sequence: number): string {
  return `${prefix.trim()}${String(sequence).padStart(BULK_ROLL_NUMBER_PAD, '0')}`;
}

/** Đếm số dòng đã nhập trọng lượng hợp lệ (> 0) trong bulk form. */
export function countFilledRolls(
  rolls: { weight_kg?: number | string | null }[],
): number {
  return rolls.filter((r) => {
    const val = parseFloat(String(r.weight_kg));
    return Number.isFinite(val) && val > 0;
  }).length;
}
