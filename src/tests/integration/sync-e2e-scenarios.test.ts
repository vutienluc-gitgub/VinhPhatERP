import { describe, it, expect, vi, beforeEach } from 'vitest';

import { parseOrderImportRow } from '@/integration/sync/sheet-mappers/order-import.mapper';
import { parseShipmentImportRow } from '@/integration/sync/sheet-mappers/shipment-import.mapper';
import { calculateNextRetry } from '@/integration/sync/sync-outbox.service';
import { reconcileShipments } from '@/integration/sync/reconciliation.service';
import { processShipmentImports } from '@/integration/sync/sync-inbound.service';
import type { ISpreadsheetPort } from '@/integration/ports/spreadsheet.port';
import { IMPORT_VALIDATION_MESSAGES } from '@/integration/sync/sheet-types';

describe('E2E Scenarios & Multi-Condition Robustness Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Scenario 1: Vietnamese Unicode & Special Character Handling', () => {
    it('should accurately preserve full Vietnamese diacritics, typography and special symbols', () => {
      const complexUnicodeRow = {
        _rowIndex: 10,
        'Import ID': 'IMP-UNICODE-001',
        Ngay: '2026-09-12',
        'Khach hang': 'Công ty TNHH Dệt May & Xuất Nhập Khẩu Phước Long (CN2)',
        'San pham':
          'Vải Kaki Thun 4 Chiều — Định lượng 280g/m² [Màu Đỏ Đô #D01]',
        SL: 2500.5,
        'Don gia': 145000,
        'Ghi chu':
          'Giao đợt 1: 1.500m; Đợt 2: 1.000m. "Yêu cầu kiểm tra độ co giãn kỹ!"',
        'Trang thai': 'READY',
      };

      const result = parseOrderImportRow(complexUnicodeRow);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.customerName).toBe(
          'Công ty TNHH Dệt May & Xuất Nhập Khẩu Phước Long (CN2)',
        );
        expect(result.data.productName).toBe(
          'Vải Kaki Thun 4 Chiều — Định lượng 280g/m² [Màu Đỏ Đô #D01]',
        );
        expect(result.data.quantity).toBe(2500.5);
        expect(result.data.totalAmount).toBe(362572500); // 2500.5 * 145000
        expect(result.data.notes).toContain(
          '"Yêu cầu kiểm tra độ co giãn kỹ!"',
        );
      }
    });

    it('should parse shipment rows with Vietnamese material codes and compound names', () => {
      const shipmentRow = {
        _rowIndex: 12,
        'Import ID': 'IMP-SHIP-VN-01',
        Ngay: '15/10/2026',
        'Khach hang': 'Xưởng May Gia Công Đức Trí',
        'Ma VT': 'COTTON-ORGANIC-TRẮNG-TỰ-NHIÊN',
        SL: 850.75,
        'Ghi chu': 'Hàng mẫu đính kèm thẻ bài',
        'Trang thai': 'READY',
      };

      const result = parseShipmentImportRow(shipmentRow);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.customerName).toBe('Xưởng May Gia Công Đức Trí');
        expect(result.data.materialCode).toBe('COTTON-ORGANIC-TRẮNG-TỰ-NHIÊN');
        expect(result.data.quantity).toBe(850.75);
      }
    });
  });

  describe('Scenario 2: Boundary & Extreme Numeric Conditions', () => {
    it('should reject zero, negative, NaN and non-numeric quantities with centralized error message', () => {
      const testCases = [
        { SL: 0 },
        { SL: -1 },
        { SL: -99999.99 },
        { SL: 'abc' },
        { SL: '' },
        { SL: null },
        { SL: undefined },
      ];

      for (const tc of testCases) {
        const res = parseOrderImportRow({
          _rowIndex: 5,
          'Khach hang': 'Khách Test',
          'San pham': 'Vải Test',
          SL: tc.SL,
        });

        expect(res.success).toBe(false);
        if (!res.success) {
          expect(res.error).toBe(IMPORT_VALIDATION_MESSAGES.INVALID_QUANTITY);
        }
      }
    });

    it('should allow unit price 0 for sample/promotional orders but reject negative unit price', () => {
      const freeSample = parseOrderImportRow({
        _rowIndex: 6,
        'Khach hang': 'Cty Mẫu',
        'San pham': 'Vải Mẫu Miễn Phí',
        SL: 10,
        'Don gia': 0, // 0 is valid for promotional gifts
      });
      expect(freeSample.success).toBe(true);
      if (freeSample.success) {
        expect(freeSample.data.totalAmount).toBe(0);
      }

      const negativePrice = parseOrderImportRow({
        _rowIndex: 7,
        'Khach hang': 'Cty Mẫu',
        'San pham': 'Vải Mẫu',
        SL: 10,
        'Don gia': -500,
      });
      expect(negativePrice.success).toBe(false);
      if (!negativePrice.success) {
        expect(negativePrice.error).toBe(
          IMPORT_VALIDATION_MESSAGES.INVALID_UNIT_PRICE,
        );
      }
    });
  });

  describe('Scenario 3: Date Parsing Under Multiple Formats', () => {
    it('should support ISO strings, DD/MM/YYYY dates and default gracefully on empty', () => {
      // ISO Format
      const isoRes = parseOrderImportRow({
        _rowIndex: 2,
        'Khach hang': 'Cty A',
        'San pham': 'Vải A',
        SL: 100,
        Ngay: '2026-11-20T14:30:00.000Z',
      });
      expect(isoRes.success).toBe(true);
      if (isoRes.success) {
        expect(isoRes.data.orderDate).toBe('2026-11-20T14:30:00.000Z');
      }

      // DD/MM/YYYY Format
      const dmyRes = parseOrderImportRow({
        _rowIndex: 3,
        'Khach hang': 'Cty B',
        'San pham': 'Vải B',
        SL: 100,
        Ngay: '30/04/2026',
      });
      expect(dmyRes.success).toBe(true);
      if (dmyRes.success) {
        const parsed = new Date(dmyRes.data.orderDate);
        expect(parsed.getDate()).toBe(30);
        expect(parsed.getMonth()).toBe(3); // April is index 3
        expect(parsed.getFullYear()).toBe(2026);
      }

      // Empty Date -> defaults to valid current timestamp
      const emptyRes = parseOrderImportRow({
        _rowIndex: 4,
        'Khach hang': 'Cty C',
        'San pham': 'Vải C',
        SL: 100,
        Ngay: '',
      });
      expect(emptyRes.success).toBe(true);
      if (emptyRes.success) {
        expect(new Date(emptyRes.data.orderDate).getTime()).toBeGreaterThan(0);
      }

      // Completely invalid date string
      const invalidDateRes = parseOrderImportRow({
        _rowIndex: 5,
        'Khach hang': 'Cty D',
        'San pham': 'Vải D',
        SL: 100,
        Ngay: 'hom-nay-giao',
      });
      expect(invalidDateRes.success).toBe(false);
      if (!invalidDateRes.success) {
        expect(invalidDateRes.error).toBe(
          IMPORT_VALIDATION_MESSAGES.INVALID_DATE_FORMAT,
        );
      }
    });
  });

  describe('Scenario 4: Maker-Checker Security Boundary Guarantee', () => {
    it('should strictly create documents with status = draft to prevent bypassing RBAC/SoD approval', async () => {
      const createdDocuments: Record<string, unknown>[] = [];

      const dbGuard = await import('@/lib/db-guard');
      vi.spyOn(dbGuard, 'safeUpsert').mockImplementation(async (params) => {
        if (params.table === 'shipments') {
          createdDocuments.push(params.data as Record<string, unknown>);
        }
        return [{ id: 'mock-shipment-id' }] as unknown as ReturnType<
          typeof dbGuard.safeUpsert
        >;
      });

      const untyped = await import('@/services/supabase/untyped');
      vi.spyOn(untyped.untypedDb, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'cust-mc-1' } }),
      } as unknown as ReturnType<typeof untyped.untypedDb.from>);

      const mockAdapter: ISpreadsheetPort = {
        upsertRow: vi.fn(),
        batchUpsertRows: vi.fn(),
        readReadyRows: vi.fn().mockResolvedValue([
          {
            _rowIndex: 2,
            'Import ID': 'IMP-MC-001',
            Ngay: '2026-09-12',
            'Khach hang': 'Khách Test Maker Checker',
            'Ma VT': 'VT-MC-01',
            SL: 500,
            'Trang thai': 'READY',
          },
        ]),
        updateImportStatus: vi.fn(),
        testConnection: vi.fn().mockResolvedValue(true),
      };

      await processShipmentImports({
        adapter: mockAdapter,
        connectionId: 'conn-mc-1',
        spreadsheetId: 'sheet-mc-1',
      });

      expect(createdDocuments).toHaveLength(1);
      const doc = createdDocuments[0];
      // ARCHITECTURAL DIRECTIVE: Google Sheets NEVER bypasses RBAC/SoD
      expect(doc?.status).toBe('draft');
      expect(doc?.status).not.toBe('posted');
      expect(doc?.status).not.toBe('shipped');
      expect(doc?.status).not.toBe('confirmed');
    });
  });

  describe('Scenario 5: Multi-State Reconciliation & Self-Healing Guard (Phase 4)', () => {
    it('should detect and handle all 4 states concurrently: Up-to-date, Missing, Stale, and Orphan', async () => {
      const untyped = await import('@/services/supabase/untyped');
      const dbGuard = await import('@/lib/db-guard');

      const createdHealingJobs: Record<string, unknown>[] = [];
      vi.spyOn(dbGuard, 'safeUpsert').mockImplementation(async (params) => {
        if (params.table === 'integration_sync_jobs') {
          createdHealingJobs.push(params.data as Record<string, unknown>);
        }
        return [{ id: 'mock-job-id' }] as unknown as ReturnType<
          typeof dbGuard.safeUpsert
        >;
      });

      // ERP has 3 shipments:
      // 1. ship-1: version 1 (matches sheet -> UP TO DATE)
      // 2. ship-2: version 1 (not on sheet -> MISSING)
      // 3. ship-3: version 2 (sheet has version 1 -> STALE)
      vi.spyOn(untyped.untypedDb, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'ship-1',
              shipment_number: 'XK-01',
              version: 1,
              shipment_date: '2026-09-10',
            },
            {
              id: 'ship-2',
              shipment_number: 'XK-02',
              version: 1,
              shipment_date: '2026-09-11',
            },
            {
              id: 'ship-3',
              shipment_number: 'XK-03',
              version: 2,
              shipment_date: '2026-09-12',
            },
          ],
        }),
      } as unknown as ReturnType<typeof untyped.untypedDb.from>);

      // Sheet has:
      // - ship-1 (version 1)
      // - ship-3 (version 1 - older than ERP)
      // - ship-unauthorized-999 (not in ERP -> ORPHAN)
      const mockAdapter: ISpreadsheetPort = {
        upsertRow: vi.fn(),
        batchUpsertRows: vi.fn(),
        readReadyRows: vi.fn().mockResolvedValue([
          { 'ERP Record ID': 'ship-1', 'ERP Version': 1, 'Sync ID': 'sync-1' },
          { 'ERP Record ID': 'ship-3', 'ERP Version': 1, 'Sync ID': 'sync-3' },
          {
            'ERP Record ID': 'ship-unauthorized-999',
            'ERP Version': 1,
            'Sync ID': 'sync-999',
          },
        ]),
        updateImportStatus: vi.fn(),
        testConnection: vi.fn().mockResolvedValue(true),
      };

      const { summary, jobsCreated } = await reconcileShipments({
        adapter: mockAdapter,
        connectionId: 'conn-recon-e2e',
        spreadsheetId: 'sheet-recon-e2e',
      });

      // 1. Scanned: 3 shipments in ERP
      expect(summary.scanned).toBe(3);
      // 2. Missing Fixed: ship-2 was created
      expect(summary.missingFixed).toBe(1);
      // 3. Stale Updated: ship-3 was updated from version 1 to 2
      expect(summary.staleUpdated).toBe(1);
      // 4. Orphan Detected: ship-unauthorized-999 was detected and logged
      expect(summary.orphanDetected).toBe(1);
      // 5. Total healing jobs spawned = 1 (missing) + 1 (stale) = 2
      expect(jobsCreated).toBe(2);
      expect(createdHealingJobs).toHaveLength(2);

      const jobEntities = createdHealingJobs.map((j) => j.entity_id);
      expect(jobEntities).toContain('ship-2');
      expect(jobEntities).toContain('ship-3');
    });
  });

  describe('Scenario 6: Backoff Progression & Fault Tolerance Simulation', () => {
    it('should compute appropriate delay progression across 5 retry attempts', () => {
      const baseNow = 1700000000000;
      vi.spyOn(Date, 'now').mockReturnValue(baseNow);

      const delays = [0, 1, 2, 3, 4].map((attempt) => {
        const nextDate = calculateNextRetry(attempt);
        return nextDate.getTime() - baseNow;
      });

      // Expect progression: 30s, 60s, 120s, 240s, 480s
      expect(delays).toEqual([30_000, 60_000, 120_000, 240_000, 480_000]);
    });
  });
});
