import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchLoomsPaginated,
  fetchLoomOptions,
  fetchNextLoomCode,
  createLoom,
  updateLoom,
  deleteLoom,
} from '@/api/looms.api';
import type { LoomFormValues } from '@/schema/loom.schema';
import type { LoomWithSupplier, LoomFilter } from '@/features/looms/types';

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
    year_manufactured: values.year_manufactured ?? null,
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

export function useNextLoomCode() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'next-code'],
    queryFn: fetchNextLoomCode,
  });
}

export function useCreateLoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: LoomFormValues) => createLoom(toDbRow(values)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateLoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: LoomFormValues }) =>
      updateLoom(id, toDbRow(values)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteLoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteLoom,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
