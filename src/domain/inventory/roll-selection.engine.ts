import type { RawFabricRoll } from './raw-fabric.types';

export interface LotSummary {
  total: number;
  available: number;
  selected: number;
  remaining: number;
  totalWeight: number;
  remainingWeight: number;
  disabled: boolean;
  warning: boolean;
}

export interface ValidationResult {
  valid: boolean;
  duplicatedRollIds: string[];
  unavailableRollIds: string[];
  inactiveRollIds: string[];
  lockedRollIds: string[];
  statusConflictRollIds: string[];
  warnings: string[];
  errors: string[];
}

export interface RollSelectionState {
  unselectedRolls: RawFabricRoll[];
  lotSummary: Record<string, LotSummary>;
}

/**
 * Tính toán trạng thái chọn cây vải (Dành cho Dropdown và Batch Import)
 * @param availableRolls Tất cả cây vải hiện có trong hệ thống (thường là status = IN_STOCK)
 * @param selectedRollIds Danh sách các ID cây vải đang được chọn trên Form
 */
export function computeRollSelectionState(
  availableRolls: RawFabricRoll[],
  selectedRollIds: string[],
): RollSelectionState {
  const selectedSet = new Set(selectedRollIds.filter(Boolean));

  const unselectedRolls: RawFabricRoll[] = [];
  const lotSummary: Record<string, LotSummary> = {};

  // Khởi tạo và đếm song song
  for (const roll of availableRolls) {
    const isSelected = selectedSet.has(roll.id);

    if (!isSelected) {
      unselectedRolls.push(roll);
    }

    const lot = roll.lot_number as string | null;
    if (lot) {
      if (!lotSummary[lot]) {
        lotSummary[lot] = {
          total: 0,
          available: 0, // currently in stock
          selected: 0,
          remaining: 0,
          totalWeight: 0,
          remainingWeight: 0,
          disabled: false,
          warning: false,
        };
      }

      const summary = lotSummary[lot];
      const weight = roll.weight_kg ?? 0;

      summary.total += 1;
      summary.available += 1;
      summary.totalWeight += weight;

      if (isSelected) {
        summary.selected += 1;
      } else {
        summary.remaining += 1;
        summary.remainingWeight += weight;
      }
    }
  }

  // Cập nhật disabled cho các lô
  for (const lot in lotSummary) {
    const summary = lotSummary[lot];
    if (summary && summary.remaining === 0) {
      summary.disabled = true;
    }
  }

  return {
    unselectedRolls,
    lotSummary,
  };
}

/**
 * Trả về danh sách các cây vải chưa được chọn thuộc về một lô cụ thể.
 * Hàm này dùng để lấy dữ liệu append vào form khi user click "Nhập theo lô".
 */
export function getRollsForLot(
  lotNumber: string,
  availableRolls: RawFabricRoll[],
  selectedRollIds: string[],
): RawFabricRoll[] {
  const selectedSet = new Set(selectedRollIds.filter(Boolean));
  return availableRolls.filter(
    (r) => r.lot_number === lotNumber && !selectedSet.has(r.id),
  );
}

/**
 * Xác thực tính hợp lệ của mảng cây vải đã chọn (Defense in Depth).
 */
export function validateSelection(
  availableRolls: RawFabricRoll[],
  selectedRollIds: string[],
): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    duplicatedRollIds: [],
    unavailableRollIds: [],
    inactiveRollIds: [],
    lockedRollIds: [],
    statusConflictRollIds: [],
    warnings: [],
    errors: [],
  };

  const idCounts = new Map<string, number>();
  for (const id of selectedRollIds) {
    if (!id) continue;
    idCounts.set(id, (idCounts.get(id) || 0) + 1);
  }

  const availableMap = new Map<string, RawFabricRoll>();
  for (const r of availableRolls) {
    availableMap.set(r.id, r);
  }

  for (const [id, count] of idCounts.entries()) {
    if (count > 1) {
      result.duplicatedRollIds.push(id);
      result.errors.push(`Cây vải bị chọn trùng lặp (${count} lần).`);
    }

    const roll = availableMap.get(id);
    if (!roll) {
      // Cây vải không nằm trong danh sách available
      result.unavailableRollIds.push(id);
      result.errors.push(`Cây vải không còn khả dụng trên hệ thống.`);
    } else {
      if (roll.status !== 'in_stock') {
        result.statusConflictRollIds.push(id);
        result.errors.push(`Trạng thái cây vải không hợp lệ (${roll.status}).`);
      }
    }
  }

  if (result.errors.length > 0) {
    result.valid = false;
  }

  return result;
}
