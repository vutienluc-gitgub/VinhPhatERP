import { useQuery } from '@tanstack/react-query';

import {
  fetchRawFabricInventory,
  fetchFinishedFabricInventory,
  fetchYarnInventory,
  fetchAgingStock,
} from '@/api/inventory.api';
import type {
  InventoryStats,
  InventoryBreakdownRow,
  AgingRoll,
} from '@/api/inventory.api';
import { calculateAgingStats } from '@/domain/inventory';

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
    queryFn: fetchYarnInventory,
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
