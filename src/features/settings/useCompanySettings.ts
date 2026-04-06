import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/services/supabase/client'
import type {
  CompanySettingRow,
  CompanySettingsFormValues,
  CompanySettingsMap,
} from '@/schema/company-settings.schema'
import {
  rowsToSettingsMap,
  settingsMapToUpsertRows,
} from '@/schema/company-settings.schema'

const TABLE = 'company_settings'
const QUERY_KEY = ['company-settings'] as const

// supabase typed client doesn't know about company_settings yet (types not regenerated)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supa = supabase as any

/* ── Read (all rows → flat map) ── */

export function useCompanySettings() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<CompanySettingsMap> => {
      const { data, error } = await supa
        .from(TABLE)
        .select('*')
        .order('key')

      if (error) throw error
      return rowsToSettingsMap((data ?? []) as unknown as CompanySettingRow[])
    },
    staleTime: 5 * 60 * 1000,
  })
}

/* ── Update (upsert all keys) ── */

export function useUpdateCompanySettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: CompanySettingsFormValues) => {
      const rows = settingsMapToUpsertRows(values)

      for (const row of rows) {
        const { error } = await supa
          .from(TABLE)
          .update({ value: row.value })
          .eq('key', row.key)

        if (error) {
          const { error: insertErr } = await supa
            .from(TABLE)
            .insert({ key: row.key, value: row.value })

          if (insertErr) throw insertErr
        }
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
