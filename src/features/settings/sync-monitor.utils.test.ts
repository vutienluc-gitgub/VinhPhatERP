import { describe, it, expect } from 'vitest';

import {
  getJobCode,
  getJobEntityLabel,
  formatDateTime,
  calculateTotalFailed,
} from '@/features/settings/sync-monitor.utils';
import { SYNC_MONITOR_LABELS } from '@/features/settings/sync-monitor.constants';
import type { SyncJobRow, SyncStats } from '@/api/sync.api';

describe('Sync Monitor Utils Unit Tests', () => {
  describe('getJobCode', () => {
    it('should return shipmentNumber when present in payload', () => {
      const job: SyncJobRow = {
        id: 'job-1',
        connection_id: 'conn-1',
        provider: 'google_sheets',
        direction: 'outbound',
        entity_type: 'shipment',
        entity_id: '12345678-abcd-1234-abcd-1234567890ab',
        sync_id: 'sync-1',
        version: 1,
        status: 'success',
        payload: {
          shipmentNumber: 'XK-2026-001',
          shippedAt: '2026-09-12T10:00:00Z',
        },
        attempt_count: 1,
        max_attempts: 5,
        next_retry_at: null,
        last_error: null,
        created_at: '2026-09-12T10:00:00Z',
        completed_at: '2026-09-12T10:01:00Z',
      };

      expect(getJobCode(job)).toBe('XK-2026-001');
    });

    it('should return orderNumber when present in payload', () => {
      const job: SyncJobRow = {
        id: 'job-2',
        connection_id: 'conn-1',
        provider: 'google_sheets',
        direction: 'outbound',
        entity_type: 'order',
        entity_id: '87654321-dcba-4321-dcba-ba0987654321',
        sync_id: 'sync-2',
        version: 1,
        status: 'pending',
        payload: {
          orderNumber: 'DH-2026-999',
        },
        attempt_count: 0,
        max_attempts: 5,
        next_retry_at: null,
        last_error: null,
        created_at: '2026-09-12T10:00:00Z',
        completed_at: null,
      };

      expect(getJobCode(job)).toBe('DH-2026-999');
    });

    it('should fallback to entity_id slice(0, 8) when payload is empty or has no code', () => {
      const job: SyncJobRow = {
        id: 'job-3',
        connection_id: 'conn-1',
        provider: 'google_sheets',
        direction: 'inbound',
        entity_type: 'custom_entity',
        entity_id: 'abcdef12-3456-7890-abcd-ef1234567890',
        sync_id: 'sync-3',
        version: 1,
        status: 'pending',
        payload: null,
        attempt_count: 0,
        max_attempts: 5,
        next_retry_at: null,
        last_error: null,
        created_at: '2026-09-12T10:00:00Z',
        completed_at: null,
      };

      expect(getJobCode(job)).toBe('abcdef12');
    });
  });

  describe('getJobEntityLabel', () => {
    it('should return shipment label for shipment entity', () => {
      expect(getJobEntityLabel('shipment')).toBe(
        SYNC_MONITOR_LABELS.ENTITY_SHIPMENT,
      );
    });

    it('should return order label for order entity', () => {
      expect(getJobEntityLabel('order')).toBe(SYNC_MONITOR_LABELS.ENTITY_ORDER);
    });

    it('should return raw entity type for unmapped entities', () => {
      expect(getJobEntityLabel('inventory_audit')).toBe('inventory_audit');
    });
  });

  describe('formatDateTime', () => {
    it('should return dash when isoString is null or empty', () => {
      expect(formatDateTime(null)).toBe('-');
      expect(formatDateTime('')).toBe('-');
    });

    it('should format valid ISO string in vi-VN date format', () => {
      const formatted = formatDateTime('2026-09-12T10:30:45Z');
      expect(formatted).toBeTruthy();
      expect(formatted).toContain('2026');
      expect(formatted).not.toBe('-');
    });
  });

  describe('calculateTotalFailed', () => {
    it('should return 0 when stats is null or undefined', () => {
      expect(calculateTotalFailed(null)).toBe(0);
      expect(calculateTotalFailed(undefined)).toBe(0);
    });

    it('should sum failed and deadLetter counts correctly', () => {
      const stats: SyncStats = {
        pending: 3,
        successToday: 15,
        failed: 4,
        deadLetter: 2,
      };

      expect(calculateTotalFailed(stats)).toBe(6);
    });
  });
});
