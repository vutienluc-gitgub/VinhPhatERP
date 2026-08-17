import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import {
  fetchFinishedFabricPaginated,
  createFinishedFabric,
  updateFinishedFabric,
  deleteFinishedFabric,
  fetchRawRollOptions,
  fetchRawRollsByLot,
  createFinishedFabricBulk,
  fetchFinishedFabricStats,
  fetchTraceChain,
} from '@/api/finished-fabric.api';
import type { InventoryStats } from '@/api/finished-fabric.api';
import {
  mapFinishedFabricFormToDb,
  findDuplicateRollNumbers,
} from '@/domain/inventory/InventoryDomain';
import type {
  FinishedFabricFormValues,
  BulkFinishedInputFormValues,
} from '@/features/finished-fabric/finished-fabric.module';
import type {
  FinishedFabricFilter,
  RawRollOption,
} from '@/domain/inventory/finished-fabric.types';

// InventoryStats exported via useInventory.ts to avoid ambiguity

/* ── Trace chain types (re-export from API) ── */
export type {
  TraceChainData,
  TraceRawRoll,
  TraceYarnReceipt,
} from '@/api/finished-fabric.api';

const QUERY_KEY = ['finished-fabric'] as const;

export function useFinishedFabricList(
  filters: FinishedFabricFilter = {},
  page = 1,
) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters, page],
    queryFn: () => fetchFinishedFabricPaginated(filters, page),
  });
}

export function useCreateFinishedFabric() {
  const [clientId, setClientId] = useState(() => crypto.randomUUID());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: FinishedFabricFormValues) => {
      const reqPayload = { id: clientId, ...mapFinishedFabricFormToDb(values) };
      return createFinishedFabric(reqPayload);
    },
    onSuccess: () => {
      setClientId(crypto.randomUUID());
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateFinishedFabric() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: FinishedFabricFormValues;
    }) => updateFinishedFabric(id, mapFinishedFabricFormToDb(values)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteFinishedFabric() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      params: { id: string; expectedUpdatedAt?: string } | string,
    ) => {
      const id = typeof params === 'string' ? params : params.id;
      const expectedUpdatedAt =
        typeof params === 'string' ? undefined : params.expectedUpdatedAt;
      return deleteFinishedFabric(id, expectedUpdatedAt);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useRawRollOptions() {
  return useQuery<RawRollOption[]>({
    queryKey: ['raw-fabric', 'options'],
    queryFn: fetchRawRollOptions,
  });
}

export function useRawRollsByLot(lotNumber: string) {
  return useQuery<RawRollOption[]>({
    queryKey: ['raw-fabric', 'by-lot', lotNumber],
    enabled: lotNumber.trim().length > 0,
    queryFn: () => fetchRawRollsByLot(lotNumber),
  });
}

export function useCreateFinishedFabricBulk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: BulkFinishedInputFormValues) => {
      const duplicates = findDuplicateRollNumbers(values.rolls);
      if (duplicates.length > 0) {
        throw new Error(
          `Mã cuộn bị trùng trong lô nhập: ${duplicates.join(', ')}`,
        );
      }

      const rows = values.rolls.map((row) => ({
        roll_number: row.roll_number.trim(),
        raw_roll_id: row.raw_roll_id?.trim() || null,
        fabric_type: values.fabric_type,
        color_name: values.color_name?.trim() || null,
        color_code: values.color_code?.trim() || null,
        width_cm: values.width_cm ?? null,
        length_m: row.length_m ?? null,
        weight_kg: row.weight_kg ?? null,
        quality_grade: row.quality_grade ?? values.quality_grade ?? null,
        status: values.status,
        warehouse_location: values.warehouse_location?.trim() || null,
        production_date: values.production_date?.trim() || null,
        notes: row.notes?.trim() || null,
        reserved_for_order_id: null,
        supplier_id:
          values.source_type === 'purchased'
            ? values.supplier_id || null
            : null,
        purchase_price:
          values.source_type === 'purchased'
            ? values.purchase_price || null
            : null,
      }));

      return createFinishedFabricBulk(rows, values.lot_number);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useFinishedFabricStats() {
  return useQuery<InventoryStats>({
    queryKey: [...QUERY_KEY, 'stats'],
    queryFn: fetchFinishedFabricStats,
  });
}

export function useTraceChain(rawRollId: string | null) {
  return useQuery({
    queryKey: ['trace-chain', rawRollId],
    enabled: !!rawRollId,
    queryFn: () => fetchTraceChain(rawRollId!),
  });
}
