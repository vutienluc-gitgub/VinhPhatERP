import { supabase } from '@/services/supabase/client'
import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination'
import type { PaginatedResult } from '@/shared/types/pagination'
import type { FinishedFabricRoll, FinishedFabricFilter, RawRollOption } from '@/features/finished-fabric/types'

const TABLE = 'finished_fabric_rolls'

export type InventoryStats = {
  totalRolls: number
  totalLengthM: number
  totalWeightKg: number
}

export async function fetchFinishedFabricPaginated(
  filters: FinishedFabricFilter = {},
  page = 1,
): Promise<PaginatedResult<FinishedFabricRoll>> {
  const from = (page - 1) * DEFAULT_PAGE_SIZE
  const to = from + DEFAULT_PAGE_SIZE - 1

  let query = supabase
    .from(TABLE)
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.quality_grade) query = query.eq('quality_grade', filters.quality_grade)
  if (filters.fabric_type) query = query.ilike('fabric_type', `%${filters.fabric_type}%`)

  const { data, error, count } = await query
  if (error) throw error
  const total = count ?? 0
  return {
    data: (data ?? []) as FinishedFabricRoll[],
    total,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: Math.ceil(total / DEFAULT_PAGE_SIZE),
  }
}

export async function createFinishedFabric(
  row: Omit<FinishedFabricRoll, 'id' | 'created_at' | 'updated_at' | 'lot_number'>,
): Promise<FinishedFabricRoll> {
  const { data, error } = await supabase.from(TABLE).insert([row]).select().single()
  if (error) throw error
  return data as FinishedFabricRoll
}

export async function updateFinishedFabric(
  id: string,
  row: Omit<FinishedFabricRoll, 'id' | 'created_at' | 'updated_at' | 'lot_number'>,
): Promise<FinishedFabricRoll> {
  const { data, error } = await supabase.from(TABLE).update(row).eq('id', id).select().single()
  if (error) throw error
  return data as FinishedFabricRoll
}

export async function deleteFinishedFabric(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}

export async function fetchRawRollOptions(): Promise<RawRollOption[]> {
  const { data, error } = await supabase
    .from('raw_fabric_rolls')
    .select('id, roll_number, fabric_type, color_name, lot_number')
    .eq('status', 'in_stock')
    .order('roll_number')
    .limit(500)
  if (error) throw error
  return (data ?? []) as RawRollOption[]
}

export async function fetchRawRollsByLot(lotNumber: string): Promise<RawRollOption[]> {
  const { data, error } = await supabase
    .from('raw_fabric_rolls')
    .select('id, roll_number, fabric_type, color_name, lot_number')
    .eq('lot_number', lotNumber.trim())
    .eq('status', 'in_stock')
    .order('roll_number')
    .limit(500)
  if (error) throw error
  return (data ?? []) as RawRollOption[]
}

export async function createFinishedFabricBulk(
  rows: Omit<FinishedFabricRoll, 'id' | 'created_at' | 'updated_at' | 'lot_number'>[],
  lotNumber: string,
): Promise<FinishedFabricRoll[]> {
  // 1. Check duplicate roll numbers in DB
  const rollNumbers = rows.map((r) => r.roll_number)
  const { data: existing, error: existErr } = await supabase
    .from(TABLE)
    .select('roll_number')
    .in('roll_number', rollNumbers)
  if (existErr) throw existErr
  if ((existing ?? []).length > 0) {
    const taken = existing.map((r) => r.roll_number).sort()
    throw new Error(`Mã cuộn đã tồn tại: ${taken.join(', ')}`)
  }

  // 2. Validate raw_roll_id belongs to correct lot_number
  const rawRollIds = [...new Set(rows.map((r) => r.raw_roll_id))]
  const { data: rawRolls, error: rawErr } = await supabase
    .from('raw_fabric_rolls')
    .select('id, roll_number, lot_number')
    .in('id', rawRollIds)
  if (rawErr) throw rawErr

  const rawMap = new Map((rawRolls ?? []).map((r) => [r.id, r]))
  const mismatches: string[] = []
  for (const row of rows) {
    const raw = rawMap.get(row.raw_roll_id)
    if (!raw) {
      mismatches.push(`Cuộn mộc ${row.raw_roll_id} không tồn tại`)
    } else if (raw.lot_number !== lotNumber.trim()) {
      mismatches.push(
        `Cuộn mộc ${raw.roll_number} thuộc lô "${raw.lot_number ?? '(trống)'}" — không khớp lô "${lotNumber}"`,
      )
    }
  }
  if (mismatches.length > 0) {
    throw new Error(`Lỗi đối chiếu lô:\n${mismatches.join('\n')}`)
  }

  // 3. Insert
  const { data, error } = await supabase.from(TABLE).insert(rows).select()
  if (error) throw error
  return (data ?? []) as FinishedFabricRoll[]
}

