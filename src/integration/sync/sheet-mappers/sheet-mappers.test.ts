import { describe, it, expect } from 'vitest';

import { mapShipmentToSheetRow } from '@/integration/sync/sheet-mappers/shipment.mapper';
import { mapOrderToSheetRow } from '@/integration/sync/sheet-mappers/order.mapper';
import { calculateNextRetry } from '@/integration/sync/sync-outbox.service';

describe('Sheet Mappers', () => {
  describe('mapShipmentToSheetRow', () => {
    it('should map full shipment payload to SheetRowData correctly', () => {
      const payload = {
        shipmentId: 'ship-001',
        shipmentNumber: 'XK-2026-001',
        orderId: 'ord-100',
        customerName: 'Công ty May Việt Tiến',
        materialCode: 'COTTON-40S',
        materialName: 'Vải Cotton 40s Trắng',
        unit: 'm',
        quantity: 500,
        invoiceNumber: 'HD-999',
        shippedAt: '2026-09-12T08:00:00Z',
      };

      const result = mapShipmentToSheetRow(payload, 1, 'sync-hash-123');

      expect(result.erpRecordId).toBe('ship-001');
      expect(result.erpVersion).toBe(1);
      expect(result.syncId).toBe('sync-hash-123');
      expect(result.values).toEqual([
        '2026-09-12T08:00:00Z',
        'XK-2026-001',
        'Công ty May Việt Tiến',
        'COTTON-40S',
        'Vải Cotton 40s Trắng',
        'm',
        500,
        'HD-999',
        'Posted',
      ]);
    });

    it('should handle missing optional fields with sensible defaults', () => {
      const minimalPayload = {
        shipmentId: 'ship-002',
        shipmentNumber: 'XK-2026-002',
        shippedAt: '2026-09-12T09:00:00Z',
      };

      const result = mapShipmentToSheetRow(minimalPayload, 2, 'sync-hash-456');

      expect(result.erpRecordId).toBe('ship-002');
      expect(result.erpVersion).toBe(2);
      expect(result.values[2]).toBe(''); // customerName
      expect(result.values[3]).toBe(''); // materialCode
      expect(result.values[4]).toBe(''); // materialName
      expect(result.values[5]).toBe('kg'); // default unit
      expect(result.values[6]).toBe(0); // default quantity
      expect(result.values[7]).toBe(''); // invoiceNumber
      expect(result.values[8]).toBe('Posted');
    });
  });

  describe('mapOrderToSheetRow', () => {
    it('should map full order payload to SheetRowData correctly', () => {
      const payload = {
        orderId: 'ord-001',
        orderNumber: 'DH-2026-001',
        customerName: 'Dệt may Phong Phú',
        productName: 'Vải Khaki 65/35',
        quantity: 1200,
        totalAmount: 180000000,
        status: 'Confirmed',
        confirmedAt: '2026-09-12T08:30:00Z',
      };

      const result = mapOrderToSheetRow(payload, 1, 'sync-order-hash-1');

      expect(result.erpRecordId).toBe('ord-001');
      expect(result.erpVersion).toBe(1);
      expect(result.syncId).toBe('sync-order-hash-1');
      expect(result.values).toEqual([
        '2026-09-12T08:30:00Z',
        'DH-2026-001',
        'Dệt may Phong Phú',
        'Vải Khaki 65/35',
        1200,
        180000000,
        'Confirmed',
      ]);
    });

    it('should handle missing optional fields in order payload', () => {
      const minimalPayload = {
        orderId: 'ord-002',
        orderNumber: 'DH-2026-002',
      };

      const result = mapOrderToSheetRow(minimalPayload, 1, 'sync-order-hash-2');

      expect(result.values[0]).toBe(''); // confirmedAt
      expect(result.values[1]).toBe('DH-2026-002');
      expect(result.values[2]).toBe(''); // customerName
      expect(result.values[3]).toBe(''); // productName
      expect(result.values[4]).toBe(0); // quantity
      expect(result.values[5]).toBe(0); // totalAmount
      expect(result.values[6]).toBe('Confirmed'); // default status
    });
  });

  describe('calculateNextRetry', () => {
    it('should calculate exponential backoff with 30s base delay', () => {
      const now = Date.now();
      const retry0 = calculateNextRetry(0);
      const retry1 = calculateNextRetry(1);
      const retry2 = calculateNextRetry(2);

      // Attempt 0: now + 30s (±1s margin)
      expect(retry0.getTime() - now).toBeGreaterThanOrEqual(29_000);
      expect(retry0.getTime() - now).toBeLessThanOrEqual(31_000);

      // Attempt 1: now + 60s
      expect(retry1.getTime() - now).toBeGreaterThanOrEqual(59_000);
      expect(retry1.getTime() - now).toBeLessThanOrEqual(61_000);

      // Attempt 2: now + 120s
      expect(retry2.getTime() - now).toBeGreaterThanOrEqual(119_000);
      expect(retry2.getTime() - now).toBeLessThanOrEqual(121_000);
    });

    it('should cap delay at 1 hour for high attempt counts', () => {
      const now = Date.now();
      const retryHigh = calculateNextRetry(20);

      // Max cap is 1 hour (3,600,000 ms)
      const diff = retryHigh.getTime() - now;
      expect(diff).toBeLessThanOrEqual(3_601_000);
      expect(diff).toBeGreaterThanOrEqual(3_599_000);
    });
  });
});
