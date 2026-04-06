import { supabase } from '@/services/supabase/client'
import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination'
import type { PaginatedResult } from '@/shared/types/pagination'
import type { WeavingInvoice, WeavingInvoiceFilter } from '@/features/weaving-invoices/types'
import type { WeavingInvoiceFormValues } from '@/features/weaving-invoices/weaving-invoices.module'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => supabase as any

const TABLE = 'weaving_invoices'
const ROLLS_TABLE = 'weaving_invoice_rolls'

/* ── List (paginated) ── */

export async function fetchWeavingInvoicesPaginated(
  filters: WeavingInvoiceFilter = {},
  page = 1,
): Promise<PaginatedResult<WeavingInvoice>> {
  const from = (page - 1) * DEFAULT_PAGE_SIZE
  const to = from + DEFAULT_PAGE_SIZE - 1

  let query = db()
    .from(TABLE)
    .select('*, suppliers(name, code)', { count: 'exact' })
    .order('invoice_date', { ascending: false })
    .range(from, to)

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.supplierId) query = query.eq('supplier_id', filters.supplierId)
  if (filters.search?.trim()) query = query.ilike('invoice_number', `%${filters.search.trim()}%`)

  const { data, error, count } = await query
  if (error) throw error
  const total = count ?? 0
  return {
    data: (data ?? []) as unknown as WeavingInvoice[],
    total,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: Math.ceil(total / DEFAULT_PAGE_SIZE),
  }
}

/* ── Single invoice with rolls ── */

export async function fetchWeavingInvoiceById(id: string): Promise<WeavingInvoice> {
  const { data, error } = await db()
    .from(TABLE)
    .select('*, suppliers(name, code), weaving_invoice_rolls(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as unknown as WeavingInvoice
}

/* ── Next invoice number ── */

export async function fetchNextWeavingInvoiceNumber(): Promise<string> {
  const { data, error } = await db().rpc('next_weaving_invoice_number')
  if (error) {
    const now = new Date()
    const yy = String(now.getFullYear()).slice(-2)
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    return `GC${yy}${mm}-001`
  }
  return (data as string) ?? 'GC0001-001'
}

/* ── Fetch weaving suppliers ── */

export async function fetchWeavingSuppliers(): Promise<{ id: string; code: string; name: string }[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('id, code, name')
    .eq('category', 'weaving')
    .eq('status', 'active')
    .order('name')
  if (error) throw error
  return (data ?? []) as { id: string; code: string; name: string }[]
}

/* ── Create invoice (header + rolls as draft) ── */

export async function createWeavingInvoice(values: WeavingInvoiceFormValues): Promise<WeavingInvoice> {
  const { data: userData } = await supabase.auth.getUser()

  const { data: header, error: headerErr } = await db()
    .from(TABLE)
    .insert({
      invoice_number: values.invoice_number.trim(),
      supplier_id: values.supplier_id,
      invoice_date: values.invoice_date,
      fabric_type: values.fabric_type.trim(),
      unit_price_per_kg: values.unit_price_per_kg,
      notes: values.notes?.trim() || null,
      status: 'draft',
      created_by: userData.user?.id ?? null,
    })
    .select('id, invoice_number')
    .single()

  if (headerErr) throw headerErr

  // Fetch supplier code for prefix
  const { data: supplierData, error: supplierErr } = await supabase
    .from('suppliers')
    .select('code')
    .eq('id', values.supplier_id)
    .single()
  if (supplierErr) throw supplierErr
  const supplierCode = supplierData?.code ?? 'SUP'

  const rolls = values.rolls.map((r, idx) => ({
    invoice_id: header.id,
    // Auto‑generate roll number if not provided
    roll_number: r.roll_number?.trim() || `${supplierCode}-${Date.now()}-${idx + 1}`,
    weight_kg: r.weight_kg,
    length_m: r.length_m ?? null,
    quality_grade: r.quality_grade ?? null,
    warehouse_location: r.warehouse_location?.trim() || null,
    lot_number: r.lot_number?.trim() || null,
    notes: r.notes?.trim() || null,
    sort_order: idx,
  }))

  const { error: rollsErr } = await db().from(ROLLS_TABLE).insert(rolls)
  if (rollsErr) {
    await db().from(TABLE).delete().eq('id', header.id)
    throw rollsErr
  }

  return fetchWeavingInvoiceById(header.id)
}

/* ── Update invoice (draft only) ── */

export async function updateWeavingInvoice(id: string, values: WeavingInvoiceFormValues): Promise<void> {
  const { error: headerErr } = await db()
    .from(TABLE)
    .update({
      invoice_number: values.invoice_number.trim(),
      supplier_id: values.supplier_id,
      invoice_date: values.invoice_date,
      fabric_type: values.fabric_type.trim(),
      unit_price_per_kg: values.unit_price_per_kg,
      notes: values.notes?.trim() || null,
    })
    .eq('id', id)
    .eq('status', 'draft')

  if (headerErr) throw headerErr

  const { error: delErr } = await db().from(ROLLS_TABLE).delete().eq('invoice_id', id)
  if (delErr) throw delErr

  const rolls = values.rolls.map((r, idx) => ({
    invoice_id: id,
    roll_number: r.roll_number.trim(),
    weight_kg: r.weight_kg,
    length_m: r.length_m ?? null,
    quality_grade: r.quality_grade ?? null,
    warehouse_location: r.warehouse_location?.trim() || null,
    lot_number: r.lot_number?.trim() || null,
    notes: r.notes?.trim() || null,
    sort_order: idx,
  }))

  const { error: insertErr } = await db().from(ROLLS_TABLE).insert(rolls)
  if (insertErr) throw insertErr
}

/* ── Confirm invoice → trigger insert to raw_fabric_rolls ── */

export async function confirmWeavingInvoice(id: string): Promise<void> {
  const { error } = await db().rpc('confirm_weaving_invoice', { p_invoice_id: id })
  if (error) {
    if (error.message?.includes('INVOICE_NOT_DRAFT'))
      throw new Error('Phiếu này đã được xác nhận rồi.')
    if (error.message?.includes('INVOICE_NOT_FOUND'))
      throw new Error('Không tìm thấy phiếu gia công.')
    throw error
  }
}

/* ── Mark as paid ── */

export async function markWeavingInvoicePaid(id: string, paidAmount: number): Promise<void> {
  const { error } = await db()
    .from(TABLE)
    .update({ paid_amount: paidAmount, status: 'paid' })
    .eq('id', id)
  if (error) throw error
}

/* ── Delete (draft only) ── */

export async function deleteWeavingInvoice(id: string): Promise<void> {
  const { error } = await db().from(TABLE).delete().eq('id', id)
  if (error) throw error
}

/* ── Supplier debt view ── */

export type WeavingSupplierDebtRow = {
  supplier_id: string
  supplier_name: string
  supplier_code: string
  category: string
  total_invoiced: number
  total_paid: number
  balance_due: number
  invoice_count: number
}

export async function fetchWeavingSupplierDebt(): Promise<WeavingSupplierDebtRow[]> {
  const { data, error } = await db().from('v_supplier_debt').select('*')
  if (error) throw error
  return (data ?? []) as WeavingSupplierDebtRow[]
}
