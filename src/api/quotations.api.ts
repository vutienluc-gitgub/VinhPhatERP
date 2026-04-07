import type { Quotation, QuotationsFilter, QuotationStatus } from '@/features/quotations/types'

import { supabase } from '@/services/supabase/client'

import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination'
import type { PaginatedResult } from '@/shared/types/pagination'

const HEADER_TABLE = 'quotations'
const ITEMS_TABLE = 'quotation_items'

/* ── Fetch list with pagination ── */

export async function fetchQuotationsPaginated(
  filters: QuotationsFilter = {},
  page = 1,
): Promise<PaginatedResult<Quotation>> {
  const from = (page - 1) * DEFAULT_PAGE_SIZE
  const to = from + DEFAULT_PAGE_SIZE - 1

  let query = supabase
    .from(HEADER_TABLE)
    .select('*, customers(name, code)', { count: 'exact' })
    .order('quotation_date', { ascending: false })
    .range(from, to)

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.customerId) query = query.eq('customer_id', filters.customerId)
  if (filters.search?.trim()) {
    query = query.ilike('quotation_number', `%${filters.search.trim()}%`)
  }

  const { data, error, count } = await query
  if (error) throw error
  const total = count ?? 0
  return {
    data: (data ?? []) as unknown as Quotation[],
    total,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: Math.ceil(total / DEFAULT_PAGE_SIZE),
  }
}

/* ── Single quotation with items ── */

