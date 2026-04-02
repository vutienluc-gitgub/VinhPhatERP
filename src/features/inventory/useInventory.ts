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

/* ── Aging stock ── */

export type AgingRoll = {
  id: string
  roll_number: string
  fabric_type: string
  color_name: string | null
  warehouse_location: string | null
  status: string
  age_days: number
  source: 'raw' | 'finished'
}

const AGING_THRESHOLD_DAYS = 30

function daysSince(dateStr: string): number {
  const d = new Date(dateStr)
  const now = new Date()
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
}

/** Cuộn vải tồn kho lâu (>30 ngày), sắp xếp theo tuổi giảm dần */
export function useAgingStock() {
  return useQuery({
    queryKey: ['inventory', 'aging-stock'],
    queryFn: async (): Promise<AgingRoll[]> => {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - AGING_THRESHOLD_DAYS)
      const cutoffIso = cutoff.toISOString()

      // Fetch raw rolls in_stock created before cutoff
      const { data: rawData, error: rawErr } = await supabase
        .from('raw_fabric_rolls')
        .select('id, roll_number, fabric_type, color_name, warehouse_location, status, created_at, production_date')
        .eq('status', 'in_stock')
        .lt('created_at', cutoffIso)
        .order('created_at', { ascending: true })
        .limit(100)

      if (rawErr) throw rawErr

      // Fetch finished rolls in_stock created before cutoff
      const { data: finishedData, error: finishedErr } = await supabase
        .from('finished_fabric_rolls')
        .select('id, roll_number, fabric_type, color_name, warehouse_location, status, created_at, production_date')
        .eq('status', 'in_stock')
        .lt('created_at', cutoffIso)
        .order('created_at', { ascending: true })
        .limit(100)

      if (finishedErr) throw finishedErr

      const toAgingRoll = (row: Record<string, unknown>, source: 'raw' | 'finished'): AgingRoll => ({
        id: row.id as string,
        roll_number: row.roll_number as string,
        fabric_type: row.fabric_type as string,
        color_name: row.color_name as string | null,
        warehouse_location: row.warehouse_location as string | null,
        status: row.status as string,
        age_days: daysSince((row.production_date as string) ?? (row.created_at as string)),
        source,
      })

      const allRolls: AgingRoll[] = [
        ...(rawData ?? []).map((r) => toAgingRoll(r as Record<string, unknown>, 'raw')),
        ...(finishedData ?? []).map((r) => toAgingRoll(r as Record<string, unknown>, 'finished')),
      ]

      // Sort by age descending (oldest first)
      allRolls.sort((a, b) => b.age_days - a.age_days)

      return allRolls
    },
  })
}
