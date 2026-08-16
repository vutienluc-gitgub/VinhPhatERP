import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

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
import { DomainEventBus } from '@/domain/core/DomainEventBus';
import type { BulkInputFormValues } from '@/features/raw-fabric/raw-fabric.module';
import type { RawFabricFormValues } from '@/features/raw-fabric/raw-fabric.module';
import type { RawFabricFilter } from '@/domain/inventory/raw-fabric.types';

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
  const [clientId, setClientId] = useState(() => crypto.randomUUID());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: RawFabricFormValues) => {
      const reqPayload = { id: clientId, ...mapRawFabricFormToDb(values) };
      return createRawFabric(reqPayload);
    },
    onSuccess: (data, values) => {
      setClientId(crypto.randomUUID());
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });

      DomainEventBus.publish({
        eventName: 'FabricReceivedEvent',
        timestamp: new Date().toISOString(),
        producer: 'useCreateRawFabric',
        payload: {
          receiptId: data?.id || crypto.randomUUID(),
          fabricType: values.fabric_type,
          color: values.color_name || undefined,
          totalWeight: values.weight_kg || 0,
          rollsCount: 1,
          receivedAt: new Date().toISOString(),
        },
      });
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
    onSuccess: (data, values) => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });

      const totalWeight = values.rolls.reduce(
        (sum, r) => sum + (Number(r.weight_kg) || 0),
        0,
      );

      DomainEventBus.publish({
        eventName: 'FabricReceivedEvent',
        timestamp: new Date().toISOString(),
        producer: 'useCreateRawFabricBulk',
        payload: {
          receiptId:
            Array.isArray(data) && data[0]?.id
              ? data[0].id
              : crypto.randomUUID(),
          fabricType: values.fabric_type,
          color: values.color_name || undefined,
          totalWeight,
          rollsCount: values.rolls.length,
          receivedAt: new Date().toISOString(),
        },
      });
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
