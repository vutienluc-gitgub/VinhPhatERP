import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/services/supabase/client'
import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination'
import type { PaginatedResult } from '@/shared/types/pagination'
import type { FabricCatalogFormValues } from './fabric-catalog.module'
import type { FabricCatalog, FabricCatalogFilter } from './types'

const TABLE = 'fabric_catalogs'
const QUERY_KEY = ['fabric-catalog'] as const

function toDbRow(
  values: FabricCatalogFormValues,
): Omit<FabricCatalog, 'id' | 'created_at' | 'updated_at'> {
  return {
    code: values.code.trim(),
    name: values.name.trim(),
    composition: values.composition?.trim() || null,
    unit: values.unit.trim(),
    notes: values.notes?.trim() || null,
    status: values.status,
  }
}

/* ── List with pagination + filters ── */

export function useFabricCatalogList(filters: FabricCatalogFilter = {}, page = 1) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters, page],
    queryFn: async (): Promise<PaginatedResult<FabricCatalog>> => {
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
        data: (data ?? []) as FabricCatalog[],
        total,
        page,
        pageSize: DEFAULT_PAGE_SIZE,
        totalPages: Math.ceil(total / DEFAULT_PAGE_SIZE),
      }
    },
  })
}

/* ── All active catalogs (for picker in BOM form) ── */

export function useFabricCatalogOptions() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('id, code, name, composition, unit')
        .eq('status', 'active')
        .order('name')
      if (error) throw error
      return (data ?? []) as Pick<FabricCatalog, 'id' | 'code' | 'name' | 'composition' | 'unit'>[]
    },
  })
}

/* ── Auto-generate code ── */

export function useNextFabricCatalogCode() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'next-code'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('code')
        .ilike('code', 'FC-%')
        .order('code', { ascending: false })
        .limit(1)

      if (error) throw error
      if (!data || data.length === 0) return 'FC-001'

      const last = data[0]?.code ?? 'FC-000'
      const match = last.match(/^FC-(\d+)$/)
      if (!match) return 'FC-001'
      const nextNum = parseInt(match[1]!, 10) + 1
      return `FC-${String(nextNum).padStart(3, '0')}`
    },
  })
}

/* ── Create ── */

export function useCreateFabricCatalog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: FabricCatalogFormValues) => {
      const { data, error } = await supabase
        .from(TABLE)
        .insert([toDbRow(values)])
        .select()
        .single()
      if (error) throw error
      return data as FabricCatalog
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

/* ── Update ── */

export function useUpdateFabricCatalog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: FabricCatalogFormValues }) => {
      const { data, error } = await supabase
        .from(TABLE)
        .update(toDbRow(values))
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as FabricCatalog
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

/* ── Delete ── */

export function useDeleteFabricCatalog() {
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
