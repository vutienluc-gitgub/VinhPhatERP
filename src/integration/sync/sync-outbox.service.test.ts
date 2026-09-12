import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  calculateNextRetry,
  handleShipmentSyncOutbound,
  handleOrderSyncOutbound,
} from '@/integration/sync/sync-outbox.service';
import type { SafeDomainEvent } from '@/domain/core/DomainEventBus';
import type {
  ShipmentShippedEvent,
  OrderConfirmedEvent,
} from '@/domain/events/app.events';

vi.mock('@/lib/db-guard', () => ({
  safeUpsert: vi.fn().mockResolvedValue({ id: 'mock-job-id' }),
}));

vi.mock('@/integration/sync/sync-id', () => ({
  generateDeterministicSyncId: vi
    .fn()
    .mockResolvedValue('deterministic-sha256-mock'),
}));

vi.mock('@/integration/integration.service', () => ({
  isEventHandled: vi.fn().mockResolvedValue(false),
  recordEventStart: vi.fn().mockResolvedValue(undefined),
  recordEventSuccess: vi.fn().mockResolvedValue(undefined),
  recordEventFailure: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/services/supabase/untyped', () => ({
  untypedDb: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'conn-uuid-123' } }),
    }),
  },
}));

describe('Sync Outbox Service Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateNextRetry', () => {
    it('should calculate exponential backoff accurately up to cap', () => {
      const baseNow = 1700000000000;
      vi.spyOn(Date, 'now').mockReturnValue(baseNow);

      const retry0 = calculateNextRetry(0);
      expect(retry0.getTime()).toBe(baseNow + 30_000); // 30s

      const retry1 = calculateNextRetry(1);
      expect(retry1.getTime()).toBe(baseNow + 60_000); // 60s

      const retry2 = calculateNextRetry(2);
      expect(retry2.getTime()).toBe(baseNow + 120_000); // 120s

      const retryHigh = calculateNextRetry(10);
      expect(retryHigh.getTime()).toBe(baseNow + 3_600_000); // capped at 1h
    });
  });

  describe('handleShipmentSyncOutbound', () => {
    it('should create an outbound sync job with deterministic sync_id', async () => {
      const { safeUpsert } = await import('@/lib/db-guard');
      const { recordEventSuccess } =
        await import('@/integration/integration.service');

      const event: SafeDomainEvent<ShipmentShippedEvent> = {
        eventId: 'evt-ship-001',
        eventName: 'ShipmentShippedEvent',
        timestamp: '2026-09-12T10:00:00Z',
        payload: {
          shipmentId: 'ship-uuid-1',
          shipmentNumber: 'XK-2026-01',
          orderId: 'ord-uuid-1',
          rollIds: ['roll-1', 'roll-2'],
          shippedAt: '2026-09-12T10:00:00Z',
        },
      };

      await handleShipmentSyncOutbound(event);

      expect(safeUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          table: 'integration_sync_jobs',
          conflictKey: 'sync_id',
          data: expect.objectContaining({
            connection_id: 'conn-uuid-123',
            provider: 'google_sheets',
            direction: 'outbound',
            entity_type: 'shipment',
            entity_id: 'ship-uuid-1',
            sync_id: 'deterministic-sha256-mock',
            version: 1,
            status: 'pending',
            payload: expect.objectContaining({
              shipmentNumber: 'XK-2026-01',
            }),
          }),
        }),
      );

      expect(recordEventSuccess).toHaveBeenCalledWith(
        'evt-ship-001',
        'ShipmentShippedEvent',
        expect.any(String),
        expect.objectContaining({ syncJobCreated: true }),
      );
    });

    it('should skip job creation if event is already handled', async () => {
      const { isEventHandled } =
        await import('@/integration/integration.service');
      const { safeUpsert } = await import('@/lib/db-guard');

      vi.mocked(isEventHandled).mockResolvedValueOnce(true);

      const event: SafeDomainEvent<ShipmentShippedEvent> = {
        eventId: 'evt-already-handled',
        eventName: 'ShipmentShippedEvent',
        timestamp: '2026-09-12T10:00:00Z',
        payload: {
          shipmentId: 'ship-1',
          shipmentNumber: 'XK-01',
          orderId: 'ord-1',
          rollIds: [],
          shippedAt: '2026-09-12',
        },
      };

      await handleShipmentSyncOutbound(event);
      expect(safeUpsert).not.toHaveBeenCalled();
    });

    it('should record skipped if no active Google Sheets connection exists', async () => {
      const { untypedDb } = await import('@/services/supabase/untyped');
      const { recordEventSuccess } =
        await import('@/integration/integration.service');
      const { safeUpsert } = await import('@/lib/db-guard');

      vi.mocked(untypedDb.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({ data: null }),
      } as unknown as ReturnType<typeof untypedDb.from>);

      const event: SafeDomainEvent<ShipmentShippedEvent> = {
        eventId: 'evt-no-conn',
        eventName: 'ShipmentShippedEvent',
        timestamp: '2026-09-12T10:00:00Z',
        payload: {
          shipmentId: 'ship-2',
          shipmentNumber: 'XK-02',
          orderId: 'ord-2',
          rollIds: [],
          shippedAt: '2026-09-12',
        },
      };

      await handleShipmentSyncOutbound(event);
      expect(safeUpsert).not.toHaveBeenCalled();
      expect(recordEventSuccess).toHaveBeenCalledWith(
        'evt-no-conn',
        'ShipmentShippedEvent',
        expect.any(String),
        expect.objectContaining({ skipped: true }),
      );
    });
  });

  describe('handleOrderSyncOutbound', () => {
    it('should create an outbound sync job for confirmed order', async () => {
      const { safeUpsert } = await import('@/lib/db-guard');
      const { recordEventSuccess } =
        await import('@/integration/integration.service');

      const event: SafeDomainEvent<OrderConfirmedEvent> = {
        eventId: 'evt-ord-001',
        eventName: 'OrderConfirmedEvent',
        timestamp: '2026-09-12T10:00:00Z',
        payload: {
          orderId: 'ord-uuid-99',
          orderNumber: 'DH-2026-99',
          customerId: 'cust-uuid-1',
          totalAmount: 50_000_000,
          confirmedAt: '2026-09-12T10:00:00Z',
        },
      };

      await handleOrderSyncOutbound(event);

      expect(safeUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          table: 'integration_sync_jobs',
          conflictKey: 'sync_id',
          data: expect.objectContaining({
            entity_type: 'order',
            entity_id: 'ord-uuid-99',
            payload: expect.objectContaining({
              orderNumber: 'DH-2026-99',
              totalAmount: 50_000_000,
            }),
          }),
        }),
      );

      expect(recordEventSuccess).toHaveBeenCalledWith(
        'evt-ord-001',
        'OrderConfirmedEvent',
        expect.any(String),
        expect.objectContaining({ syncJobCreated: true }),
      );
    });
  });
});
