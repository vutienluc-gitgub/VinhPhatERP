import { useQuery } from '@tanstack/react-query';

import { fetchCompanySettings } from '@/api/settings.api';
import type { CompanySettingsMap } from '@/schema/company-settings.schema';

/** Shared hook — dùng cho các component cần đọc cài đặt công ty (cross-feature) */
export function useCompanySettings() {
  return useQuery<CompanySettingsMap>({
    queryKey: ['company-settings'],
    queryFn: fetchCompanySettings,
    staleTime: 5 * 60 * 1000,
  });
}
