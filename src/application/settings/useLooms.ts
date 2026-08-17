import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import {
  fetchLoomsPaginated,
  fetchLoomOptions,
  fetchNextLoomCode,
  createLoom,
  updateLoom,
  deleteLoom,
} from '@/api/looms.api';
import type { LoomFormValues } from '@/schema/loom.schema';
import type {
  LoomWithSupplier,
  LoomFilter,
} from '@/domain/settings/looms.types';

export type { LoomWithSupplier, LoomFilter };

const QUERY_KEY = ['looms'] as const;

function toDbRow(values: LoomFormValues) {
  return {
    code: values.code.trim(),
    name: values.name.trim(),
    loom_type: values.loom_type,
    supplier_id: values.supplier_id,
    max_width_cm: values.max_width_cm ?? null,
    max_speed_rpm: values.max_speed_rpm ?? null,
    daily_capacity_m: values.daily_capacity_m ?? null,
    daily_capacity_kg: values.daily_capacity_kg ?? null,
    year_manufactured: values.year_manufactured ?? null,
    diameter_inch: values.diameter_inch ?? null,
    gauge: values.gauge ?? null,
    feeders: values.feeders ?? null,
    needles: values.needles ?? null,
    gsm_range: values.gsm_range?.trim() || null,
    yarn_support: values.yarn_support?.trim() || null,
    motor_power_kw: values.motor_power_kw ?? null,
    voltage: values.voltage?.trim() || null,
    weight_kg: values.weight_kg ?? null,
    status: values.status,
    notes: values.notes?.trim() || null,
  };
}

export function useLoomList(filters: LoomFilter = {}, page = 1) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters, page],
    queryFn: () => fetchLoomsPaginated(filters, page),
  });
}

export function useLoomOptions() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'options'],
    queryFn: fetchLoomOptions,
  });
}

export function useNextLoomCode(prefix?: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'next-code', prefix ?? 'LOOM'],
    queryFn: () => fetchNextLoomCode(prefix),
    enabled: !!prefix,
  });
}

export function useCreateLoom() {
  const [clientId, setClientId] = useState(() => crypto.randomUUID());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: LoomFormValues) => {
      const reqPayload = { id: clientId, ...toDbRow(values) };
      return createLoom(reqPayload);
    },
    onSuccess: () => {
      setClientId(crypto.randomUUID());
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateLoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
      expectedUpdatedAt,
    }: {
      id: string;
      values: LoomFormValues;
      expectedUpdatedAt?: string;
    }) => updateLoom(id, toDbRow(values), expectedUpdatedAt),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteLoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      params: { id: string; expectedUpdatedAt?: string } | string,
    ) => {
      const id = typeof params === 'string' ? params : params.id;
      const expectedUpdatedAt =
        typeof params === 'string' ? undefined : params.expectedUpdatedAt;
      return deleteLoom(id, expectedUpdatedAt);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