export async function fetchQuotationById(id: string): Promise<Quotation> {
  const { data, error } = await supabase
    .from(HEADER_TABLE)
    .select('*, customers(name, code), quotation_items(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as unknown as Quotation
}

/* ── Generate next quotation number ── */

export async function fetchNextQuotationNumber(): Promise<string> {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const prefix = `BG${yy}${mm}-`

  const { data, error } = await supabase
    .from(HEADER_TABLE)
    .select('quotation_number')
    .ilike('quotation_number', `${prefix}%`)
    .order('quotation_number', { ascending: false })
    .limit(1)

  if (error) throw error
  if (!data || data.length === 0) return `${prefix}0001`

  const first = data[0]
  if (!first) return `${prefix}0001`
  const last = first.quotation_number
  const match = last.match(/(\d{4})$/)
  if (!match?.[1]) return `${prefix}0001`

  const nextNum = parseInt(match[1], 10) + 1
  return `${prefix}${String(nextNum).padStart(4, '0')}`
}

/* ── Create quotation (header + items) ── */

type QuotationHeaderInsert = {
  quotation_number: string
  customer_id: string
  quotation_date: string
  valid_until: string | null
  subtotal: number
  discount_type: string
  discount_value: number
  discount_amount: number
  total_before_vat: number
  vat_rate: number
  vat_amount: number
  total_amount: number
  delivery_terms: string | null
  payment_terms: string | null
  notes: string | null
  status: 'draft'
}

type QuotationItemInsert = {
  quotation_id: string
  fabric_type: string
  color_name: string | null
  color_code: string | null
  width_cm: number | null
  unit: string
  quantity: number
  unit_price: number
  lead_time_days: number | null
  notes: string | null
  sort_order: number
}

export async function createQuotation(
  header: QuotationHeaderInsert,
  items: Omit<QuotationItemInsert, 'quotation_id'>[],
): Promise<Quotation> {
  const { data, error: headerErr } = await supabase
    .from(HEADER_TABLE)
    .insert(header)
    .select()
    .single()

  if (headerErr) throw headerErr
  if (!data) throw new Error('Không thể tạo báo giá')

  const headerId = (data as unknown as Quotation).id

  const itemsWithId = items.map((item) => ({
    ...item,
    quotation_id: headerId,
  }))

  const { error: itemsErr } = await supabase.from(ITEMS_TABLE).insert(itemsWithId)

  if (itemsErr) {
    await supabase.from(HEADER_TABLE).delete().eq('id', headerId)
    throw itemsErr
  }

  return data as unknown as Quotation
}

/* ── Update quotation header + replace items ── */

export async function updateQuotationWithItems(
  id: string,
  header: Omit<QuotationHeaderInsert, 'status'>,
  items: Omit<QuotationItemInsert, 'quotation_id'>[],
): Promise<void> {
  const { error: headerErr } = await supabase
    .from(HEADER_TABLE)
    .update(header)
    .eq('id', id)
  if (headerErr) throw headerErr

  const { error: delErr } = await supabase
    .from(ITEMS_TABLE)
    .delete()
    .eq('quotation_id', id)
  if (delErr) throw delErr

  const itemsWithId = items.map((item) => ({
    ...item,
    quotation_id: id,
  }))
  const { error: insertErr } = await supabase.from(ITEMS_TABLE).insert(itemsWithId)
  if (insertErr) throw insertErr
}

/* ── Status transitions ── */

export async function sendQuotation(id: string): Promise<void> {
  const { error } = await supabase
    .from(HEADER_TABLE)
    .update({ status: 'sent' as QuotationStatus })
    .eq('id', id)
    .in('status', ['draft'])
  if (error) throw error
}

export async function confirmQuotation(id: string): Promise<void> {
  const { error } = await supabase
    .from(HEADER_TABLE)
    .update({
      status: 'confirmed' as QuotationStatus,
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .in('status', ['sent', 'draft'])
  if (error) throw error
}

export async function rejectQuotation(id: string): Promise<void> {
  const { error } = await supabase
    .from(HEADER_TABLE)
    .update({ status: 'rejected' as QuotationStatus })
    .eq('id', id)
    .in('status', ['sent', 'draft'])
  if (error) throw error
}

export async function deleteQuotation(id: string): Promise<void> {
  const { error } = await supabase.from(HEADER_TABLE).delete().eq('id', id)
  if (error) throw error
}

/* ── Expiring quotations count ── */

export async function fetchExpiringQuotationsCount(): Promise<{ expiring: number; expired: number }> {
  const today = new Date().toISOString().slice(0, 10)
  const threeDaysLater = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)

  const { count: expiringCount, error: err1 } = await supabase
    .from(HEADER_TABLE)
    .select('*', { count: 'exact', head: true })
    .in('status', ['draft', 'sent'])
    .gte('valid_until', today)
    .lte('valid_until', threeDaysLater)
  if (err1) throw err1

  const { count: expiredCount, error: err2 } = await supabase
    .from(HEADER_TABLE)
    .select('*', { count: 'exact', head: true })
    .in('status', ['draft', 'sent'])
    .lt('valid_until', today)
  if (err2) throw err2

  return {
    expiring: expiringCount ?? 0,
    expired: expiredCount ?? 0,
  }
}

/* ── Convert quotation to order ── */

export async function convertQuotationToOrder(
  quotationId: string,
): Promise<{ orderId: string; orderNumber: string }> {
  // 1. Fetch quotation with items
  const { data: quotation, error: fetchErr } = await supabase
    .from(HEADER_TABLE)
    .select('*, quotation_items(*)')
    .eq('id', quotationId)
    .single()

  if (fetchErr) throw fetchErr
  if (!quotation) throw new Error('Không tìm thấy báo giá')

  const q = quotation as unknown as Quotation
  if (q.status !== 'confirmed') {
    throw new Error('Chỉ có thể chuyển báo giá đã duyệt thành đơn hàng')
  }

  // 2. Generate next order number
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const orderPrefix = `DH${yy}${mm}-`

  const { data: lastOrders, error: numErr } = await supabase
    .from('orders')
    .select('order_number')
    .ilike('order_number', `${orderPrefix}%`)
    .order('order_number', { ascending: false })
    .limit(1)
  if (numErr) throw numErr

  let nextOrderNum = `${orderPrefix}0001`
  if (lastOrders && lastOrders.length > 0) {
    const last = lastOrders[0]
    if (last) {
      const match = last.order_number.match(/(\d{4})$/)
      if (match?.[1]) {
        const num = parseInt(match[1], 10) + 1
        nextOrderNum = `${orderPrefix}${String(num).padStart(4, '0')}`
      }
    }
  }

  // 3. Insert order header
  const combinedNotes = [
    `Từ BG: ${q.quotation_number}`,
    q.delivery_terms ? `Giao hàng: ${q.delivery_terms}` : '',
    q.payment_terms ? `Thanh toán: ${q.payment_terms}` : '',
    q.notes ? `Ghi chú: ${q.notes}` : ''
  ].filter(Boolean).join('. ')

  const { data: newOrder, error: orderErr } = await supabase
    .from('orders')
    .insert({
      order_number: nextOrderNum,
      customer_id: q.customer_id,
      order_date: now.toISOString().slice(0, 10),
      total_amount: q.total_amount,
      source_quotation_id: quotationId,
      notes: combinedNotes,
      status: 'draft' as const,
    })
    .select()
    .single()

  if (orderErr) throw orderErr
  if (!newOrder) throw new Error('Không thể tạo đơn hàng')

  const orderId = (newOrder as { id: string }).id

  // 4. Copy quotation items → order items
  const items = (q.quotation_items ?? []).map((item, idx) => ({
    order_id: orderId,
    fabric_type: item.fabric_type,
    color_name: item.color_name,
    color_code: item.color_code,
    width_cm: item.width_cm,
    unit: item.unit,
    quantity: item.quantity,
    unit_price: item.unit_price,
    sort_order: idx,
  }))

  if (items.length > 0) {
    const { error: itemsErr } = await supabase.from('order_items').insert(items)
    if (itemsErr) {
      await supabase.from('orders').delete().eq('id', orderId)
      throw itemsErr
    }
  }

  // 5. Update quotation → converted
  const { error: updateErr } = await supabase
    .from(HEADER_TABLE)
    .update({
      status: 'converted' as QuotationStatus,
      converted_order_id: orderId,
    })
    .eq('id', quotationId)
  if (updateErr) throw updateErr

  return { orderId, orderNumber: nextOrderNum }
}
