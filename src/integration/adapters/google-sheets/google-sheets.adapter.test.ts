import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { GoogleSheetsAdapter } from '@/integration/adapters/google-sheets/google-sheets.adapter';
import type {
  SpreadsheetConfig,
  SheetRowData,
} from '@/integration/ports/spreadsheet.port';

vi.mock('@/integration/adapters/google-sheets/google-sheets.auth', () => ({
  getGoogleAccessToken: vi.fn().mockResolvedValue('mock-access-token-123'),
}));

describe('GoogleSheetsAdapter Unit Tests', () => {
  const mockConfig: SpreadsheetConfig = {
    spreadsheetId: 'test-spreadsheet-id',
    sheetTabName: 'ERP_REPORT_XUAT_KHO',
  };

  let adapter: GoogleSheetsAdapter;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    adapter = new GoogleSheetsAdapter(
      'sa@vinhphat-test.iam.gserviceaccount.com',
      'mock-private-key',
    );
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe('testConnection', () => {
    it('should return true when API returns valid response', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          range: 'ERP_REPORT_XUAT_KHO!A1',
          values: [['Ngay']],
        }),
      });

      const result = await adapter.testConnection(mockConfig);
      expect(result).toBe(true);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('values/ERP_REPORT_XUAT_KHO!A1'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-access-token-123',
          }),
        }),
      );
    });

    it('should return false when API returns error', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => 'Spreadsheet not found',
      });

      const result = await adapter.testConnection(mockConfig);
      expect(result).toBe(false);
    });
  });

  describe('readReadyRows', () => {
    it('should return empty array if sheet has fewer than 2 rows (only header or empty)', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ values: [['Header1', 'Header2']] }),
      });

      const rows = await adapter.readReadyRows(mockConfig);
      expect(rows).toEqual([]);
    });

    it('should filter rows having Trang thai = READY and attach _rowIndex', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          values: [
            ['Import ID', 'Khach hang', 'Trang thai', 'Loi'],
            ['IMP-001', 'Cong ty A', 'READY', ''],
            ['IMP-002', 'Cong ty B', 'DRAFT_CREATED', ''],
            ['IMP-003', 'Cong ty C', 'ready', ''],
            ['IMP-004', 'Cong ty D', 'INVALID', 'Loi'],
          ],
        }),
      });

      const rows = await adapter.readReadyRows(mockConfig);
      expect(rows).toHaveLength(2);
      expect(rows[0]).toMatchObject({
        _rowIndex: 2,
        'Import ID': 'IMP-001',
        'Khach hang': 'Cong ty A',
        'Trang thai': 'READY',
      });
      expect(rows[1]).toMatchObject({
        _rowIndex: 4,
        'Import ID': 'IMP-003',
        'Khach hang': 'Cong ty C',
        'Trang thai': 'ready',
      });
    });

    it('should return empty array if Trang thai column does not exist in headers', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          values: [
            ['Import ID', 'Khach hang', 'So luong'],
            ['IMP-001', 'Cong ty A', 100],
          ],
        }),
      });

      const rows = await adapter.readReadyRows(mockConfig);
      expect(rows).toEqual([]);
    });
  });

  describe('upsertRow', () => {
    it('should append new row when ERP Record ID is not present in existing rows', async () => {
      const mockFetch = vi
        .fn()
        // 1. readAllRows GET
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            values: [
              [
                'Ngay',
                'So CT',
                'Khach hang',
                'ERP Record ID',
                'ERP Version',
                'Sync ID',
              ],
              [
                '2026-09-10',
                'XK-001',
                'Cty Old',
                'rec-existing-1',
                1,
                'sync-old',
              ],
            ],
          }),
        })
        // 2. append POST
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ updates: { updatedRows: 1 } }),
        });

      globalThis.fetch = mockFetch;

      const newRow: SheetRowData = {
        values: ['2026-09-12', 'XK-002', 'Cty New'],
        erpRecordId: 'rec-new-2',
        erpVersion: 1,
        syncId: 'sync-new-2',
      };

      await adapter.upsertRow(mockConfig, newRow);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      const appendCall = mockFetch.mock.calls[1];
      expect(appendCall).toBeDefined();
      expect(appendCall?.[0]).toContain(':append');
      expect(appendCall?.[1]?.method).toBe('POST');
      const body = JSON.parse(String(appendCall?.[1]?.body));
      expect(body.values[0]).toEqual([
        '2026-09-12',
        'XK-002',
        'Cty New',
        'rec-new-2',
        1,
        'sync-new-2',
      ]);
    });

    it('should update existing row when ERP Record ID exists and version is strictly higher', async () => {
      const mockFetch = vi
        .fn()
        // 1. readAllRows GET (existing has version 1)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            values: [
              [
                'Ngay',
                'So CT',
                'Khach hang',
                'ERP Record ID',
                'ERP Version',
                'Sync ID',
              ],
              ['2026-09-10', 'XK-001', 'Cty Old', 'rec-001', 1, 'sync-old'],
            ],
          }),
        })
        // 2. update PUT on row 2
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ updatedRows: 1 }),
        });

      globalThis.fetch = mockFetch;

      const updatedRow: SheetRowData = {
        values: ['2026-09-12', 'XK-001', 'Cty Old Updated'],
        erpRecordId: 'rec-001',
        erpVersion: 2,
        syncId: 'sync-v2',
      };

      await adapter.upsertRow(mockConfig, updatedRow);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      const updateCall = mockFetch.mock.calls[1];
      expect(updateCall).toBeDefined();
      expect(updateCall?.[0]).toContain('values/ERP_REPORT_XUAT_KHO!A2');
      expect(updateCall?.[1]?.method).toBe('PUT');
      const body = JSON.parse(String(updateCall?.[1]?.body));
      expect(body.values[0][1]).toBe('XK-001');
      expect(body.values[0][4]).toBe(2);
    });

    it('should skip update (no-op) when existing version on Sheet is >= new version', async () => {
      const mockFetch = vi
        .fn()
        // readAllRows: row 2 already has version 2
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            values: [
              [
                'Ngay',
                'So CT',
                'Khach hang',
                'ERP Record ID',
                'ERP Version',
                'Sync ID',
              ],
              ['2026-09-10', 'XK-001', 'Cty Old', 'rec-001', 2, 'sync-v2'],
            ],
          }),
        });

      globalThis.fetch = mockFetch;

      const incomingRow: SheetRowData = {
        values: ['2026-09-10', 'XK-001', 'Cty Old'],
        erpRecordId: 'rec-001',
        erpVersion: 1, // lower or equal version
        syncId: 'sync-v1',
      };

      await adapter.upsertRow(mockConfig, incomingRow);

      // Only readAllRows was called, no PUT or POST was made
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateImportStatus', () => {
    it('should update status column and error column if message provided', async () => {
      const mockFetch = vi
        .fn()
        // readAllRows
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            values: [
              ['Import ID', 'Khach hang', 'Trang thai', 'Loi'],
              ['IMP-001', 'Cty A', 'VALIDATING', ''],
            ],
          }),
        })
        // PUT status (Col C, row 2)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ updatedCells: 1 }),
        })
        // PUT error (Col D, row 2)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ updatedCells: 1 }),
        });

      globalThis.fetch = mockFetch;

      await adapter.updateImportStatus(
        mockConfig,
        2,
        'INVALID',
        'Thiếu thông tin khách hàng',
      );

      expect(mockFetch).toHaveBeenCalledTimes(3);

      // Status cell call
      const statusCall = mockFetch.mock.calls[1];
      expect(statusCall).toBeDefined();
      expect(statusCall?.[0]).toContain('ERP_REPORT_XUAT_KHO!C2');
      const statusBody = JSON.parse(String(statusCall?.[1]?.body));
      expect(statusBody.values).toEqual([['INVALID']]);

      // Error cell call
      const errorCall = mockFetch.mock.calls[2];
      expect(errorCall).toBeDefined();
      expect(errorCall?.[0]).toContain('ERP_REPORT_XUAT_KHO!D2');
      const errorBody = JSON.parse(String(errorCall?.[1]?.body));
      expect(errorBody.values).toEqual([['Thiếu thông tin khách hàng']]);
    });
  });

  describe('batchUpsertRows', () => {
    it('should process rows sequentially', async () => {
      const upsertSpy = vi.spyOn(adapter, 'upsertRow').mockResolvedValue();

      const rows: SheetRowData[] = [
        { values: ['r1'], erpRecordId: 'id-1', erpVersion: 1, syncId: 's1' },
        { values: ['r2'], erpRecordId: 'id-2', erpVersion: 1, syncId: 's2' },
      ];

      await adapter.batchUpsertRows(mockConfig, rows);

      expect(upsertSpy).toHaveBeenCalledTimes(2);
      expect(upsertSpy).toHaveBeenNthCalledWith(1, mockConfig, rows[0]);
      expect(upsertSpy).toHaveBeenNthCalledWith(2, mockConfig, rows[1]);
    });
  });
});
