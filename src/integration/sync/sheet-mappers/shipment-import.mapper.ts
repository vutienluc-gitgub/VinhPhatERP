/**
 * Shipment Import Mapper — Phase 3: Controlled Inbound Import
 *
 * Chuyển đổi và validate dòng dữ liệu từ tab ERP_IMPORT_XUAT_KHO.
 * Đảm bảo dữ liệu từ Google Sheets tuân thủ chuẩn nghiệp vụ trước khi tạo Draft Document.
 */

import { IMPORT_VALIDATION_MESSAGES } from '@/integration/sync/sheet-types';

export interface RawShipmentImportRow {
  _rowIndex: number;
  'Import ID'?: unknown;
  Ngay?: unknown;
  'Khach hang'?: unknown;
  'Ma VT'?: unknown;
  SL?: unknown;
  'Ghi chu'?: unknown;
  'Trang thai'?: unknown;
  Loi?: unknown;
  [key: string]: unknown;
}

export interface ValidatedShipmentImport {
  importId: string;
  rowIndex: number;
  shipmentDate: string;
  customerName: string;
  materialCode: string;
  quantity: number;
  notes: string;
}

export type ShipmentImportResult =
  | { success: true; data: ValidatedShipmentImport }
  | { success: false; rowIndex: number; error: string };

export function parseShipmentImportRow(
  row: RawShipmentImportRow,
): ShipmentImportResult {
  const rowIndex = typeof row._rowIndex === 'number' ? row._rowIndex : 0;

  // 1. Khách hàng
  const customerName = String(row['Khach hang'] ?? '').trim();
  if (!customerName) {
    return {
      success: false,
      rowIndex,
      error: IMPORT_VALIDATION_MESSAGES.MISSING_CUSTOMER,
    };
  }

  // 2. Mã vật tư / sản phẩm
  const materialCode = String(row['Ma VT'] ?? '').trim();
  if (!materialCode) {
    return {
      success: false,
      rowIndex,
      error: IMPORT_VALIDATION_MESSAGES.MISSING_MATERIAL,
    };
  }

  // 3. Số lượng
  const rawQuantity = row.SL;
  const quantity = Number(rawQuantity);
  if (isNaN(quantity) || quantity <= 0) {
    return {
      success: false,
      rowIndex,
      error: IMPORT_VALIDATION_MESSAGES.INVALID_QUANTITY,
    };
  }

  // 4. Ngày xuất
  const rawDate = String(row.Ngay ?? '').trim();
  let shipmentDate: string;
  if (!rawDate) {
    shipmentDate = new Date().toISOString();
  } else {
    const parsed = new Date(rawDate);
    if (isNaN(parsed.getTime())) {
      // Try DD/MM/YYYY format
      const parts = rawDate.split('/');
      if (parts.length === 3) {
        const d = Number(parts[0]);
        const m = Number(parts[1]) - 1;
        const y = Number(parts[2]);
        const customDate = new Date(y, m, d);
        shipmentDate = isNaN(customDate.getTime())
          ? new Date().toISOString()
          : customDate.toISOString();
      } else {
        return {
          success: false,
          rowIndex,
          error: IMPORT_VALIDATION_MESSAGES.INVALID_DATE_FORMAT,
        };
      }
    } else {
      shipmentDate = parsed.toISOString();
    }
  }

  // 5. Import ID & Ghi chú
  const rawImportId = String(row['Import ID'] ?? '').trim();
  const importId =
    rawImportId || `IMP-XK-${crypto.randomUUID().slice(0, 8)}-${rowIndex}`;
  const notes = String(row['Ghi chu'] ?? '').trim();

  return {
    success: true,
    data: {
      importId,
      rowIndex,
      shipmentDate,
      customerName,
      materialCode,
      quantity,
      notes,
    },
  };
}
