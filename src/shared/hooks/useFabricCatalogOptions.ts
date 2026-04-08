import { useQuery } from '@tanstack/react-query';

import { fetchFabricCatalogOptions } from '@/api/fabric-catalog.api';

/** Shared hook — dùng cho các form cần chọn loại vải (cross-feature) */
export function useFabricCatalogOptions() {
  return useQuery({
    queryKey: ['fabric-catalog', 'options'],
    queryFn: fetchFabricCatalogOptions,
  });
}
