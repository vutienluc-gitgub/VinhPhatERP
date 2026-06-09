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
  return {
    category_id: values.category_id || null,
    code: values.code.trim(),
    name: values.name.trim(),
    composition: values.composition?.trim() || null,
    target_width_cm: values.target_width_cm ?? null,
    target_gsm: values.target_gsm ?? null,
    unit: values.unit.trim(),
    notes: values.notes?.trim() || null,
    status: values.status,
    image_url: values.image_url ?? null,
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
