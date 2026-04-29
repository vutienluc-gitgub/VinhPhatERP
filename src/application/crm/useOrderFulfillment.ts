/**
 * React Query hook cho Order Fulfillment Dashboard.
 */
import { useQuery } from '@tanstack/react-query';

import { fetchOrderFulfillment } from '@/api/order-fulfillment.api';

export function useOrderFulfillment() {
  return useQuery({
    queryKey: ['order_fulfillment'],
    queryFn: fetchOrderFulfillment,
    staleTime: 1000 * 60, // 1 phút
  });
}
