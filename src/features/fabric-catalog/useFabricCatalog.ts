import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchFabricCatalogPaginated,
  fetchFabricCatalogOptions,
  fetchNextFabricCatalogCode,
  createFabricCatalog,
  updateFabricCatalog,
  deleteFabricCatalog,
} from '@/api/fabric-catalog.api'
import type { FabricCatalogFormValues } from './fabric-catalog.module'
import type { FabricCatalog, FabricCatalogFilter } from './types'

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
    queryFn: () => fetchFabricCatalogPaginated(filters, page),
  })
}

/* ── All active catalogs (for picker in BOM form) ── */

export function useFabricCatalogOptions() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'options'],
    queryFn: fetchFabricCatalogOptions,
  })
}

/* ── Auto-generate code ── */

export function useNextFabricCatalogCode() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'next-code'],
    queryFn: fetchNextFabricCatalogCode,
  })
}

/* ── Create ── */

export function useCreateFabricCatalog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: FabricCatalogFormValues) => createFabricCatalog(toDbRow(values)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

/* ── Update ── */

export function useUpdateFabricCatalog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: FabricCatalogFormValues }) =>
      updateFabricCatalog(id, toDbRow(values)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

/* ── Delete ── */

export function useDeleteFabricCatalog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteFabricCatalog,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
