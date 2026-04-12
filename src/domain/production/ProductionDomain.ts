/**
 * ProductionDomain — business logic cho san xuat.
 * Bounded Context: Production (work-orders, dyeing, weaving)
 *
 * Pure TypeScript. Khong phu thuoc React, Supabase, hay bat ky framework nao.
 *
 * Noi dung:
 * - BOM-based yarn requirement calculation
 * - Loss percentage adjustment
 * - Weight/quantity estimations
 * - Weaving invoice totals
 * - Dyeing totals
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BomYarnItem {
  yarn_catalog_id: string;
  ratio_pct: number;
  consumption_kg_per_m: number;
}

export interface YarnRequirement {
  yarn_catalog_id: string;
  bom_ratio_pct: number;
  required_kg: number;
}

// ─── BOM-based Yarn Calculations ──────────────────────────────────────────────

/**
 * Tinh tong tieu hao soi tren 1 met vai tu BOM.
 * Logic nay truoc day nam trong useWorkOrderLogic.ts dong 59-62.
 */
export function totalConsumptionPerMeter(bomYarns: BomYarnItem[]): number {
  return bomYarns.reduce((sum, y) => sum + (y.consumption_kg_per_m || 0), 0);
}

/**
 * Tinh trong luong vai muc tieu (kg) tu so met va BOM.
 * Logic nay truoc day nam trong useWorkOrderLogic.ts dong 63.
 */
export function calculateTargetWeightKg(
  targetQuantityM: number,
  bomYarns: BomYarnItem[],
): number {
  const consumptionPerM = totalConsumptionPerMeter(bomYarns);
  return Number((targetQuantityM * consumptionPerM).toFixed(2));
}

/**
 * Tinh tong soi can (bao gom hao hut).
 * Logic nay truoc day nam trong useWorkOrderLogic.ts dong 67-68.
 *
 * Cong thuc: totalRequired = targetKg / (1 - lossPct/100)
 */
export function calculateTotalYarnWithLoss(
  targetKg: number,
  lossPct: number,
): number {
  if (lossPct >= 100) return targetKg; // safety: avoid division by zero
  return targetKg / (1 - lossPct / 100);
}

/**
 * Tinh danh sach yarn requirements tu BOM va so luong.
 * Logic nay truoc day nam trong useWorkOrderLogic.ts dong 70-76.
 */
export function calculateYarnRequirements(
  targetQuantityM: number,
  bomYarns: BomYarnItem[],
  lossPct: number,
): YarnRequirement[] {
  const targetKg = calculateTargetWeightKg(targetQuantityM, bomYarns);
  const totalRequired = calculateTotalYarnWithLoss(targetKg, lossPct);

  return bomYarns.map((y) => ({
    yarn_catalog_id: y.yarn_catalog_id,
    bom_ratio_pct: y.ratio_pct,
    required_kg: Number((totalRequired * (y.ratio_pct / 100)).toFixed(2)),
  }));
}

/**
 * Recalculate kg cho existing requirements khi chi thay doi quantity.
 * Logic nay truoc day nam trong useWorkOrderLogic.ts dong 83-90.
 */
export function recalculateRequirementKg(
  existingReqs: YarnRequirement[],
  targetQuantityM: number,
  bomYarns: BomYarnItem[],
  lossPct: number,
): YarnRequirement[] {
  const targetKg = calculateTargetWeightKg(targetQuantityM, bomYarns);
  const totalRequired = calculateTotalYarnWithLoss(targetKg, lossPct);

  return existingReqs.map((r) => ({
    ...r,
    required_kg: Number((totalRequired * (r.bom_ratio_pct / 100)).toFixed(2)),
  }));
}

// ─── Production Yield ─────────────────────────────────────────────────────────

/**
 * Tinh ty le hao hut thuc te.
 */
export function calculateActualLossPct(
  targetQuantityM: number,
  actualYieldM: number,
): number {
  if (targetQuantityM <= 0) return 0;
  const loss = ((targetQuantityM - actualYieldM) / targetQuantityM) * 100;
  return Number(Math.max(0, loss).toFixed(2));
}

/**
 * Tinh hieu suat san xuat (yield efficiency).
 */
export function calculateYieldEfficiency(
  targetQuantityM: number,
  actualYieldM: number,
): number {
  if (targetQuantityM <= 0) return 0;
  return Number(((actualYieldM / targetQuantityM) * 100).toFixed(2));
}

// ─── Dyeing Calculations ─────────────────────────────────────────────────────

/**
 * Tinh tong gia tri lenh nhuom = tong kg * don gia/kg.
 */
export function calculateDyeingTotal(
  totalWeightKg: number,
  unitPricePerKg: number,
): number {
  return totalWeightKg * unitPricePerKg;
}

/**
 * Tinh so tien con no cua lenh nhuom.
 */
export function calculateDyeingBalance(
  totalAmount: number,
  paidAmount: number,
): number {
  return Math.max(0, totalAmount - paidAmount);
}

// ─── Weaving Calculations ─────────────────────────────────────────────────────

export interface WeavingInvoiceItem {
  quantityM: number;
  weightKg: number;
}

/**
 * Tinh tong gia tri hoa don det = so met * don gia.
 */
export function calculateWeavingTotal(
  totalQuantityM: number,
  unitPrice: number,
): number {
  return totalQuantityM * unitPrice;
}

/**
 * Tinh tong met va kg tu danh sach cuon vai.
 */
export function sumWeavingItems(items: WeavingInvoiceItem[]): {
  totalM: number;
  totalKg: number;
} {
  return items.reduce(
    (acc, item) => ({
      totalM: acc.totalM + item.quantityM,
      totalKg: acc.totalKg + item.weightKg,
    }),
    {
      totalM: 0,
      totalKg: 0,
    },
  );
}
