import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchFabricCatalogsForBom,
  fetchYarnCatalogsForBom,
  fetchBomList,
  fetchBomById,
  fetchBomVersions,
  createBomDraft,
  updateBomDraft,
  approveBom,
  deprecateBom,
  reviseBom,
} from '@/api/bom.api'
import type { BomTemplate, BomVersion, BomFilter, FabricCatalog } from './types'
import type { BomTemplateFormData } from './bom.module'

// Query keys
export const bomKeys = {
  all: ['bom'] as const,
  lists: () => [...bomKeys.all, 'list'] as const,
  list: (filters: BomFilter) => [...bomKeys.lists(), filters] as const,
  details: () => [...bomKeys.all, 'detail'] as const,
  detail: (id: string) => [...bomKeys.details(), id] as const,
  versions: (id: string) => [...bomKeys.all, 'versions', id] as const,
  fabricCatalogs: () => ['fabric_catalogs'] as const,
  yarnCatalogs: () => ['yarn_catalogs'] as const,
}

// ---------------------------------------------------------
// Queries
// ---------------------------------------------------------

export function useFabricCatalogs() {
  return useQuery<FabricCatalog[]>({
    queryKey: ['fabric-catalog', 'options'],
    queryFn: fetchFabricCatalogsForBom,
  })
}

export function useYarnCatalogs() {
  return useQuery({
    queryKey: bomKeys.yarnCatalogs(),
    queryFn: fetchYarnCatalogsForBom,
  })
}

export function useBomList(filters: BomFilter) {
  return useQuery<BomTemplate[]>({
    queryKey: bomKeys.list(filters),
    queryFn: () => fetchBomList(filters),
  })
}

export function useBomDetail(id: string | null) {
  return useQuery<BomTemplate>({
    queryKey: bomKeys.detail(id!),
    enabled: !!id,
    queryFn: () => fetchBomById(id!),
  })
}

export function useBomVersions(templateId: string | null) {
  return useQuery<BomVersion[]>({
    queryKey: bomKeys.versions(templateId!),
    enabled: !!templateId,
    queryFn: () => fetchBomVersions(templateId!),
  })
}

// ---------------------------------------------------------
// Task-Based Mutations
// ---------------------------------------------------------

export function useDraftBom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: BomTemplateFormData) => createBomDraft(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bomKeys.all })
    },
  })
}

export function useUpdateDraftBom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BomTemplateFormData }) =>
      updateBomDraft(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: bomKeys.all })
      queryClient.invalidateQueries({ queryKey: bomKeys.detail(variables.id) })
    },
  })
}

export function useApproveBom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      approveBom(id, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: bomKeys.all })
      queryClient.invalidateQueries({ queryKey: bomKeys.detail(variables.id) })
    },
  })
}

export function useDeprecateBom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      deprecateBom(id, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: bomKeys.all })
      queryClient.invalidateQueries({ queryKey: bomKeys.detail(variables.id) })
    },
  })
}

export function useReviseBom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      reviseBom(id, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: bomKeys.all })
      queryClient.invalidateQueries({ queryKey: bomKeys.detail(variables.id) })
    },
  })
}
