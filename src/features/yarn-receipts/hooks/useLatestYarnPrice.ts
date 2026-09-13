/**
 * Custom Hook: useLatestYarnPrice & useSupplierOpenPOs
 * Fetches latest confirmed unit price for a given yarn catalog item and
 * open purchase orders for the supplier.
 */

import { useQuery } from '@tanstack/react-query';

import {
  fetchLatestYarnUnitPrice,
  fetchOpenPurchaseOrdersForSupplier,
  type LatestYarnPriceResult,
  type OpenPurchaseOrderOption,
} from '@/api/yarn-receipts.api';

export interface UseLatestYarnPriceParams {
  yarnCatalogId?: string | null;
  supplierId?: string | null;
}

export function useLatestYarnPrice({
  yarnCatalogId,
  supplierId,
}: UseLatestYarnPriceParams) {
  return useQuery<LatestYarnPriceResult | null>({
    queryKey: ['yarn-latest-price', yarnCatalogId, supplierId],
    queryFn: () =>
      fetchLatestYarnUnitPrice({
        yarnCatalogId: yarnCatalogId || '',
        supplierId,
      }),
    enabled: Boolean(yarnCatalogId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSupplierOpenPOs(supplierId?: string | null) {
  return useQuery<OpenPurchaseOrderOption[]>({
    queryKey: ['supplier-open-pos', supplierId],
    queryFn: () => fetchOpenPurchaseOrdersForSupplier(supplierId || ''),
    enabled: Boolean(supplierId),
    staleTime: 2 * 60 * 1000,
  });
}

export function findPoItemPrice(
  po: OpenPurchaseOrderOption | undefined,
  yarnCatalogId?: string | null,
): number | null {
  if (!po || !yarnCatalogId) return null;
  const match = po.items.find((item) => item.materialId === yarnCatalogId);
  return match && match.unitPrice > 0 ? match.unitPrice : null;
}
