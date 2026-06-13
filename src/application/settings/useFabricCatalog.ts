import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import {
  fetchFabricCatalogPaginated,
  fetchFabricCatalogOptions,
  fetchNextFabricCatalogCode,
  createFabricCatalog,
  updateFabricCatalog,
  deleteFabricCatalog,
  fetchFabricCategories,
  fetchFabricCatalogByIdOrCode,
  fetchPublicFabricBySlug,
} from '@/api/fabric-catalog.api';
import type { FabricCatalogFormValues } from '@/features/fabric-catalog/fabric-catalog.module';
import type {
  FabricCatalog,
  FabricCatalogFilter,
} from '@/domain/settings/fabric-catalog.types';

const QUERY_KEY = ['fabric-catalog'] as const;

function toDbRow(
  values: FabricCatalogFormValues,
): Omit<FabricCatalog, 'id' | 'created_at' | 'updated_at'> {
  const base = {
    category_id: values.category_id || null,
    code: values.code.trim(),
    name: values.name.trim(),
    composition: values.composition?.trim() || null,
    composition_tags: values.composition_tags ?? [],
    target_width_cm: values.target_width_cm ?? null,
    target_gsm: values.target_gsm ?? null,
    unit: values.unit.trim(),
    notes: values.notes?.trim() || null,
    status: values.status,
    image_url: values.image_url ?? null,
    specifications: values.specifications ?? null,
    is_public: values.is_public,
    slug:
      values.slug || values.code.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase(),
    color: values.color ?? null,
    color_tags: values.color_tags ?? [],
    technique: values.technique ?? null,
  };

  if (values.fabric_type === 'woven') {
    return {
      ...base,
      fabric_type: 'woven',
      warp_count: values.warp_count?.trim() || null,
      weft_count: values.weft_count?.trim() || null,
      epi: values.epi ?? null,
      ppi: values.ppi ?? null,
      weave_pattern: values.weave_pattern?.trim() || null,
      gauge: null,
      diameter: null,
      machine_type: null,
      needle_count: null,
    };
  }

  return {
    ...base,
    fabric_type: 'knitted',
    gauge: values.gauge ?? null,
    diameter: values.diameter ?? null,
    machine_type: values.machine_type?.trim() || null,
    needle_count: values.needle_count ?? null,
    warp_count: null,
    weft_count: null,
    epi: null,
    ppi: null,
    weave_pattern: null,
  };
}

export function useFabricCatalogList(
  filters: FabricCatalogFilter = {},
  page = 1,
) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters, page],
    queryFn: () => fetchFabricCatalogPaginated(filters, page),
  });
}

export function useFabricCatalogOptions() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'options'],
    queryFn: fetchFabricCatalogOptions,
  });
}

export function useNextFabricCatalogCode() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'next-code'],
    queryFn: fetchNextFabricCatalogCode,
  });
}

export function useCreateFabricCatalog() {
  const [clientId, setClientId] = useState(() => crypto.randomUUID());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: FabricCatalogFormValues) => {
      const reqPayload = { id: clientId, ...toDbRow(values) };
      return createFabricCatalog(reqPayload);
    },
    onSuccess: () => {
      setClientId(crypto.randomUUID());
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateFabricCatalog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: FabricCatalogFormValues;
    }) => updateFabricCatalog(id, toDbRow(values)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteFabricCatalog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteFabricCatalog,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useFabricCategories() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'categories'],
    queryFn: fetchFabricCategories,
  });
}

export function useFabricCatalogDetail(identifier: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'detail', identifier],
    queryFn: () => {
      if (!identifier) return Promise.reject(new Error('Missing identifier'));
      return fetchFabricCatalogByIdOrCode(identifier);
    },
    enabled: !!identifier,
  });
}

export function usePublicFabricBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'public', slug],
    queryFn: () => {
      if (!slug) return Promise.reject(new Error('Missing slug'));
      return fetchPublicFabricBySlug(slug);
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}
