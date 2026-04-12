import type { RawFabricRoll, RollStatus } from '@/features/raw-fabric/types';
import type { FinishedFabricRoll } from '@/features/finished-fabric/types';

/**
 * Tính trọng lượng ước tính (kg) dựa trên chiều dài, chiều rộng, GSM.
 * Công thức: weight = (length_m × width_cm / 100 × gsm) / 1000
 */
export function estimateFabricWeight(
  lengthM: number,
  widthCm: number,
  gsmWeight: number,
): number {
  return (lengthM * (widthCm / 100) * gsmWeight) / 1000;
}

/**
 * Tổng hợp thống kê cơ bản cho danh sách cuộn vải mộc.
 */
export function summarizeRawFabric(rolls: RawFabricRoll[]) {
  const totalRolls = rolls.length;
  const totalWeightKg = rolls.reduce((sum, r) => sum + (r.weight_kg ?? 0), 0);
  const totalLengthM = rolls.reduce((sum, r) => sum + (r.length_m ?? 0), 0);

  const byStatus = rolls.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  return {
    totalRolls,
    totalWeightKg,
    totalLengthM,
    byStatus,
  };
}

/**
 * Tổng hợp thống kê cho vải thành phẩm.
 */
export function summarizeFinishedFabric(rolls: FinishedFabricRoll[]) {
  const totalRolls = rolls.length;
  const totalWeightKg = rolls.reduce((sum, r) => sum + (r.weight_kg ?? 0), 0);
  const totalLengthM = rolls.reduce((sum, r) => sum + (r.length_m ?? 0), 0);

  const byStatus = rolls.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  return {
    totalRolls,
    totalWeightKg,
    totalLengthM,
    byStatus,
  };
}

/**
 * Kiểm tra cuộn vải có thể giao hàng không.
 * Chỉ cuộn 'in_stock' mới được phép giao.
 */
export function canShipRoll(status: RollStatus): boolean {
  return status === 'in_stock';
}
