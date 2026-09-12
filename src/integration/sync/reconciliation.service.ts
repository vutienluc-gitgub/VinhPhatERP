/**
 * Reconciliation Service — Phase 4: Consistency & Self-Healing Guard (Tầng 3)
 *
 * So sánh trạng thái giữa Supabase (SSOT) và Google Sheets (Projection):
 * - MISSING: Có trong ERP nhưng chưa có trên Sheet → Tạo outbound sync job bù đắp
 * - STALE: Có trên Sheet nhưng version cũ hơn ERP → Tạo outbound sync job cập nhật
 * - ORPHAN: Có trên Sheet nhưng không tìm thấy trong ERP → Ghi log cảnh báo
 */

import { safeUpsert } from '@/lib/db-guard';
import { untypedDb } from '@/services/supabase/untyped';
import { logger } from '@/shared/utils/logger';
import type { ISpreadsheetPort } from '@/integration/ports/spreadsheet.port';
import { SHEET_TAB_NAMES } from '@/integration/sync/sheet-types';
import { generateDeterministicSyncId } from '@/integration/sync/sync-id';

export interface EntityReconciliationSummary {
  scanned: number;
  missingFixed: number;
  staleUpdated: number;
  orphanDetected: number;
}

export interface ReconciliationReport {
  scannedAt: string;
  shipments: EntityReconciliationSummary;
  orders: EntityReconciliationSummary;
  totalJobsCreated: number;
}

interface ReconciliationContext {
  adapter: ISpreadsheetPort;
  connectionId: string;
  spreadsheetId: string;
}

interface SheetProjectionRow {
  erpRecordId: string;
  erpVersion: number;
  syncId: string;
}

/**
 * Đọc tất cả các rows từ tab báo cáo và trích xuất cột ẩn (Record ID, Version, Sync ID)
 */
async function readSheetProjectionRows(
  adapter: ISpreadsheetPort,
  spreadsheetId: string,
  sheetTabName: string,
): Promise<Map<string, SheetProjectionRow>> {
  const map = new Map<string, SheetProjectionRow>();

  try {
    const rawRows = await adapter.readReadyRows({
      spreadsheetId,
      sheetTabName,
    });

    for (const row of rawRows) {
      const erpRecordId = String(row['ERP Record ID'] ?? '').trim();
      const erpVersion = Number(row['ERP Version'] ?? 1);
      const syncId = String(row['Sync ID'] ?? '').trim();

      if (erpRecordId) {
        map.set(erpRecordId, {
          erpRecordId,
          erpVersion: isNaN(erpVersion) ? 1 : erpVersion,
          syncId,
        });
      }
    }
  } catch (err) {
    logger.warn('Failed to read sheet projection rows during reconciliation', {
      module: 'reconciliation.service',
      sheetTabName,
      error: String(err),
    });
  }

  return map;
}

/**
 * Đối soát phiếu xuất kho (Shipments)
 */
export async function reconcileShipments(
  context: ReconciliationContext,
): Promise<{ summary: EntityReconciliationSummary; jobsCreated: number }> {
  const { adapter, connectionId, spreadsheetId } = context;

  // 1. Đọc danh sách phiếu xuất hợp lệ từ ERP (status đã duyệt/xuất)
  const { data: erpShipments } = await untypedDb
    .from('shipments')
    .select('id, shipment_number, order_id, customer_id, shipment_date')
    .in('status', ['posted', 'shipped', 'delivered']);

  const shipments =
    (erpShipments as {
      id: string;
      shipment_number: string;
      order_id?: string;
      customer_id?: string;
      shipment_date: string;
      version?: number;
    }[]) || [];

  // 2. Đọc rows hiện có trên Google Sheet
  const sheetRows = await readSheetProjectionRows(
    adapter,
    spreadsheetId,
    SHEET_TAB_NAMES.REPORT_XUAT_KHO,
  );

  let missingFixed = 0;
  let staleUpdated = 0;
  let orphanDetected = 0;
  let jobsCreated = 0;

  const erpIdSet = new Set<string>();

  // 3. Quét ERP -> Sheet (Phát hiện Missing & Stale)
  for (const shipment of shipments) {
    erpIdSet.add(shipment.id);
    const erpVersion = shipment.version ?? 1;
    const existingSheetRow = sheetRows.get(shipment.id);

    const isMissing = !existingSheetRow;
    const isStale = Boolean(
      existingSheetRow && existingSheetRow.erpVersion < erpVersion,
    );

    if (isMissing || isStale) {
      if (isMissing) {
        missingFixed += 1;
      } else {
        staleUpdated += 1;
      }
      jobsCreated += 1;

      const syncId = await generateDeterministicSyncId(
        'shipment',
        shipment.id,
        erpVersion,
        connectionId,
      );

      await safeUpsert({
        table: 'integration_sync_jobs',
        data: {
          connection_id: connectionId,
          provider: 'google_sheets',
          direction: 'outbound',
          entity_type: 'shipment',
          entity_id: shipment.id,
          sync_id: syncId,
          version: erpVersion,
          status: 'pending',
          payload: {
            shipmentId: shipment.id,
            shipmentNumber: shipment.shipment_number,
            orderId: shipment.order_id ?? null,
            shippedAt: shipment.shipment_date,
          },
          attempt_count: 0,
        },
        conflictKey: 'sync_id',
      });
    }
  }

  // 4. Quét Sheet -> ERP (Phát hiện Orphan)
  for (const [recordId] of sheetRows.entries()) {
    if (!erpIdSet.has(recordId)) {
      orphanDetected += 1;
      logger.warn(
        `Orphan row detected on Google Sheet: erpRecordId=${recordId}`,
        {
          module: 'reconciliation.service',
          entityType: 'shipment',
          recordId,
        },
      );
    }
  }

  return {
    summary: {
      scanned: shipments.length,
      missingFixed,
      staleUpdated,
      orphanDetected,
    },
    jobsCreated,
  };
}

