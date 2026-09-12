import type { SupplierCapabilityCode } from '@/domain/crm/suppliers.types';
import type { PortalEntitlement } from '@/features/supplier-portal/types/entitlements';

/**
 * Suy diễn tập hợp quyền hạn trên Supplier Portal (PortalEntitlement)
 * dựa trên danh sách Năng lực thực tế (Capabilities) và phân loại dự phòng (Category Fallback).
 */
export function resolveSupplierEntitlements(
  capabilities: SupplierCapabilityCode[] = [],
  categoryFallback?: string,
): Set<PortalEntitlement> {
  const entitlements = new Set<PortalEntitlement>();

  // 1. Baseline: Mọi đối tác hợp tác đều được tra cứu công nợ và hóa đơn của mình
  entitlements.add('VIEW_DEBT');
  entitlements.add('SUBMIT_INVOICE');

  const hasCap = (cap: SupplierCapabilityCode) => capabilities.includes(cap);

  // 2. Nhóm Năng lực Gia công Sản xuất (Subcontracting / Production)
  const isManufacturingSubcontractor =
    hasCap('WEAVING') ||
    hasCap('KNITTING') ||
    hasCap('DYEING') ||
    hasCap('PRINTING') ||
    categoryFallback === 'OUTSOURCING' ||
    categoryFallback === 'weaving' ||
    categoryFallback === 'dyeing';

  if (isManufacturingSubcontractor) {
    entitlements.add('VIEW_WORK_ORDER');
    entitlements.add('CONFIRM_MATERIAL');
  }

  // 3. Nhóm Năng lực Cung ứng Hàng hóa / Vật tư (Commodity & Trade)
  const isCommoditySupplier =
    capabilities.some((c) => c.startsWith('SUPPLY_')) ||
    ['YARN', 'GREIGE', 'FINISHED_FABRIC', 'CHEMICAL', 'TRIM'].includes(
      categoryFallback || '',
    );

  if (isCommoditySupplier) {
    entitlements.add('VIEW_PO');
    entitlements.add('VIEW_RFQ');
    entitlements.add('CONFIRM_DELIVERY');
  }

  // 4. Nhóm Năng lực Vận tải & Giao nhận (Logistics & Transport)
  const isLogisticsPartner =
    hasCap('LOGISTICS') || categoryFallback === 'SERVICE';

  if (isLogisticsPartner) {
    entitlements.add('CONFIRM_DELIVERY');

    // Nếu đơn thuần là đối tác vận chuyển (không cung cấp vật tư/sản xuất), ẩn giá trị PO thương mại
    if (!isCommoditySupplier && !isManufacturingSubcontractor) {
      entitlements.delete('VIEW_PO');
      entitlements.delete('VIEW_RFQ');
    }
  }

  // 5. Fallback an toàn: Nếu NCC chưa có bất kỳ capability nào và category rỗng, cấp quyền PO mặc định
  if (capabilities.length === 0 && !categoryFallback) {
    entitlements.add('VIEW_PO');
    entitlements.add('VIEW_RFQ');
    entitlements.add('CONFIRM_DELIVERY');
  }

  return entitlements;
}
