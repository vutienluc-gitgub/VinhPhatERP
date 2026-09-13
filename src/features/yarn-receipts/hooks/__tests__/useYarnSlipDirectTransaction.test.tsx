import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import * as api from '@/api/yarn-receipts.api';
import type { YarnReceipt } from '@/domain/inventory/yarn-receipts.types';
import { useYarnSlipDirectTransaction } from '@/features/yarn-receipts/hooks/useYarnSlipDirectTransaction';
import { emptyYarnReceiptItem } from '@/schema/yarn-receipt.schema';

describe('useYarnSlipDirectTransaction', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.restoreAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const mockCreatedReceipt: YarnReceipt = {
    id: 'receipt-uuid-1',
    receipt_number: 'NS-2026-09-001',
    supplier_id: 'supplier-uuid-1',
    receipt_date: '2026-09-12',
    notes: 'Direct from AI',
    status: 'draft',
    total_amount: 50000000,
    paid_amount: 0,
    payment_status: 'unpaid',
    vehicle_info: null,
    additional_fees: [],
    created_by: 'user-1',
    tenant_id: 'tenant-1',
    created_at: '2026-09-12T10:00:00Z',
    updated_at: '2026-09-12T10:00:00Z',
  };

  it('successfully creates draft receipt', async () => {
    vi.spyOn(api, 'createYarnReceiptFull').mockResolvedValue(
      mockCreatedReceipt,
    );
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useYarnSlipDirectTransaction(), {
      wrapper,
    });

    let created: YarnReceipt | undefined;
    await act(async () => {
      created = await result.current.createDraftReceipt({
        supplierId: 'supplier-uuid-1',
        receiptNumber: 'PC-2026-09-001',
        receiptDate: '2026-09-12',
        items: [
          {
            ...emptyYarnReceiptItem,
            yarnType: 'PE 30/1',
            quantity: 500,
            unitPrice: 100000,
            unit: 'kg',
          },
        ],
      });
    });

    expect(created).toBeDefined();
    expect(created?.id).toBe('receipt-uuid-1');
    expect(created?.status).toBe('draft');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['yarn-receipts'] });
  });

  it('successfully executes atomic direct confirmation', async () => {
    vi.spyOn(api, 'createYarnReceiptFull').mockResolvedValue(
      mockCreatedReceipt,
    );
    const confirmSpy = vi
      .spyOn(api, 'confirmYarnReceipt')
      .mockResolvedValue(undefined);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useYarnSlipDirectTransaction(), {
      wrapper,
    });

    let confirmed: YarnReceipt | undefined;
    await act(async () => {
      confirmed = await result.current.confirmDirectReceipt({
        supplierId: 'supplier-uuid-1',
        receiptNumber: 'PC-2026-09-001',
        receiptDate: '2026-09-12',
        items: [
          {
            ...emptyYarnReceiptItem,
            yarnType: 'PE 30/1',
            quantity: 500,
            unitPrice: 100000,
            unit: 'kg',
          },
        ],
      });
    });

    expect(confirmed).toBeDefined();
    expect(confirmSpy).toHaveBeenCalledWith('receipt-uuid-1');
    expect(confirmed?.status).toBe('confirmed');
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['v_yarn_availability'],
    });
  });

  it('rejects creation when supplierId is missing', async () => {
    const { result } = renderHook(() => useYarnSlipDirectTransaction(), {
      wrapper,
    });

    await expect(
      result.current.createDraftReceipt({
        supplierId: '',
        items: [],
      }),
    ).rejects.toThrow();

    expect(result.current.error).toBeDefined();
  });
});
