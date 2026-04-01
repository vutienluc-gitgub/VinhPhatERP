import { supabase } from '@/services/supabase/client'
import type { InventoryAdjustment, InventoryAdjustmentInsert } from '@/models'

const TABLE = 'inventory_adjustments'

export async function fetchInventoryAdjustments(): Promise<InventoryAdjustment[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as InventoryAdjustment[]
}

export async function createInventoryAdjustment(
  row: InventoryAdjustmentInsert,
): Promise<InventoryAdjustment> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([row])
    .select()
    .single()
  if (error) throw error
  return data as InventoryAdjustment
}
