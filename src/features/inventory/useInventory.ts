import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/services/supabase/client'

export type InventoryStats = {
  totalRolls: number
  totalLengthM: number
  totalWeightKg: number
}

export type InventoryBreakdownRow = {
  fabric_type: string | null
  color_name: string | null
  quality_grade: string | null
  roll_count: number | null
  total_length_m: number | null
  total_weight_kg: number | null
}

/** Thống kê tồn kho vải mộc tổng hợp (chỉ in_stock) */
export function useRawFabricInventory() {
  return useQuery({
    queryKey: ['inventory', 'raw-fabric'],
    queryFn: async (): Promise<{ stats: InventoryStats; breakdown: InventoryBreakdownRow[] }> => {
      const { data, error } = await supabase
        .from('v_raw_fabric_inventory')
        .select('fabric_type, color_name, quality_grade, roll_count, total_length_m, total_weight_kg')
      if (error) throw error
      const rows = (data ?? []) as InventoryBreakdownRow[]
      const stats: InventoryStats = {
        totalRolls: rows.reduce((s, r) => s + (r.roll_count ?? 0), 0),
        totalLengthM: rows.reduce((s, r) => s + (r.total_length_m ?? 0), 0),
        totalWeightKg: rows.reduce((s, r) => s + (r.total_weight_kg ?? 0), 0),
      }
      return { stats, breakdown: rows }
    },
  })
}

/** Thống kê tồn kho vải thành phẩm tổng hợp (chỉ in_stock) */
export function useFinishedFabricInventory() {
  return useQuery({
    queryKey: ['inventory', 'finished-fabric'],
    queryFn: async (): Promise<{ stats: InventoryStats; breakdown: InventoryBreakdownRow[] }> => {
      const { data, error } = await supabase
        .from('v_finished_fabric_inventory')
        .select('fabric_type, color_name, quality_grade, roll_count, total_length_m, total_weight_kg')
      if (error) throw error
      const rows = (data ?? []) as InventoryBreakdownRow[]
      const stats: InventoryStats = {
        totalRolls: rows.reduce((s, r) => s + (r.roll_count ?? 0), 0),
        totalLengthM: rows.reduce((s, r) => s + (r.total_length_m ?? 0), 0),
        totalWeightKg: rows.reduce((s, r) => s + (r.total_weight_kg ?? 0), 0),
      }
      return { stats, breakdown: rows }
    },
  })
}

/** Thống kê tồn sợi — đếm phiếu nhập confirmed và tổng giá trị */
export function useYarnInventory() {
  return useQuery({
    queryKey: ['inventory', 'yarn'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('yarn_receipts')
        .select('id, total_amount, status')
        .eq('status', 'confirmed')
      if (error) throw error
      const rows = data ?? []
      return {
        totalReceipts: rows.length,
        totalAmount: rows.reduce((s, r) => s + (Number(r.total_amount) || 0), 0),
      }
    },
  })
}
