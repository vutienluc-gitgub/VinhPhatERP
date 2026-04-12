import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchRawFabricPaginated,
  fetchRawFabricAll,
  createRawFabric,
  updateRawFabric,
  deleteRawFabric,
  createRawFabricBulk,
  fetchWeavingPartners,
  fetchYarnReceiptOptions,
  fetchWorkOrderOptions,
  fetchRawFabricStats,
} from '@/api/raw-fabric.api';
import type {
  SupplierOption,
  YarnReceiptOption,
  WorkOrderOption,
  InventoryStats,
} from '@/api/raw-fabric.api';
import {
  mapRawFabricFormToDb,
  mapRawFabricBulkToDb,
  findDuplicateRollNumbers,
} from '@/domain/inventory/InventoryDomain';
import type { BulkInputFormValues } from '@/features/raw-fabric/raw-fabric.module';
import type { RawFabricFormValues } from '@/features/raw-fabric/raw-fabric.module';
import type { RawFabricFilter } from '@/features/raw-fabric/types';

export type { SupplierOption, YarnReceiptOption, WorkOrderOption };

const QUERY_KEY = ['raw-fabric'] as const;

export function useRawFabricList(filters: RawFabricFilter = {}, page = 1) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters, page],
    queryFn: () => fetchRawFabricPaginated(filters, page),
  });
}

/** Fetch toàn bộ theo filter — dùng cho export */
export function useRawFabricAll(filters: RawFabricFilter = {}) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'all', filters],
    queryFn: () => fetchRawFabricAll(filters),
    enabled: false, // chỉ fetch khi gọi refetch() thủ công
  });
}

/** Fetch các cuộn đang có sẵn trong kho */
export function useAvailableRawRolls() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'available'],
    queryFn: () => fetchRawFabricAll({ status: 'in_stock' }),
  });
}

export function useCreateRawFabric() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: RawFabricFormValues) =>
      createRawFabric(mapRawFabricFormToDb(values)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateRawFabric() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: RawFabricFormValues }) =>
      updateRawFabric(id, mapRawFabricFormToDb(values)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteRawFabric() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRawFabric,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

/** Nhap hang loat cuon vai moc */
export function useCreateRawFabricBulk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: BulkInputFormValues) => {
      const duplicateRollNumbers = findDuplicateRollNumbers(values.rolls);
      if (duplicateRollNumbers.length > 0) {
        throw new Error(
          `Ma cuon bi trung trong lo nhap: ${duplicateRollNumbers.join(', ')}`,
        );
      }

      const rows = mapRawFabricBulkToDb(values, values.rolls);
      return createRawFabricBulk(rows);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useWeavingPartners() {
  return useQuery({
    queryKey: ['suppliers', 'weaving'],
    queryFn: fetchWeavingPartners,
  });
}

export function useYarnReceiptOptions() {
  return useQuery({
    queryKey: ['yarn-receipts', 'options'],
    queryFn: fetchYarnReceiptOptions,
  });
}

export function useWorkOrderOptions() {
  return useQuery({
    queryKey: ['work-orders', 'options'],
    queryFn: fetchWorkOrderOptions,
  });
}

export function useRawFabricStats() {
  return useQuery<InventoryStats>({
    queryKey: [...QUERY_KEY, 'stats'],
    queryFn: fetchRawFabricStats,
  });
}
