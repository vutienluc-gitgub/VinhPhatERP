import { formatCurrency } from '@/shared/utils/format';
import type { YarnReceiptsFormValues } from '@/schema/yarn-receipt.schema';
import type { YarnReceipt } from '@/domain/inventory/yarn-receipts.types';

/**
 * Extracts valid (non-NaN, positive) unit prices from a receipt's items.
 */
function extractValidPrices(receipt: YarnReceipt): number[] {
  if (!receipt.yarn_receipt_items || receipt.yarn_receipt_items.length === 0) {
    return [];
  }

  return receipt.yarn_receipt_items
    .map((item: Record<string, unknown>) => Number(item.unit_price))
    .filter((p: number) => !isNaN(p) && p > 0);
}

/**
 * Calculates and formats the display string for the unit prices of a yarn receipt.
 * Extracts unique valid prices and returns a formatted range or single price.
 */
export function getReceiptUnitPriceDisplay(receipt: YarnReceipt): string {
  const prices = extractValidPrices(receipt);

  if (prices.length === 0) {
    return '—';
  }

  const min = Math.min(...prices);
  const max = Math.max(...prices);

  if (min === max) {
    return `${formatCurrency(min)}đ`;
  }

  return `${formatCurrency(min)}đ - ${formatCurrency(max)}đ`;
}

/**
 * Returns the average unit price (numeric) for sorting purposes.
 * Returns null when no valid prices exist.
 */
export function getReceiptAvgUnitPrice(receipt: YarnReceipt): number | null {
  const prices = extractValidPrices(receipt);

  if (prices.length === 0) {
    return null;
  }

  return prices.reduce((sum, p) => sum + p, 0) / prices.length;
}

export function receiptToFormValues(
  receipt: YarnReceipt,
): YarnReceiptsFormValues {
  return {
    receiptNumber: receipt.receipt_number,
    supplierId: receipt.supplier_id,
    receiptDate: receipt.receipt_date,
    vehicleInfo: receipt.vehicle_info ?? '',
    additionalFees: Array.isArray(receipt.additional_fees)
      ? (receipt.additional_fees as { name: string; amount: number }[])
      : [],
    notes: receipt.notes ?? '',
    items: (receipt.yarn_receipt_items ?? []).map((it) => ({
      yarnCatalogId: it.yarn_catalog_id ?? '',
      yarnType: it.yarn_type ?? '',
      colorName: it.color_name ?? '',
      quantity: Number(it.quantity) || 0,
      unitPrice: Number(it.unit_price) || 0,
      lotNumber: it.lot_number ?? '',
      grade: it.grade ?? '',
      unit: it.unit ?? 'kg',
      tensileStrength: it.tensile_strength ?? '',
      composition: it.composition ?? '',
      origin: it.origin ?? '',
      notes: it.notes ?? '',
      dtex: it.dtex ?? '',
      twist: it.twist ?? '',
      machineNo: it.machine_no ?? '',
      netWeight: it.net_weight != null ? Number(it.net_weight) : null,
      grossWeight: it.gross_weight != null ? Number(it.gross_weight) : null,
      serialNumber: it.serial_number ?? '',
      productionWeek:
        it.production_week != null ? Number(it.production_week) : null,
      dist: it.dist ?? '',
      conesPerBox: it.cones_per_box != null ? Number(it.cones_per_box) : null,
      boxCount: it.box_count != null ? Number(it.box_count) : null,
      boxNo: it.box_no ?? '',
    })),
  };
}
