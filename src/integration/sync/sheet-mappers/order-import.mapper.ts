/**
 * Order Import Mapper — Phase 3: Controlled Inbound Import
 *
 * Chuyển đổi và validate dòng dữ liệu từ tab ERP_IMPORT_DON_HANG.
 * Đảm bảo dữ liệu từ Google Sheets tuân thủ chuẩn nghiệp vụ trước khi tạo Draft Document.
 */

import { IMPORT_VALIDATION_MESSAGES } from '@/integration/sync/sheet-types';

export interface RawOrderImportRow {
  _rowIndex: number;
  'Import ID'?: unknown;
  Ngay?: unknown;
  'Khach hang'?: unknown;
  'San pham'?: unknown;
  SL?: unknown;
  'Don gia'?: unknown;
  'Ghi chu'?: unknown;
  'Trang thai'?: unknown;
  Loi?: unknown;
  [key: string]: unknown;
}

export interface ValidatedOrderImport {
  importId: string;
  rowIndex: number;
  orderDate: string;
  customerName: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  notes: string;
}

export type OrderImportResult =
  | { success: true; data: ValidatedOrderImport }
  | { success: false; rowIndex: number; error: string };

export function parseOrderImportRow(row: RawOrderImportRow): OrderImportResult {
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

  // 2. Tên sản phẩm / vải
  const productName = String(row['San pham'] ?? '').trim();
  if (!productName) {
    return {
      success: false,
      rowIndex,
      error: IMPORT_VALIDATION_MESSAGES.MISSING_PRODUCT,
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

  // 4. Đơn giá
  const rawUnitPrice = row['Don gia'];
  const unitPrice =
    rawUnitPrice !== undefined && rawUnitPrice !== null && rawUnitPrice !== ''
      ? Number(rawUnitPrice)
      : 0;

  if (isNaN(unitPrice) || unitPrice < 0) {
    return {
      success: false,
      rowIndex,
      error: IMPORT_VALIDATION_MESSAGES.INVALID_UNIT_PRICE,
    };
  }

  const totalAmount = quantity * unitPrice;

  // 5. Ngày đặt hàng
  const rawDate = String(row.Ngay ?? '').trim();
  let orderDate: string;
  if (!rawDate) {
    orderDate = new Date().toISOString();
  } else {
    const parsed = new Date(rawDate);
    if (isNaN(parsed.getTime())) {
      const parts = rawDate.split('/');
      if (parts.length === 3) {
        const d = Number(parts[0]);
        const m = Number(parts[1]) - 1;
        const y = Number(parts[2]);
        const customDate = new Date(y, m, d);
        orderDate = isNaN(customDate.getTime())
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
      orderDate = parsed.toISOString();
    }
  }

  // 6. Import ID & Ghi chú
  const rawImportId = String(row['Import ID'] ?? '').trim();
  const importId =
    rawImportId || `IMP-DH-${crypto.randomUUID().slice(0, 8)}-${rowIndex}`;
  const notes = String(row['Ghi chu'] ?? '').trim();

  return {
    success: true,
    data: {
      importId,
      rowIndex,
      orderDate,
      customerName,
      productName,
      quantity,
      unitPrice,
      totalAmount,
      notes,
    },
  };
}
