/**
 * Shipment -> Sheet Row Mapper
 *
 * Transforms a shipment sync payload into SheetRowData
 * matching the ERP_REPORT_XUAT_KHO column structure.
 */

import type { SheetRowData } from '@/integration/ports/spreadsheet.port';

export interface ShipmentSyncPayload {
  shipmentId: string;
  shipmentNumber: string;
  orderId?: string | null;
  customerName?: string;
  materialCode?: string;
  materialName?: string;
  unit?: string;
  quantity?: number;
  invoiceNumber?: string;
  shippedAt: string;
}

export function mapShipmentToSheetRow(
  payload: ShipmentSyncPayload,
  version: number,
  syncId: string,
): SheetRowData {
  return {
    erpRecordId: payload.shipmentId,
    erpVersion: version,
    syncId,
    values: [
      payload.shippedAt,
      payload.shipmentNumber,
      payload.customerName ?? '',
      payload.materialCode ?? '',
      payload.materialName ?? '',
      payload.unit ?? 'kg',
      payload.quantity ?? 0,
      payload.invoiceNumber ?? '',
      'Posted',
    ],
  };
}
