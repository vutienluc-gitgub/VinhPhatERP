import { useQuery } from '@tanstack/react-query'

import {
  fetchRawFabricInventory,
  fetchFinishedFabricInventory,
  fetchYarnInventory,
  fetchAgingStock,
} from '@/api/inventory.api'
import type { InventoryStats, InventoryBreakdownRow, AgingRoll } from '@/api/inventory.api'

export type { InventoryStats, InventoryBreakdownRow, AgingRoll }

export function useRawFabricInventory() {
  return useQuery({
    queryKey: ['inventory', 'raw-fabric'],
    queryFn: fetchRawFabricInventory,
  })
}

export function useFinishedFabricInventory() {
  return useQuery({
    queryKey: ['inventory', 'finished-fabric'],
    queryFn: fetchFinishedFabricInventory,
  })
}

export function useYarnInventory() {
  return useQuery({
    queryKey: ['inventory', 'yarn'],
    queryFn: fetchYarnInventory,
  })
}

export function useAgingStock() {
  return useQuery<AgingRoll[]>({
    queryKey: ['inventory', 'aging-stock'],
    queryFn: fetchAgingStock,
  })
}
