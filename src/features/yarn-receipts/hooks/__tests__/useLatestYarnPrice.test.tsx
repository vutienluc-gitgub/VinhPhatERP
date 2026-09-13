import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import * as api from '@/api/yarn-receipts.api';
import {
  useLatestYarnPrice,
  useSupplierOpenPOs,
  findPoItemPrice,
} from '@/features/yarn-receipts/hooks/useLatestYarnPrice';

describe('useLatestYarnPrice', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.restoreAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('fetches latest price for yarn catalog and supplier', async () => {
    vi.spyOn(api, 'fetchLatestYarnUnitPrice').mockResolvedValue({
      unitPrice: 88000,
      receiptNumber: 'NS-2026-09-005',
      receiptDate: '2026-09-10',
      isSupplierSpecific: true,
    });

    const { result } = renderHook(
      () =>
        useLatestYarnPrice({
          yarnCatalogId: 'catalog-1',
          supplierId: 'supp-1',
        }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.unitPrice).toBe(88000);
    expect(result.current.data?.receiptNumber).toBe('NS-2026-09-005');
    expect(result.current.data?.isSupplierSpecific).toBe(true);
  });

  it('fetches open purchase orders for the supplier', async () => {
    vi.spyOn(api, 'fetchOpenPurchaseOrdersForSupplier').mockResolvedValue([
      {
        id: 'po-1',
        poCode: 'PO-2026-001',
        orderDate: '2026-09-01',
        status: 'approved',
        items: [
          {
            materialId: 'catalog-1',
            unitPrice: 87500,
            orderedQty: 1000,
          },
        ],
      },
    ]);

    const { result } = renderHook(() => useSupplierOpenPOs('supp-1'), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]?.poCode).toBe('PO-2026-001');
  });

  it('correctly matches and retrieves PO item price by material ID', () => {
    const mockPo: api.OpenPurchaseOrderOption = {
      id: 'po-1',
      poCode: 'PO-2026-001',
      orderDate: '2026-09-01',
      status: 'approved',
      items: [
        {
          materialId: 'catalog-1',
          unitPrice: 89000,
          orderedQty: 500,
        },
        {
          materialId: 'catalog-2',
          unitPrice: 92000,
          orderedQty: 300,
        },
      ],
    };

    expect(findPoItemPrice(mockPo, 'catalog-1')).toBe(89000);
    expect(findPoItemPrice(mockPo, 'catalog-2')).toBe(92000);
    expect(findPoItemPrice(mockPo, 'catalog-nonexistent')).toBeNull();
    expect(findPoItemPrice(undefined, 'catalog-1')).toBeNull();
  });
});
