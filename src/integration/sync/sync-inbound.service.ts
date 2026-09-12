/**
 * Sync Inbound Service — Phase 3: Controlled Inbound Import
 *
 * Điều phối quá trình kéo dữ liệu từ Google Sheets về ERP:
 * 1. Đọc các dòng có trạng thái READY từ tab ERP_IMPORT_*
 * 2. Validate dữ liệu qua mapper tương ứng
 * 3. Nếu không hợp lệ: ghi INVALID + lý do lỗi lên Google Sheet
 * 4. Nếu hợp lệ: tạo DRAFT Document trong ERP (KHÔNG bypass RBAC/SoD)
 * 5. Cập nhật trạng thái DRAFT_CREATED lên Google Sheet
 * 6. Lưu audit trail vào integration_sync_jobs và integration_sync_logs
 */

import { safeUpsert } from '@/lib/db-guard';
import { untypedDb } from '@/services/supabase/untyped';
import { logger } from '@/shared/utils/logger';
import type { ISpreadsheetPort } from '@/integration/ports/spreadsheet.port';
import { SHEET_TAB_NAMES } from '@/integration/sync/sheet-types';
import { generateDeterministicSyncId } from '@/integration/sync/sync-id';
import {
  parseOrderImportRow,
  type RawOrderImportRow,
} from '@/integration/sync/sheet-mappers/order-import.mapper';
import {
  parseShipmentImportRow,
  type RawShipmentImportRow,
} from '@/integration/sync/sheet-mappers/shipment-import.mapper';

export interface InboundImportSummary {
  entityType: 'order' | 'shipment';
  scanned: number;
  draftsCreated: number;
  invalidCount: number;
  errors: { rowIndex: number; error: string }[];
}

interface InboundImportContext {
  adapter: ISpreadsheetPort;
  connectionId: string;
  spreadsheetId: string;
}

/**
 * Tìm hoặc tạo khách hàng dự phòng theo tên
 */
async function resolveOrCreateCustomer(customerName: string): Promise<string> {
  const cleanName = customerName.trim();

  // 1. Tìm khách hàng theo tên hoặc mã
  const { data: existing } = await untypedDb
    .from('customers')
    .select('id')
    .ilike('name', `%${cleanName}%`)
    .limit(1)
    .maybeSingle();

  if (existing && typeof (existing as { id?: string }).id === 'string') {
    return (existing as { id: string }).id;
  }

  // 2. Nếu chưa có, tạo khách hàng mới
  const newCustomerId = crypto.randomUUID();
  const customerCode = `KH-IMP-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

  await safeUpsert({
    table: 'customers',
    data: {
      id: newCustomerId,
      name: cleanName,
      code: customerCode,
      status: 'active',
    },
    conflictKey: 'id',
  });

  return newCustomerId;
}

/**
 * Xử lý Import Đơn hàng từ tab ERP_IMPORT_DON_HANG
 */
export async function processOrderImports(
  context: InboundImportContext,
): Promise<InboundImportSummary> {
  const { adapter, connectionId, spreadsheetId } = context;
  const config = {
    spreadsheetId,
    sheetTabName: SHEET_TAB_NAMES.IMPORT_DON_HANG,
  };

  const rawRows = (await adapter.readReadyRows(
    config,
  )) as unknown as RawOrderImportRow[];

  let draftsCreated = 0;
  let invalidCount = 0;
  const errors: { rowIndex: number; error: string }[] = [];

  for (const rawRow of rawRows) {
    const rowIndex = rawRow._rowIndex;

    // 1. Cập nhật trạng thái đang xử lý lên Sheet
    await adapter.updateImportStatus(config, rowIndex, 'VALIDATING');

    // 2. Validate dòng dữ liệu
    const parseResult = parseOrderImportRow(rawRow);
    if (!parseResult.success) {
      invalidCount += 1;
      errors.push({ rowIndex, error: parseResult.error });
      await adapter.updateImportStatus(
        config,
        rowIndex,
        'INVALID',
        parseResult.error,
      );
      continue;
    }

    const item = parseResult.data;

    try {
      // 3. Resolve khách hàng
      const customerId = await resolveOrCreateCustomer(item.customerName);

      // 4. Tạo Draft Order trong ERP (status: 'draft')
      const orderId = crypto.randomUUID();
      const orderNumber = `DH-IMP-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

      await safeUpsert({
        table: 'orders',
        data: {
          id: orderId,
          order_number: orderNumber,
          customer_id: customerId,
          status: 'draft',
          order_date: item.orderDate,
          total_amount: item.totalAmount,
          notes: `[Google Sheets Import: ${item.importId}] ${item.notes}`,
        },
        conflictKey: 'id',
      });

      // 5. Ghi Transactional Inbound Sync Job
      const syncId = await generateDeterministicSyncId(
        'order',
        orderId,
        1,
        connectionId,
      );

      const jobUpsert = await safeUpsert({
        table: 'integration_sync_jobs',
        data: {
          connection_id: connectionId,
          provider: 'google_sheets',
          direction: 'inbound',
          entity_type: 'order',
          entity_id: orderId,
          sync_id: syncId,
          version: 1,
          status: 'success',
          payload: {
            importId: item.importId,
            rowIndex: item.rowIndex,
            orderNumber,
            customerName: item.customerName,
            productName: item.productName,
            quantity: item.quantity,
          },
          attempt_count: 1,
          completed_at: new Date().toISOString(),
        },
        conflictKey: 'sync_id',
      });

      // 6. Ghi Audit Log
      const jobId = Array.isArray(jobUpsert)
        ? (jobUpsert[0] as { id?: string })?.id
        : (jobUpsert as { id?: string })?.id;

      if (jobId) {
        await safeUpsert({
          table: 'integration_sync_logs',
          data: {
            id: crypto.randomUUID(),
            job_id: jobId,
            level: 'info',
            message: `Created draft order ${orderNumber} from Google Sheets row #${rowIndex}`,
            details: { orderId, importId: item.importId },
          },
          conflictKey: 'id',
        });
      }

      // 7. Ghi nhận thành công trên Google Sheet
      await adapter.updateImportStatus(config, rowIndex, 'DRAFT_CREATED');
      draftsCreated += 1;
    } catch (err) {
      invalidCount += 1;
      const errorMsg = err instanceof Error ? err.message : String(err);
      errors.push({ rowIndex, error: errorMsg });

      logger.error('Failed to create draft order from sheet', err, {
        module: 'sync-inbound',
        action: 'processOrderImports',
        rowIndex,
      });

      await adapter.updateImportStatus(config, rowIndex, 'INVALID', errorMsg);
    }
  }

  return {
    entityType: 'order',
    scanned: rawRows.length,
    draftsCreated,
    invalidCount,
    errors,
  };
}

