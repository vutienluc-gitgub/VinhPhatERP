import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchCompanySettings,
  upsertCompanySettings,
  upsertPartialSettings,
} from '@/api/settings.api';
import type {
  CompanySettingsFormValues,
  CompanySettingsMap,
} from '@/schema/company-settings.schema';

const QUERY_KEY = ['company-settings'] as const;

export function useCompanySettings() {
  return useQuery<CompanySettingsMap>({
    queryKey: QUERY_KEY,
    queryFn: fetchCompanySettings,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateCompanySettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CompanySettingsFormValues) =>
      upsertCompanySettings(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdatePartialSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entries: Record<string, string>) =>
      upsertPartialSettings(entries),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
