import { useQuery } from '@tanstack/react-query';

import { fetchActiveShippingRates } from '@/api/shipping-rates.api';

// Re-export type for consumers — avoids cross-feature imports
export type { ShippingRate } from '@/features/shipping-rates/types';

/** Shared hook — dùng cho các form cần chọn bảng giá cước (cross-feature) */
export function useActiveShippingRates() {
  return useQuery({
    queryKey: ['shipping-rates', 'active'],
    queryFn: fetchActiveShippingRates,
  });
}
