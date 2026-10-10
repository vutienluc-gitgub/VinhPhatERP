import { describe, expect, it, vi, beforeEach } from 'vitest';

import {
  fetchCustomersPaginated,
  fetchCustomerStats,
} from '@/api/customers.api';
import { fetchPurchaseOrdersPaginated } from '@/api/purchase-orders.api';
import { fetchInventoryAdjustmentsPaginated } from '@/api/inventory.api';

const mockQueryBuilder = {
  select: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
  then: vi.fn(),
};

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
          data: { user: { id: 'test-user-id' } },
        }),
      },
    },
  };
});

describe('Server-Side Pagination Module APIs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchCustomersPaginated', () => {
    it('calculates correct range offsets and builds paginated result', async () => {
      const mockRows = [
        {
          id: '11111111-1111-4111-a111-111111111111',
          code: 'KH01',
          name: 'Khach Hang 1',
          status: 'active',
          source: 'other',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '22222222-2222-4222-a222-222222222222',
          code: 'KH02',
          name: 'Khach Hang 2',
          status: 'active',
          source: 'other',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      // Setup then handler to resolve query
      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: mockRows, error: null, count: 42 }),
      );

      const result = await fetchCustomersPaginated({}, 2, 20);

      expect(mockQueryBuilder.range).toHaveBeenCalledWith(20, 39);
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(20);
      expect(result.total).toBe(42);
      expect(result.totalPages).toBe(3);
      expect(result.data).toHaveLength(2);
    });
  });

  describe('fetchCustomerStats', () => {
    it('retrieves active and total count via head queries', async () => {
      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ count: 15, error: null }),
      );

      const stats = await fetchCustomerStats();

      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*', {
        count: 'exact',
        head: true,
      });
      expect(stats.active).toBe(15);
      expect(stats.new).toBe(15);
    });
  });

  describe('fetchPurchaseOrdersPaginated', () => {
    it('queries v_po_detail_full with pagination', async () => {
      const mockPOs = [
        {
          id: 'po-1',
          po_code: 'PO-001',
          status: 'pending',
          total_amount: 1000,
        },
      ];

      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: mockPOs, error: null, count: 5 }),
      );

      const result = await fetchPurchaseOrdersPaginated(
        { status: 'pending' },
        1,
        10,
      );

      expect(mockQueryBuilder.range).toHaveBeenCalledWith(0, 9);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('status', 'pending');
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.total).toBe(5);
      expect(result.totalPages).toBe(1);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('fetchInventoryAdjustmentsPaginated', () => {
    it('queries inventory_adjustments with pagination', async () => {
      const mockAdjustments = [
        { id: 'adj-1', item_type: 'yarn', adjustment_qty: 10 },
      ];

      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: mockAdjustments, error: null, count: 12 }),
      );

      const result = await fetchInventoryAdjustmentsPaginated(1, 10);

      expect(mockQueryBuilder.range).toHaveBeenCalledWith(0, 9);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.total).toBe(12);
      expect(result.totalPages).toBe(2);
      expect(result.data).toHaveLength(1);
    });
  });
});
