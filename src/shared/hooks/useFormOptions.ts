/**
 * Shared hooks for cross-feature form options.
 * These wrap API calls directly to avoid cross-feature imports in feature components.
 */
import { useQuery } from '@tanstack/react-query';

import { fetchBomList } from '@/api/bom.api';
import { fetchOrdersPaginated } from '@/api/orders.api';
import { fetchSuppliersPaginated } from '@/api/suppliers.api';
import type { BomFilter } from '@/features/bom/types';
import type { OrdersFilter } from '@/models';
import type { SupplierFilter } from '@/api/suppliers.api';

/** BOM list — dùng cho WorkOrderForm */
export function useBomList(filters: BomFilter = {}) {
  return useQuery({
    queryKey: ['bom', 'list', filters],
    queryFn: () => fetchBomList(filters),
  });
}

/** Order list — dùng cho WorkOrderForm */
export function useOrderList(filters: OrdersFilter = {}, page = 1) {
  return useQuery({
    queryKey: ['orders', filters, page],
    queryFn: () => fetchOrdersPaginated(filters, page),
  });
}

/** Suppliers list — dùng cho WorkOrderForm */
export function useSuppliersList(filters: SupplierFilter = {}, page = 1) {
  return useQuery({
    queryKey: ['suppliers', filters, page],
    queryFn: () => fetchSuppliersPaginated(filters, page),
  });
}
