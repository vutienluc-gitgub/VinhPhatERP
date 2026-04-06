import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchYarnCatalogPaginated,
  fetchYarnCatalogOptions,
  fetchNextYarnCatalogCode,
  createYarnCatalog,
  updateYarnCatalog,
  deleteYarnCatalog,
} from '@/api/yarn-catalog.api'
import type { YarnCatalogFormValues } from './yarn-catalog.module'
import type { YarnCatalog, YarnCatalogFilter } from './types'

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
    queryFn: () => fetchYarnCatalogPaginated(filters, page),
  })
}

/* ── All active catalogs (for picker in yarn receipt form) ── */

export function useYarnCatalogOptions() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'options'],
    queryFn: fetchYarnCatalogOptions,
  })
}

/* ── Auto-generate code ── */

export function useNextYarnCatalogCode() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'next-code'],
    queryFn: fetchNextYarnCatalogCode,
  })
}

/* ── Create ── */

export function useCreateYarnCatalog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: YarnCatalogFormValues) => createYarnCatalog(toDbRow(values)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

/* ── Update ── */

export function useUpdateYarnCatalog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: YarnCatalogFormValues }) =>
      updateYarnCatalog(id, toDbRow(values)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

/* ── Delete ── */

export function useDeleteYarnCatalog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteYarnCatalog,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
