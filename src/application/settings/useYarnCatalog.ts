import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

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
} from '@/domain/settings/yarn-catalog.types';
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
    category: values.category?.trim() || null,
    yarn_type: values.yarn_type?.trim() || null,
    denier: values.denier?.trim() || null,
    filament_count: values.filament_count?.trim() || null,
    finish: values.finish?.trim() || null,
    color_status: values.color_status?.trim() || null,
    count_ne: values.count_ne?.trim() || null,
    spinning_method: values.spinning_method?.trim() || null,
    twist_type: values.twist_type?.trim() || null,
    intermingle: values.intermingle?.trim() || null,
    certifications: values.certifications ?? [],
    is_fancy: values.is_fancy ?? false,
    fancy_details: values.fancy_details?.trim() || null,
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
  const [clientId, setClientId] = useState(() => crypto.randomUUID());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: YarnCatalogFormValues) => {
      const reqPayload = { id: clientId, ...toDbRow(values) };
      return createYarnCatalog(reqPayload);
    },
    onSuccess: () => {
      setClientId(crypto.randomUUID());
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
