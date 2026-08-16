/**
 * MaterialMatchingEngine — Domain Service for Production/MES Material Allocation & Matching.
 *
 * Bounded Context: Production (MES)
 * Pure TypeScript — không phụ thuộc React, Supabase, hay UI.
 *
 * Chức năng:
 * - Tiếp nhận thông tin nguyên phụ liệu / vải mộc vừa nhập kho (IncomingMaterialSpec)
 * - Đối chiếu với danh sách các Work Order đang ở trạng thái 'planned' hoặc 'waiting_material'
 * - Tính toán độ lệch định mức (Material Gap Evaluation)
 * - Phân loại trạng thái khả dụng cho từng Work Order (READY_TO_START / PARTIALLY_AVAILABLE / WAITING_MATERIAL)
 */

export interface IncomingMaterialSpec {
  materialId?: string;
  fabricType?: string;
  color?: string;
  gsm?: number;
  quantityKg: number;
}

export interface WorkOrderDemand {
  workOrderId: string;
  workOrderNumber: string;
  fabricType?: string;
  color?: string;
  targetQuantityKg: number;
  allocatedKg: number;
  missingKg: number;
}

export type MaterialMatchStatus =
  | 'ready_to_start'
  | 'partially_available'
  | 'waiting_material';

export interface MaterialMatchResult {
  workOrderId: string;
  workOrderNumber: string;
  fabricType?: string;
  color?: string;
  matchStatus: MaterialMatchStatus;
  requiredKg: number;
  allocatedKg: number;
  matchedKg: number;
  stillMissingKg: number;
}

export interface MaterialMatchingEvaluation {
  incomingKg: number;
  totalAllocatedFromBatchKg: number;
  remainingUnallocatedKg: number;
  matchedWorkOrders: MaterialMatchResult[];
  readyWorkOrderCount: number;
  partialWorkOrderCount: number;
}

/**
 * Chuẩn hóa chuỗi để so sánh không phân biệt hoa thường và khoảng trắng.
 */
function normalizeSpec(val?: string | null): string {
  return (val ?? '').trim().toLowerCase();
}

/**
 * Kiểm tra xem một Work Order có yêu cầu loại vải / màu trùng khớp với nguyên liệu vừa nhập hay không.
 */
export function isMaterialMatching(
  incoming: IncomingMaterialSpec,
  demand: WorkOrderDemand,
): boolean {
  // Nếu cả 2 đều có fabricType, phải khớp nhau
  if (incoming.fabricType && demand.fabricType) {
    const incomingFabric = normalizeSpec(incoming.fabricType);
    const demandFabric = normalizeSpec(demand.fabricType);
    if (
      incomingFabric !== demandFabric &&
      !incomingFabric.includes(demandFabric) &&
      !demandFabric.includes(incomingFabric)
    ) {
      return false;
    }
  }

  // Nếu cả 2 đều có color, phải khớp nhau
  if (incoming.color && demand.color) {
    const incomingColor = normalizeSpec(incoming.color);
    const demandColor = normalizeSpec(demand.color);
    if (incomingColor !== demandColor) {
      return false;
    }
  }

  return true;
}

/**
 * Đánh giá phân bổ nguyên liệu cho các Work Order theo thứ tự FIFO (First In First Out).
 *
 * @param incoming Thông tin lô nguyên liệu vừa nhập
 * @param pendingWorkOrders Danh sách Work Orders đang chờ nguyên liệu
 */
export function evaluateMaterialMatching(
  incoming: IncomingMaterialSpec,
  pendingWorkOrders: WorkOrderDemand[],
): MaterialMatchingEvaluation {
  let remainingKg = Math.max(0, incoming.quantityKg || 0);
  let totalAllocatedKg = 0;
  const matchedResults: MaterialMatchResult[] = [];
  let readyCount = 0;
  let partialCount = 0;

  for (const wo of pendingWorkOrders) {
    // Bỏ qua nếu WO không thiếu nguyên liệu hoặc không khớp đặc tính
    if (wo.missingKg <= 0 || !isMaterialMatching(incoming, wo)) {
      continue;
    }

    if (remainingKg <= 0) {
      matchedResults.push({
        workOrderId: wo.workOrderId,
        workOrderNumber: wo.workOrderNumber,
        fabricType: wo.fabricType,
        color: wo.color,
        matchStatus: 'waiting_material',
        requiredKg: wo.targetQuantityKg,
        allocatedKg: wo.allocatedKg,
        matchedKg: 0,
        stillMissingKg: wo.missingKg,
      });
      continue;
    }

    // Tính toán lượng có thể cấp cho WO này từ lô nhập
    const allocatedForThisWO = Math.min(remainingKg, wo.missingKg);
    const newTotalAllocated = wo.allocatedKg + allocatedForThisWO;
    const stillMissing = Math.max(0, wo.targetQuantityKg - newTotalAllocated);

    remainingKg -= allocatedForThisWO;
    totalAllocatedKg += allocatedForThisWO;

    const isFullyReady = stillMissing <= 0;
    const matchStatus: MaterialMatchStatus = isFullyReady
      ? 'ready_to_start'
      : 'partially_available';

    if (isFullyReady) {
      readyCount++;
    } else {
      partialCount++;
    }

    matchedResults.push({
      workOrderId: wo.workOrderId,
      workOrderNumber: wo.workOrderNumber,
      fabricType: wo.fabricType,
      color: wo.color,
      matchStatus,
      requiredKg: wo.targetQuantityKg,
      allocatedKg: newTotalAllocated,
      matchedKg: allocatedForThisWO,
      stillMissingKg: stillMissing,
    });
  }

  return {
    incomingKg: incoming.quantityKg,
    totalAllocatedFromBatchKg: totalAllocatedKg,
    remainingUnallocatedKg: remainingKg,
    matchedWorkOrders: matchedResults,
    readyWorkOrderCount: readyCount,
    partialWorkOrderCount: partialCount,
  };
}
