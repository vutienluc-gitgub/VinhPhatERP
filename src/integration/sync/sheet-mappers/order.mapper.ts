/**
 * Order -> Sheet Row Mapper
 *
 * Transforms an order sync payload into SheetRowData
 * matching the ERP_REPORT_DON_HANG column structure.
 */

import type { SheetRowData } from '@/integration/ports/spreadsheet.port';

export interface OrderSyncPayload {
  orderId: string;
  orderNumber: string;
  customerName?: string;
  productName?: string;
  quantity?: number;
  totalAmount?: number;
  status?: string;
  confirmedAt?: string;
}

export function mapOrderToSheetRow(
  payload: OrderSyncPayload,
  version: number,
  syncId: string,
): SheetRowData {
  return {
    erpRecordId: payload.orderId,
    erpVersion: version,
    syncId,
    values: [
      payload.confirmedAt ?? '',
      payload.orderNumber,
      payload.customerName ?? '',
      payload.productName ?? '',
      payload.quantity ?? 0,
      payload.totalAmount ?? 0,
      payload.status ?? 'Confirmed',
    ],
  };
}
