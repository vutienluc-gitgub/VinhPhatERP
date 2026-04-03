import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/services/supabase/client'
import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination'
import type { PaginatedResult } from '@/shared/types/pagination'
import type { YarnCatalogFormValues } from './yarn-catalog.module'
import type { YarnCatalog, YarnCatalogFilter } from './types'

const TABLE = 'yarn_catalogs'
const QUERY_KEY = ['yarn-catalog'] as const

function toDbRow(
  values: YarnCatalogFormValues,
): Omit<YarnCatalog, 'id' | 'created_at' | 'updated_at'> {
  return {
    code: values.code.trim(),
    name: values.name.trim(),
    composition: values.composition?.trim() || null,
    color_name: values.color_name?.trim() || null,
    tensile_strength: values.tensile_strength?.trim() || null,
    origin: values.origin?.trim() || null,
    unit: values.unit.trim(),
    notes: values.notes?.trim() || null,
    status: values.status,
  }
}

/* ── List with pagination + filters ── */

export function useYarnCatalogList(filters: YarnCatalogFilter = {}, page = 1) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters, page],
    queryFn: async (): Promise<PaginatedResult<YarnCatalog>> => {
      const from = (page - 1) * DEFAULT_PAGE_SIZE
      const to = from + DEFAULT_PAGE_SIZE - 1

      let query = supabase
        .from(TABLE)
        .select('*', { count: 'exact' })
        .order('name', { ascending: true })
        .range(from, to)

      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.search?.trim()) {
        const q = filters.search.trim()
        query = query.or(`name.ilike.%${q}%,code.ilike.%${q}%,composition.ilike.%${q}%`)
      }

      const { data, error, count } = await query
      if (error) throw error
      const total = count ?? 0
      return {
        data: (data ?? []) as YarnCatalog[],
        total,
        page,
        pageSize: DEFAULT_PAGE_SIZE,
        totalPages: Math.ceil(total / DEFAULT_PAGE_SIZE),
      }
    },
  })
}

/* ── All active catalogs (for picker in yarn receipt form) ── */

export function useYarnCatalogOptions() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('id, code, name, composition, color_name, tensile_strength, origin, unit')
        .eq('status', 'active')
        .order('name')
      if (error) throw error
      return (data ?? []) as Pick<
        YarnCatalog,
        'id' | 'code' | 'name' | 'composition' | 'color_name' | 'tensile_strength' | 'origin' | 'unit'
      >[]
    },
  })
}

/* ── Auto-generate code ── */

export function useNextYarnCatalogCode() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'next-code'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('code')
        .ilike('code', 'YS-%')
        .order('code', { ascending: false })
        .limit(1)

      if (error) throw error
      if (!data || data.length === 0) return 'YS-001'

      const last = data[0]?.code ?? 'YS-000'
      const match = last.match(/^YS-(\d+)$/)
      if (!match) return 'YS-001'
      const nextNum = parseInt(match[1]!, 10) + 1
      return `YS-${String(nextNum).padStart(3, '0')}`
    },
  })
}

/* ── Create ── */

export function useCreateYarnCatalog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: YarnCatalogFormValues) => {
      const { data, error } = await supabase
        .from(TABLE)
        .insert([toDbRow(values)])
        .select()
        .single()
      if (error) throw error
      return data as YarnCatalog
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

/* ── Update ── */

export function useUpdateYarnCatalog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: YarnCatalogFormValues }) => {
      const { data, error } = await supabase
        .from(TABLE)
        .update(toDbRow(values))
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as YarnCatalog
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

/* ── Delete ── */

export function useDeleteYarnCatalog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(TABLE).delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
