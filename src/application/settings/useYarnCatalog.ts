import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchYarnCatalogPaginated,
  fetchYarnCatalogOptions,
  fetchNextYarnCatalogCode,
  createYarnCatalog,
  updateYarnCatalog,
  deleteYarnCatalog,
} from '@/api/yarn-catalog.api';
import type {
  YarnCatalog,
  YarnCatalogFilter,
} from '@/features/yarn-catalog/types';
import type { YarnCatalogFormValues } from '@/features/yarn-catalog/yarn-catalog.module';

const QUERY_KEY = ['yarn-catalog'] as const;

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
    lot_no: values.lot_no?.trim() || null,
    grade: values.grade?.trim() || null,
    unit: values.unit.trim(),
    notes: values.notes?.trim() || null,
    status: values.status,
  };
}

export function useYarnCatalogList(filters: YarnCatalogFilter = {}, page = 1) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters, page],
    queryFn: () => fetchYarnCatalogPaginated(filters, page),
  });
}

export function useYarnCatalogOptions() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'options'],
    queryFn: fetchYarnCatalogOptions,
  });
}

export function useNextYarnCatalogCode() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'next-code'],
    queryFn: fetchNextYarnCatalogCode,
  });
}

export function useCreateYarnCatalog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: YarnCatalogFormValues) =>
      createYarnCatalog(toDbRow(values)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateYarnCatalog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: YarnCatalogFormValues;
    }) => updateYarnCatalog(id, toDbRow(values)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteYarnCatalog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteYarnCatalog,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
