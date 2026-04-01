import { supabase } from '@/services/supabase/client'
import type {
  YarnReceipt,
  YarnReceiptInsert,
  YarnReceiptUpdate,
  YarnReceiptItemInsert,
  YarnReceiptsFilter,
} from '@/models'

const TABLE = 'yarn_receipts'
const ITEMS_TABLE = 'yarn_receipt_items'

export async function fetchYarnReceipts(filters: YarnReceiptsFilter = {}): Promise<YarnReceipt[]> {
  let query = supabase
    .from(TABLE)
    .select('*, suppliers(name, code), yarn_receipt_items(*)')
    .order('receipt_date', { ascending: false })

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.supplierId) query = query.eq('supplier_id', filters.supplierId)
  if (filters.dateFrom) query = query.gte('receipt_date', filters.dateFrom)
  if (filters.dateTo) query = query.lte('receipt_date', filters.dateTo)
  if (filters.search?.trim()) {
    query = query.ilike('receipt_number', `%${filters.search.trim()}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as unknown as YarnReceipt[]
}

export async function createYarnReceipt(
  header: YarnReceiptInsert,
  items: YarnReceiptItemInsert[],
): Promise<YarnReceipt> {
  const { data, error: headerErr } = await supabase
    .from(TABLE)
    .insert(header)
    .select()
    .single()

  if (headerErr) throw headerErr

  const headerId = (data as YarnReceipt).id
  const itemsWithReceiptId = items.map((item) => ({
    ...item,
    receipt_id: headerId,
  }))

  const { error: itemsErr } = await supabase
    .from(ITEMS_TABLE)
    .insert(itemsWithReceiptId)

  if (itemsErr) {
    await supabase.from(TABLE).delete().eq('id', headerId)
    throw itemsErr
  }

  return data as YarnReceipt
}

export async function updateYarnReceipt(id: string, row: YarnReceiptUpdate): Promise<YarnReceipt> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(row)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as YarnReceipt
}

export async function deleteYarnReceipt(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}
