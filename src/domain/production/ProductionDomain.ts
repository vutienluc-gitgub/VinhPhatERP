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
 */
export function calculateTargetWeightKg(
  targetQuantityM: number,
  bomYarns: BomYarnItem[],
): number {
  const consumptionPerM = totalConsumptionPerMeter(bomYarns);
  return Number((targetQuantityM * consumptionPerM).toFixed(2));
}

/**
 * Quy doi san luong muc tieu ve kg, phu thuoc vao don vi.
 * - 'kg': gia tri da la kg, khong can quy doi.
 * - 'm' : quy doi qua BOM consumption_kg_per_m.
 * - 'yard': chuyen sang met truoc (1 yard = 0.9144m), roi quy doi.
 */
export function resolveTargetWeightKg(
  quantity: number,
  unit: string,
  bomYarns: BomYarnItem[],
): number {
  if (unit === 'kg') return quantity;
  const meters = unit === 'yard' ? quantity * 0.9144 : quantity;
  return calculateTargetWeightKg(meters, bomYarns);
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
 * Tinh danh sach yarn requirements tu BOM, so luong va don vi.
 */
export function calculateYarnRequirements(
  quantity: number,
  bomYarns: BomYarnItem[],
  lossPct: number,
  unit = 'kg',
): YarnRequirement[] {
  const targetKg = resolveTargetWeightKg(quantity, unit, bomYarns);
  const totalRequired = calculateTotalYarnWithLoss(targetKg, lossPct);

  return bomYarns.map((y) => ({
    yarn_catalog_id: y.yarn_catalog_id,
    bom_ratio_pct: y.ratio_pct,
    required_kg: Number((totalRequired * (y.ratio_pct / 100)).toFixed(2)),
  }));
}

/**
 * Recalculate kg cho existing requirements khi thay doi quantity.
 */
export function recalculateRequirementKg(
  existingReqs: YarnRequirement[],
  quantity: number,
  bomYarns: BomYarnItem[],
  lossPct: number,
  unit = 'kg',
): YarnRequirement[] {
  const targetKg = resolveTargetWeightKg(quantity, unit, bomYarns);
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

// ─── Price Estimation ─────────────────────────────────────────────────────────

export interface GreigeCostEstimation {
  directYarnCost: number;
  wasteCost: number;
  processingCost: number;
  totalCost: number;
  finalPrice: number;
}

/**
 * Tinh truc tiep chi phi soi tu du lieu thuc (khong qua trung gian)
 */
export function calculateDirectYarnCost(
  yarnRequirements: { yarn_catalog_id?: string; required_kg?: number }[],
  yarnPricesMap: Record<string, number>,
): { directYarnCost: number; derivedAvgPrice: number } {
  let totalCost = 0;
  let totalKg = 0;

  for (const req of yarnRequirements) {
    if (!req.yarn_catalog_id || !req.required_kg) continue;
    const price = yarnPricesMap[req.yarn_catalog_id] || 0;
    totalCost += price * req.required_kg;
    totalKg += req.required_kg;
  }

  return {
    directYarnCost: Math.round(totalCost),
    derivedAvgPrice: totalKg > 0 ? Math.round(totalCost / totalKg) : 0,
  };
}

/**
 * Tinh du toan gia thanh vai moc
 */
export function calculateGreigeCostEstimation(
  directYarnCost: number,
  standardLossPct: number,
  weavingUnitPrice: number,
  targetQuantity: number,
  profitMarginPct: number,
): GreigeCostEstimation {
  const processingCost = weavingUnitPrice * targetQuantity;
  const wasteCost = Math.round((directYarnCost * standardLossPct) / 100);
  const totalCost = directYarnCost + wasteCost + processingCost;
  const finalPrice = Math.round(totalCost * (1 + profitMarginPct / 100));

  return { directYarnCost, wasteCost, processingCost, totalCost, finalPrice };
}
