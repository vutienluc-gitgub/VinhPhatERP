import { describe, expect, it, vi, beforeEach } from 'vitest';

import {
  submitPurchaseOrder,
  approvePurchaseOrder,
  sendPurchaseOrder,
  confirmPurchaseOrder,
  rejectPurchaseOrder,
} from '@/api/purchase-orders.api';
import { InvalidStateTransitionError } from '@/domain/core/errors';

const mockQueryBuilder = {
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  single: vi.fn(),
};

// Mock Supabase client
vi.mock('@/services/supabase/client', () => {
  return {
    untypedDb: {
      from: vi.fn(() => mockQueryBuilder),
      rpc: vi.fn(),
    },
    supabase: {
      from: vi.fn(() => mockQueryBuilder),
      rpc: vi.fn(),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
        }),
      },
    },
  };
});

// Mock db-guard to prevent external side effects
vi.mock('@/lib/db-guard', () => ({
  safeUpsert: vi.fn().mockResolvedValue([{ id: 'mock-audit-id' }]),
  safeUpsertOne: vi.fn().mockResolvedValue({ id: 'mock-audit-id' }),
}));

describe('Purchase Orders Concurrency & Atomic State Transitions', () => {
  const queryBuilder = mockQueryBuilder;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('submitPurchaseOrder', () => {
    it('successfully submits when in draft status', async () => {
      queryBuilder.single.mockResolvedValueOnce({
        data: {
          id: 'po-1',
          status: 'pending_approval',
          updated_at: '2026-08-17T10:00:00Z',
        },
        error: null,
      });

      const result = await submitPurchaseOrder({
        poId: 'po-1',
        userId: 'user-1',
        expectedUpdatedAt: '2026-08-17T09:00:00Z',
      });

      expect(queryBuilder.update).toHaveBeenCalledWith({
        status: 'pending_approval',
      });
      expect(queryBuilder.eq).toHaveBeenCalledWith('id', 'po-1');
      expect(queryBuilder.in).toHaveBeenCalledWith('status', [
        'draft',
        'request_changes',
      ]);
      expect(queryBuilder.eq).toHaveBeenCalledWith(
        'updated_at',
        '2026-08-17T09:00:00Z',
      );
      expect(result.status).toBe('pending_approval');
    });

    it('throws InvalidStateTransitionError when status has already changed (PGRST116 without expectedUpdatedAt)', async () => {
      queryBuilder.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      await expect(
        submitPurchaseOrder({
          poId: 'po-1',
          userId: 'user-1',
        }),
      ).rejects.toThrowError(InvalidStateTransitionError);
    });

    it('throws ConcurrencyConflictError when expectedUpdatedAt does not match', async () => {
      queryBuilder.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      await expect(
        submitPurchaseOrder({
          poId: 'po-1',
          userId: 'user-1',
          expectedUpdatedAt: '2026-08-17T08:00:00Z',
        }),
      ).rejects.toThrowError(InvalidStateTransitionError);
    });
  });

  describe('approvePurchaseOrder', () => {
    it('enforces status = pending_approval precondition on approval', async () => {
      queryBuilder.single.mockResolvedValueOnce({
        data: { id: 'po-1', status: 'approved' },
        error: null,
      });

      const result = await approvePurchaseOrder({
        poId: 'po-1',
        userId: 'mgr-1',
        comment: 'Duyệt đơn',
      });

      expect(queryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'approved',
          approved_by: 'mgr-1',
        }),
      );
      expect(queryBuilder.eq).toHaveBeenCalledWith(
        'status',
        'pending_approval',
      );
      expect(result.status).toBe('approved');
    });
  });

  describe('sendPurchaseOrder', () => {
    it('enforces status = approved precondition before sending to supplier', async () => {
      queryBuilder.single.mockResolvedValueOnce({
        data: { id: 'po-1', status: 'sent' },
        error: null,
      });

      const result = await sendPurchaseOrder({
        poId: 'po-1',
        userId: 'user-1',
      });

      expect(queryBuilder.update).toHaveBeenCalledWith({ status: 'sent' });
      expect(queryBuilder.eq).toHaveBeenCalledWith('status', 'approved');
      expect(result.status).toBe('sent');
    });
  });

  describe('confirmPurchaseOrder', () => {
    it('enforces status = sent precondition before supplier confirmation', async () => {
      queryBuilder.single.mockResolvedValueOnce({
        data: { id: 'po-1', status: 'supplier_confirmed' },
        error: null,
      });

      const result = await confirmPurchaseOrder({
        poId: 'po-1',
        userId: 'user-1',
      });

      expect(queryBuilder.eq).toHaveBeenCalledWith('status', 'sent');
      expect(result.status).toBe('supplier_confirmed');
    });
  });

  describe('rejectPurchaseOrder', () => {
    it('enforces status = pending_approval precondition when rejecting', async () => {
      queryBuilder.single.mockResolvedValueOnce({
        data: { id: 'po-1', status: 'rejected' },
        error: null,
      });

      const result = await rejectPurchaseOrder({
        poId: 'po-1',
        reason: 'Giá quá cao',
        userId: 'mgr-1',
      });

      expect(queryBuilder.eq).toHaveBeenCalledWith(
        'status',
        'pending_approval',
      );
      expect(result.status).toBe('rejected');
    });
  });
});
