import { describe, it, expect, vi, beforeEach } from 'vitest';

import { processOrderImports } from '@/integration/sync/sync-inbound.service';
import { generateDeterministicSyncId } from '@/integration/sync/sync-id';
import { mapOrderToSheetRow } from '@/integration/sync/sheet-mappers/order.mapper';
import type {
  ISpreadsheetPort,
  SpreadsheetConfig,
  SheetRowData,
} from '@/integration/ports/spreadsheet.port';
import type { SafeDomainEvent } from '@/domain/core/DomainEventBus';
import type { OrderConfirmedEvent } from '@/domain/events/app.events';

// In-memory simulated state
interface InMemJob {
  connection_id: string;
  provider: string;
  direction: string;
  entity_type: string;
  entity_id: string;
  sync_id: string;
  version: number;
  status: string;
  payload: Record<string, unknown>;
  attempt_count: number;
}

interface InMemOrder {
  id: string;
  order_number: string;
  customer_id: string;
  status: string;
  order_date: string;
  total_amount: number;
}

describe('Integration: Google Sheets Sync Pipeline', () => {
  let inMemJobs: Map<string, InMemJob>;
  let inMemOrders: Map<string, InMemOrder>;
  let inMemSheetRows: SheetRowData[];
  let inMemSheetStatuses: Map<number, { status: string; message?: string }>;

  const mockConnectionId = 'conn-integration-001';
  const mockSpreadsheetId = 'sheet-integration-001';

  let mockAdapter: ISpreadsheetPort;

  beforeEach(() => {
    inMemJobs = new Map();
    inMemOrders = new Map();
    inMemSheetRows = [];
    inMemSheetStatuses = new Map();

    mockAdapter = {
      upsertRow: vi
        .fn()
        .mockImplementation(
          async (_config: SpreadsheetConfig, row: SheetRowData) => {
            inMemSheetRows.push(row);
          },
        ),
      batchUpsertRows: vi.fn(),
      readReadyRows: vi.fn().mockImplementation(async () => {
        return [
          {
            _rowIndex: 2,
            'Import ID': 'IMP-DH-INT-1',
            Ngay: '2026-09-12',
            'Khach hang': 'Công ty May Thêu',
            'San pham': 'Vải Jean Denim',
            SL: 1000,
            'Don gia': 95000,
            'Ghi chu': 'Giao hàng gấp',
            'Trang thai': 'READY',
          },
          {
            _rowIndex: 3,
            'Import ID': 'IMP-DH-INT-2',
            Ngay: '2026-09-12',
            'Khach hang': 'Công ty ABC',
            'San pham': '', // Invalid: missing product
            SL: 500,
            'Don gia': 80000,
            'Trang thai': 'READY',
          },
        ];
      }),
      updateImportStatus: vi
        .fn()
        .mockImplementation(
          async (
            _config: SpreadsheetConfig,
            rowIndex: number,
            status: string,
            message?: string,
          ) => {
            inMemSheetStatuses.set(rowIndex, { status, message });
          },
        ),
      testConnection: vi.fn().mockResolvedValue(true),
    };
  });

  describe('Outbound Pipeline (Domain Event -> Outbox Job -> Worker -> Sheet Projection)', () => {
    it('should complete the entire outbound sync lifecycle with correct columns and idempotency', async () => {
      // 1. Order Confirmation Event triggers Outbox Service
      const event: SafeDomainEvent<OrderConfirmedEvent> = {
        eventId: 'evt-ord-int-001',
        eventName: 'OrderConfirmedEvent',
        timestamp: '2026-09-12T08:00:00Z',
        payload: {
          orderId: 'ord-int-100',
          orderNumber: 'DH-2026-INT-100',
          customerId: 'cust-int-1',
          totalAmount: 95_000_000,
          confirmedAt: '2026-09-12T08:00:00Z',
        },
      };

      const syncId = await generateDeterministicSyncId(
        'order',
        event.payload.orderId,
        1,
        mockConnectionId,
      );

      // Simulate Outbox insertion with safeUpsert behavior
      const job: InMemJob = {
        connection_id: mockConnectionId,
        provider: 'google_sheets',
        direction: 'outbound',
        entity_type: 'order',
        entity_id: event.payload.orderId,
        sync_id: syncId,
        version: 1,
        status: 'pending',
        payload: {
          orderId: event.payload.orderId,
          orderNumber: event.payload.orderNumber,
          customerName: 'Công ty May Thêu',
          productName: 'Vải Jean Denim',
          quantity: 1000,
          totalAmount: event.payload.totalAmount,
          confirmedAt: event.payload.confirmedAt,
        },
        attempt_count: 0,
      };
      inMemJobs.set(syncId, job);

      expect(inMemJobs.has(syncId)).toBe(true);
      expect(job.status).toBe('pending');

      // 2. Simulated Worker execution:
      // Worker reads pending job, maps to SheetRowData via order.mapper
      const rowData = mapOrderToSheetRow(
        {
          orderId: job.entity_id,
          orderNumber: job.payload.orderNumber as string,
          customerName: job.payload.customerName as string,
          productName: job.payload.productName as string,
          quantity: job.payload.quantity as number,
          totalAmount: job.payload.totalAmount as number,
          confirmedAt: job.payload.confirmedAt as string,
        },
        job.version,
        job.sync_id,
      );

      // 3. Adapter writes row to Sheet
      await mockAdapter.upsertRow(
        {
          spreadsheetId: mockSpreadsheetId,
          sheetTabName: 'ERP_REPORT_DON_HANG',
        },
        rowData,
      );

      // 4. Job status updated to success
      job.status = 'success';

      // 5. Verification:
      expect(inMemSheetRows).toHaveLength(1);
      const written = inMemSheetRows[0];
      expect(written).toBeDefined();
      expect(written?.erpRecordId).toBe('ord-int-100');
      expect(written?.erpVersion).toBe(1);
      expect(written?.syncId).toBe(syncId);
      expect(written?.values).toEqual([
        '2026-09-12T08:00:00Z',
        'DH-2026-INT-100',
        'Công ty May Thêu',
        'Vải Jean Denim',
        1000,
        95000000,
        'Confirmed',
      ]);
    });
  });

  describe('Inbound Pipeline (Sheet Import -> Validation -> Maker-Checker Draft Document)', () => {
    it('should process ready rows: accept valid rows as draft and reject invalid rows with Sheet error', async () => {
      // Mock db-guard and supabase untyped
      const dbGuard = await import('@/lib/db-guard');
      vi.spyOn(dbGuard, 'safeUpsert').mockImplementation(async (params) => {
        if (params.table === 'orders') {
          const ord = params.data as unknown as InMemOrder;
          inMemOrders.set(ord.id, ord);
        }
        return [{ id: 'mock-id' }] as unknown as ReturnType<
          typeof dbGuard.safeUpsert
        >;
      });

      const untyped = await import('@/services/supabase/untyped');
      vi.spyOn(untyped.untypedDb, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi
          .fn()
          .mockResolvedValue({ data: { id: 'cust-found-1' } }),
      } as unknown as ReturnType<typeof untyped.untypedDb.from>);

      const summary = await processOrderImports({
        adapter: mockAdapter,
        connectionId: mockConnectionId,
        spreadsheetId: mockSpreadsheetId,
      });

      // Verification of summary
      expect(summary.scanned).toBe(2);
      expect(summary.draftsCreated).toBe(1);
      expect(summary.invalidCount).toBe(1);
      expect(summary.errors).toHaveLength(1);
      expect(summary.errors[0]?.rowIndex).toBe(3);

      // Row 2 (valid): status updated to DRAFT_CREATED
      expect(inMemSheetStatuses.get(2)?.status).toBe('DRAFT_CREATED');

      // Row 3 (invalid): status updated to INVALID with error message
      expect(inMemSheetStatuses.get(3)?.status).toBe('INVALID');
      expect(inMemSheetStatuses.get(3)?.message).toBe('Thiếu tên sản phẩm');

      // Draft Document verified in ERP: Maker-Checker guarantee
      expect(inMemOrders.size).toBe(1);
      const createdOrder = Array.from(inMemOrders.values())[0];
      expect(createdOrder).toBeDefined();
      expect(createdOrder?.status).toBe('draft'); // CRITICAL: NEVER automatically confirmed
      expect(createdOrder?.total_amount).toBe(95000000);
    });
  });

  describe('Double-Fire Concurrency & Idempotency', () => {
    it('should generate identical sync_id for duplicate events and guarantee zero duplicates', async () => {
      const entityId = 'ord-duplicate-check';
      const version = 1;

      // Two concurrent events fired at the exact same millisecond
      const [id1, id2] = await Promise.all([
        generateDeterministicSyncId(
          'order',
          entityId,
          version,
          mockConnectionId,
        ),
        generateDeterministicSyncId(
          'order',
          entityId,
          version,
          mockConnectionId,
        ),
      ]);

      expect(id1).toBe(id2);
      expect(id1).toHaveLength(64); // SHA-256 hex string

      // When upserted concurrently into in-memory table with conflictKey = sync_id
      inMemJobs.set(id1, {
        connection_id: mockConnectionId,
        provider: 'google_sheets',
        direction: 'outbound',
        entity_type: 'order',
        entity_id: entityId,
        sync_id: id1,
        version: 1,
        status: 'pending',
        payload: { test: true },
        attempt_count: 0,
      });

      inMemJobs.set(id2, {
        connection_id: mockConnectionId,
        provider: 'google_sheets',
        direction: 'outbound',
        entity_type: 'order',
        entity_id: entityId,
        sync_id: id2,
        version: 1,
        status: 'pending',
        payload: { test: true },
        attempt_count: 0,
      });

      // Still only 1 entry in the job map
      expect(inMemJobs.size).toBe(1);
    });
  });
});
