import { useQuery } from '@tanstack/react-query';

import { fetchYarnCatalogOptions } from '@/api/yarn-catalog.api';

/** Shared hook — dùng cho các form cần chọn loại sợi (cross-feature) */
export function useYarnCatalogOptions() {
  return useQuery({
    queryKey: ['yarn-catalog', 'options'],
    queryFn: fetchYarnCatalogOptions,
  });
}
