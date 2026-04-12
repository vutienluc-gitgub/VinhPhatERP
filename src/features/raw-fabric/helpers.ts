import type { RollStatus } from './types';

// Re-export for convenience
export type { AnomalyStatus } from '@/shared/components/roll-grid/useRollMatrixLogic';
export type { RollStatus };

export interface FilterState {
  fabricType: string;
  rollCode: string;
  status: RollStatus | '';
  quality: string;
}

export const DEFAULT_FILTER_STATE: FilterState = {
  fabricType: '',
  rollCode: '',
  status: '',
  quality: '',
};

/**
 * Tính % lệch tuyệt đối so với chuẩn cân nặng.
 * Requirements: 2.5
 */
export function calcDeviationPercent(
  weightKg: number,
  standardWeightKg: number,
): number {
  return Math.abs(((weightKg - standardWeightKg) / standardWeightKg) * 100);
}

/**
 * Kiểm tra có field nào trong FilterState khác giá trị mặc định (empty string) không.
 * Requirements: 3.4, 3.5
 */
export function isAnyFilterActive(filter: FilterState): boolean {
  return (
    filter.fabricType !== '' ||
    filter.rollCode !== '' ||
    filter.status !== '' ||
    filter.quality !== ''
  );
}

/**
 * Format text phân trang: "Trang X / Y — Z cuộn"
 * Requirements: 4.1
 */
export function formatPaginationText(
  page: number,
  totalPages: number,
  totalItems: number,
): string {
  return `Trang ${page} / ${totalPages} — ${totalItems} cuộn`;
}
