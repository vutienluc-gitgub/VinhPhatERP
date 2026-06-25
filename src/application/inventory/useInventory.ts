import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  fetchRawFabricInventory,
  fetchFinishedFabricInventory,
  fetchYarnInventoryList,
  fetchAgingStock,
  createInventoryAdjustment,
  fetchInventoryAdjustments,
} from '@/api/inventory.api';
import type {
  InventoryStats,
  InventoryBreakdownRow,
  AgingRoll,
} from '@/api/inventory.api';
import { calculateAgingStats, calculateYarnKPIs } from '@/domain/inventory';

export type { InventoryStats, InventoryBreakdownRow, AgingRoll };

export function useRawFabricInventory() {
  return useQuery({
    queryKey: ['inventory', 'raw-fabric'],
    queryFn: fetchRawFabricInventory,
  });
}

export function useFinishedFabricInventory() {
  return useQuery({
    queryKey: ['inventory', 'finished-fabric'],
    queryFn: fetchFinishedFabricInventory,
  });
}

export function useYarnInventory() {
  return useQuery({
    queryKey: ['inventory', 'yarn'],
    queryFn: fetchYarnInventoryList,
    select: (data) => ({
      breakdownList: data,
      stats: calculateYarnKPIs(data),
    }),
  });
}

export function useAgingStock() {
  return useQuery({
    queryKey: ['inventory', 'aging-stock'],
    queryFn: fetchAgingStock,
    select: (data) => ({
      rolls: data,
      stats: calculateAgingStats(data),
    }),
  });
}

export function useInventoryAdjustmentHistory() {
  return useQuery({
    queryKey: ['inventory', 'adjustments'],
    queryFn: fetchInventoryAdjustments,
  });
}

export function useAdjustInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createInventoryAdjustment,
    onSuccess: () => {
      // Invalidate everything to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}