export async function fetchFinishedFabricStats(): Promise<InventoryStats> {
  const { data, error } = await supabase
    .from('v_finished_fabric_inventory')
    .select('roll_count, total_length_m, total_weight_kg')
  if (error) throw error
  const rows = data ?? []
  return {
    totalRolls: rows.reduce((s, r) => s + (r.roll_count ?? 0), 0),
    totalLengthM: rows.reduce((s, r) => s + (r.total_length_m ?? 0), 0),
    totalWeightKg: rows.reduce((s, r) => s + (r.total_weight_kg ?? 0), 0),
  }
}

/* ── Trace chain ── */

export type TraceRawRoll = {
  id: string
  roll_number: string
  fabric_type: string
  color_name: string | null
  width_cm: number | null
  length_m: number | null
  weight_kg: number | null
  quality_grade: string | null
  status: string
  lot_number: string | null
  warehouse_location: string | null
  weaving_partner: { id: string; name: string; code: string } | null
}

export type TraceYarnReceipt = {
  id: string
  receipt_number: string
  receipt_date: string
  total_amount: number
  status: string
  supplier: { id: string; name: string; code: string } | null
  items_count: number
}

export type TraceChainData = {
  rawRoll: TraceRawRoll | null
  yarnReceipt: TraceYarnReceipt | null
}

export async function fetchTraceChain(rawRollId: string): Promise<TraceChainData> {
  const result: TraceChainData = { rawRoll: null, yarnReceipt: null }

  const { data: rawData, error: rawError } = await supabase
    .from('raw_fabric_rolls')
    .select(
      'id, roll_number, fabric_type, color_name, width_cm, length_m, weight_kg, quality_grade, status, lot_number, warehouse_location, weaving_partner_id, yarn_receipt_id, suppliers!weaving_partner_id(id, name, code)',
    )
    .eq('id', rawRollId)
    .single()

  if (rawError || !rawData) return result

  const raw = rawData as Record<string, unknown>
  const weavingPartner = raw.suppliers as { id: string; name: string; code: string } | null

  result.rawRoll = {
    id: raw.id as string,
    roll_number: raw.roll_number as string,
    fabric_type: raw.fabric_type as string,
    color_name: raw.color_name as string | null,
    width_cm: raw.width_cm as number | null,
    length_m: raw.length_m as number | null,
    weight_kg: raw.weight_kg as number | null,
    quality_grade: raw.quality_grade as string | null,
    status: raw.status as string,
    lot_number: raw.lot_number as string | null,
    warehouse_location: raw.warehouse_location as string | null,
    weaving_partner: weavingPartner,
  }

  const yarnReceiptId = raw.yarn_receipt_id as string | null
  if (!yarnReceiptId) return result

  const { data: receiptData, error: receiptError } = await supabase
    .from('yarn_receipts')
    .select('id, receipt_number, receipt_date, total_amount, status, suppliers(id, name, code), yarn_receipt_items(id)')
    .eq('id', yarnReceiptId)
    .single()

  if (receiptError || !receiptData) return result

  const receipt = receiptData as Record<string, unknown>
  const supplier = receipt.suppliers as { id: string; name: string; code: string } | null
  const items = receipt.yarn_receipt_items as { id: string }[] | null

  result.yarnReceipt = {
    id: receipt.id as string,
    receipt_number: receipt.receipt_number as string,
    receipt_date: receipt.receipt_date as string,
    total_amount: receipt.total_amount as number,
    status: receipt.status as string,
    supplier,
    items_count: items?.length ?? 0,
  }

  return result
}