/**
 * Xử lý Import Xuất kho từ tab ERP_IMPORT_XUAT_KHO
 */
export async function processShipmentImports(
  context: InboundImportContext,
): Promise<InboundImportSummary> {
  const { adapter, connectionId, spreadsheetId } = context;
  const config = {
    spreadsheetId,
    sheetTabName: SHEET_TAB_NAMES.IMPORT_XUAT_KHO,
  };

  const rawRows = (await adapter.readReadyRows(
    config,
  )) as unknown as RawShipmentImportRow[];

  let draftsCreated = 0;
  let invalidCount = 0;
  const errors: { rowIndex: number; error: string }[] = [];

  for (const rawRow of rawRows) {
    const rowIndex = rawRow._rowIndex;

    // 1. Cập nhật trạng thái VALIDATING
    await adapter.updateImportStatus(config, rowIndex, 'VALIDATING');

    // 2. Validate
    const parseResult = parseShipmentImportRow(rawRow);
    if (!parseResult.success) {
      invalidCount += 1;
      errors.push({ rowIndex, error: parseResult.error });
      await adapter.updateImportStatus(
        config,
        rowIndex,
        'INVALID',
        parseResult.error,
      );
      continue;
    }

    const item = parseResult.data;

    try {
      // 3. Resolve khách hàng
      const customerId = await resolveOrCreateCustomer(item.customerName);

      // 4. Tạo Draft Shipment trong ERP (status: 'draft')
      const shipmentId = crypto.randomUUID();
      const shipmentNumber = `XK-IMP-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

      await safeUpsert({
        table: 'shipments',
        data: {
          id: shipmentId,
          shipment_number: shipmentNumber,
          customer_id: customerId,
          status: 'draft',
          shipment_date: item.shipmentDate,
          notes: `[Google Sheets Import: ${item.importId}] ${item.notes}`,
        },
        conflictKey: 'id',
      });

      // 5. Ghi Inbound Sync Job
      const syncId = await generateDeterministicSyncId(
        'shipment',
        shipmentId,
        1,
        connectionId,
      );

      const jobUpsert = await safeUpsert({
        table: 'integration_sync_jobs',
        data: {
          connection_id: connectionId,
          provider: 'google_sheets',
          direction: 'inbound',
          entity_type: 'shipment',
          entity_id: shipmentId,
          sync_id: syncId,
          version: 1,
          status: 'success',
          payload: {
            importId: item.importId,
            rowIndex: item.rowIndex,
            shipmentNumber,
            customerName: item.customerName,
            materialCode: item.materialCode,
            quantity: item.quantity,
          },
          attempt_count: 1,
          completed_at: new Date().toISOString(),
        },
        conflictKey: 'sync_id',
      });

      // 6. Ghi Audit Log
      const jobId = Array.isArray(jobUpsert)
        ? (jobUpsert[0] as { id?: string })?.id
        : (jobUpsert as { id?: string })?.id;

      if (jobId) {
        await safeUpsert({
          table: 'integration_sync_logs',
          data: {
            id: crypto.randomUUID(),
            job_id: jobId,
            level: 'info',
            message: `Created draft shipment ${shipmentNumber} from Google Sheets row #${rowIndex}`,
            details: { shipmentId, importId: item.importId },
          },
          conflictKey: 'id',
        });
      }

      // 7. Ghi nhận thành công trên Google Sheet
      await adapter.updateImportStatus(config, rowIndex, 'DRAFT_CREATED');
      draftsCreated += 1;
    } catch (err) {
      invalidCount += 1;
      const errorMsg = err instanceof Error ? err.message : String(err);
      errors.push({ rowIndex, error: errorMsg });

      logger.error('Failed to create draft shipment from sheet', err, {
        module: 'sync-inbound',
        action: 'processShipmentImports',
        rowIndex,
      });

      await adapter.updateImportStatus(config, rowIndex, 'INVALID', errorMsg);
    }
  }

  return {
    entityType: 'shipment',
    scanned: rawRows.length,
    draftsCreated,
    invalidCount,
    errors,
  };
}
