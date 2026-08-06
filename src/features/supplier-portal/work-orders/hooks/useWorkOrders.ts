import { useQuery } from '@tanstack/react-query';

import { fetchSupplierWorkOrders } from '@/api/supplier-work-orders.api';
export const WORK_ORDERS_QUERY_KEY = 'work_orders_list';

export function useWorkOrders(supplierId?: string) {
  return useQuery({
    queryKey: [WORK_ORDERS_QUERY_KEY, supplierId],
    queryFn: () => fetchSupplierWorkOrders(supplierId || ''),
    enabled: !!supplierId,
  });
}
