import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchCompanySettings, upsertCompanySettings } from '@/api/settings.api'
import type { CompanySettingsFormValues, CompanySettingsMap } from '@/schema/company-settings.schema'

const QUERY_KEY = ['company-settings'] as const

/* ── Read (all rows → flat map) ── */

export function useCompanySettings() {
  return useQuery<CompanySettingsMap>({
    queryKey: QUERY_KEY,
    queryFn: fetchCompanySettings,
    staleTime: 5 * 60 * 1000,
  })
}

/* ── Update (upsert all keys) ── */

export function useUpdateCompanySettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: CompanySettingsFormValues) => upsertCompanySettings(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