/**
 * Đối soát đơn hàng (Orders)
 */
export async function reconcileOrders(
  context: ReconciliationContext,
): Promise<{ summary: EntityReconciliationSummary; jobsCreated: number }> {
  const { adapter, connectionId, spreadsheetId } = context;

  // 1. Đọc đơn hàng hợp lệ từ ERP (status đã xác nhận)
  const { data: erpOrders } = await untypedDb
    .from('orders')
    .select('id, order_number, customer_id, total_amount, order_date')
    .in('status', ['confirmed', 'in_production', 'completed']);

  const orders =
    (erpOrders as {
      id: string;
      order_number: string;
      customer_id?: string;
      total_amount?: number;
      order_date: string;
      version?: number;
    }[]) || [];

  // 2. Đọc rows hiện có trên Google Sheet
  const sheetRows = await readSheetProjectionRows(
    adapter,
    spreadsheetId,
    SHEET_TAB_NAMES.REPORT_DON_HANG,
  );

  let missingFixed = 0;
  let staleUpdated = 0;
  let orphanDetected = 0;
  let jobsCreated = 0;

  const erpIdSet = new Set<string>();

  // 3. Quét ERP -> Sheet
  for (const order of orders) {
    erpIdSet.add(order.id);
    const erpVersion = order.version ?? 1;
    const existingSheetRow = sheetRows.get(order.id);

    const isMissing = !existingSheetRow;
    const isStale = Boolean(
      existingSheetRow && existingSheetRow.erpVersion < erpVersion,
    );

    if (isMissing || isStale) {
      if (isMissing) {
        missingFixed += 1;
      } else {
        staleUpdated += 1;
      }
      jobsCreated += 1;

      const syncId = await generateDeterministicSyncId(
        'order',
        order.id,
        erpVersion,
        connectionId,
      );

      await safeUpsert({
        table: 'integration_sync_jobs',
        data: {
          connection_id: connectionId,
          provider: 'google_sheets',
          direction: 'outbound',
          entity_type: 'order',
          entity_id: order.id,
          sync_id: syncId,
          version: erpVersion,
          status: 'pending',
          payload: {
            orderId: order.id,
            orderNumber: order.order_number,
            customerId: order.customer_id ?? null,
            totalAmount: order.total_amount ?? 0,
            confirmedAt: order.order_date,
          },
          attempt_count: 0,
        },
        conflictKey: 'sync_id',
      });
    }
  }

  // 4. Quét Sheet -> ERP (Orphan)
  for (const [recordId] of sheetRows.entries()) {
    if (!erpIdSet.has(recordId)) {
      orphanDetected += 1;
      logger.warn(
        `Orphan row detected on Google Sheet: erpRecordId=${recordId}`,
        {
          module: 'reconciliation.service',
          entityType: 'order',
          recordId,
        },
      );
    }
  }

  return {
    summary: {
      scanned: orders.length,
      missingFixed,
      staleUpdated,
      orphanDetected,
    },
    jobsCreated,
  };
}

/**
 * Thực hiện đối soát toàn diện cả Xuất kho và Đơn hàng
 */
export async function executeFullReconciliation(
  context: ReconciliationContext,
): Promise<ReconciliationReport> {
  const [shipmentRes, orderRes] = await Promise.all([
    reconcileShipments(context),
    reconcileOrders(context),
  ]);

  return {
    scannedAt: new Date().toISOString(),
    shipments: shipmentRes.summary,
    orders: orderRes.summary,
    totalJobsCreated: shipmentRes.jobsCreated + orderRes.jobsCreated,
  };
}
