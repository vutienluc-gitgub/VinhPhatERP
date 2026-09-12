import { describe, it, expect } from 'vitest';

import type {
  ISpreadsheetPort,
  SpreadsheetConfig,
} from '@/integration/ports/spreadsheet.port';
import {
  reconcileShipments,
  reconcileOrders,
  executeFullReconciliation,
} from '@/integration/sync/reconciliation.service';

// Mock ISpreadsheetPort
function createMockAdapter(
  existingSheetRows: Record<string, unknown>[],
): ISpreadsheetPort {
  return {
    upsertRow: async () => {},
    batchUpsertRows: async () => {},
    readReadyRows: async (_config: SpreadsheetConfig) => existingSheetRows,
    updateImportStatus: async () => {},
    testConnection: async () => true,
  };
}

describe('Reconciliation Engine (Phase 4)', () => {
  it('should scan and detect shipment reconciliation status with mock adapter', async () => {
    const mockAdapter = createMockAdapter([
      {
        'ERP Record ID': 'erp-ship-001',
        'ERP Version': 1,
        'Sync ID': 'hash-1',
      },
      {
        'ERP Record ID': 'erp-orphan-999',
        'ERP Version': 1,
        'Sync ID': 'hash-orphan',
      },
    ]);

    const context = {
      adapter: mockAdapter,
      connectionId: 'test-conn-123',
      spreadsheetId: 'sheet-456',
    };

    const res = await reconcileShipments(context);

    expect(res).toBeDefined();
    expect(res.summary).toHaveProperty('scanned');
    expect(res.summary).toHaveProperty('missingFixed');
    expect(res.summary).toHaveProperty('staleUpdated');
    expect(res.summary).toHaveProperty('orphanDetected');
  });

  it('should scan and detect order reconciliation status with mock adapter', async () => {
    const mockAdapter = createMockAdapter([
      {
        'ERP Record ID': 'erp-ord-001',
        'ERP Version': 1,
        'Sync ID': 'hash-ord-1',
      },
    ]);

    const context = {
      adapter: mockAdapter,
      connectionId: 'test-conn-123',
      spreadsheetId: 'sheet-456',
    };

    const res = await reconcileOrders(context);

    expect(res).toBeDefined();
    expect(res.summary).toHaveProperty('scanned');
    expect(res.summary).toHaveProperty('missingFixed');
    expect(res.summary).toHaveProperty('staleUpdated');
    expect(res.summary).toHaveProperty('orphanDetected');
  });

  it('should execute full reconciliation for both shipments and orders', async () => {
    const mockAdapter = createMockAdapter([]);
    const context = {
      adapter: mockAdapter,
      connectionId: 'test-conn-123',
      spreadsheetId: 'sheet-456',
    };

    const report = await executeFullReconciliation(context);

    expect(report.scannedAt).toBeDefined();
    expect(report.shipments).toBeDefined();
    expect(report.orders).toBeDefined();
    expect(report.totalJobsCreated).toBeGreaterThanOrEqual(0);
  });
});
