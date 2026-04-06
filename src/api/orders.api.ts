import { supabase } from '@/services/supabase/client'
import type {
  Order,
  OrderInsert,
  OrderUpdate,
  OrderItemInsert,
  OrdersFilter,
  OrderStatus,
} from '@/models'
import type { Database } from '@/services/supabase/database.types'
import type { PaginatedResult } from '@/shared/types/pagination'
import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination'

const HEADER_TABLE = 'orders'
const ITEMS_TABLE = 'order_items'

type DbOrderStatus = Database['public']['Enums']['order_status']

/* ── Fetch list with pagination ── */

export async function fetchOrdersPaginated(
  filters: OrdersFilter = {},
  page = 1,
): Promise<PaginatedResult<Order>> {
  const from = (page - 1) * DEFAULT_PAGE_SIZE
  const to = from + DEFAULT_PAGE_SIZE - 1

  let query = supabase
    .from(HEADER_TABLE)
    .select('*, customers(name, code), quotations!source_quotation_id(quotation_number)', { count: 'exact' })
    .order('order_date', { ascending: false })
    .range(from, to)

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.customerId) query = query.eq('customer_id', filters.customerId)
  if (filters.search?.trim()) {
    query = query.ilike('order_number', `%${filters.search.trim()}%`)
  }

  const { data, error, count } = await query
  if (error) throw error
  const total = count ?? 0
  return {
    data: (data ?? []) as unknown as Order[],
    total,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: Math.ceil(total / DEFAULT_PAGE_SIZE),
  }
}

/* ── Fetch all (no pagination, for kanban etc.) ── */

export async function fetchOrders(filters: OrdersFilter = {}): Promise<Order[]> {
  let query = supabase
    .from(HEADER_TABLE)
    .select('*, customers(name, code)')
    .order('order_date', { ascending: false })

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.customerId) query = query.eq('customer_id', filters.customerId)
  if (filters.search?.trim()) {
    query = query.ilike('order_number', `%${filters.search.trim()}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as unknown as Order[]
}

/* ── Single order by ID ── */

export async function fetchOrderById(id: string): Promise<Order> {
  const { data, error } = await supabase
    .from(HEADER_TABLE)
    .select('*, customers(name, code), quotations!source_quotation_id(quotation_number), order_items(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as unknown as Order
}

/* ── Generate next order number ── */

export async function fetchNextOrderNumber(): Promise<string> {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const prefix = `DH${yy}${mm}-`

  const { data, error } = await supabase
    .from(HEADER_TABLE)
    .select('order_number')
    .ilike('order_number', `${prefix}%`)
    .order('order_number', { ascending: false })
    .limit(1)

  if (error) throw error
  if (!data || data.length === 0) return `${prefix}0001`

  const first = data[0]
  if (!first) return `${prefix}0001`
  const last = first.order_number
  const match = last.match(/(\d{4})$/)
  if (!match?.[1]) return `${prefix}0001`

  const nextNum = parseInt(match[1], 10) + 1
  return `${prefix}${String(nextNum).padStart(4, '0')}`
}

/* ── Create order (header + items) ── */

export async function createOrder(
  header: OrderInsert,
  items: Omit<OrderItemInsert, 'order_id'>[],
): Promise<Order> {
  const { data, error: headerErr } = await supabase
    .from(HEADER_TABLE)
    .insert(header)
    .select()
    .single()

  if (headerErr) throw headerErr

  const headerId = (data as Order).id
  const itemsWithOrderId = items.map((item) => ({
    ...item,
    order_id: headerId,
  }))

  const { error: itemsErr } = await supabase
    .from(ITEMS_TABLE)
    .insert(itemsWithOrderId)

  if (itemsErr) {
    await supabase.from(HEADER_TABLE).delete().eq('id', headerId)
    throw itemsErr
  }

  return data as Order
}

/* ── Update order header ── */

export async function updateOrder(id: string, row: OrderUpdate): Promise<Order> {
  const { data, error } = await supabase
    .from(HEADER_TABLE)
    .update(row)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Order
}

/* ── Update order header + replace items ── */

export async function updateOrderWithItems(
  id: string,
  header: OrderUpdate,
  items: Omit<OrderItemInsert, 'order_id'>[],
): Promise<void> {
  const { error: headerErr } = await supabase
    .from(HEADER_TABLE)
    .update(header)
    .eq('id', id)
  if (headerErr) throw headerErr

  const { error: delErr } = await supabase
    .from(ITEMS_TABLE)
    .delete()
    .eq('order_id', id)
  if (delErr) throw delErr

  const itemsWithOrderId = items.map((item) => ({
    ...item,
    order_id: id,
  }))
  const { error: insertErr } = await supabase.from(ITEMS_TABLE).insert(itemsWithOrderId)
  if (insertErr) throw insertErr
}

/* ── Delete order ── */

export async function deleteOrder(id: string): Promise<void> {
  const { error } = await supabase.from(HEADER_TABLE).delete().eq('id', id)
  if (error) throw error
}

/* ── Update order status (used by Kanban) ── */

export async function updateOrderStatus(id: string, status: DbOrderStatus): Promise<void> {
  const { error } = await supabase
    .from(HEADER_TABLE)
    .update({ status })
    .eq('id', id)
  if (error) throw error
}

/* ── Confirm order: recalculate total, update status, create progress rows ── */

export async function confirmOrder(orderId: string): Promise<void> {
  // 1. Fetch items to recalculate total
  const { data: items, error: itemsErr } = await supabase
    .from(ITEMS_TABLE)
    .select('quantity, unit_price')
    .eq('order_id', orderId)
  if (itemsErr) throw itemsErr

  const newTotal = (items ?? []).reduce(
    (sum, it) => sum + Number(it.quantity) * Number(it.unit_price),
    0,
  )

  // 2. Update status + recalculate total
  const { error: statusErr } = await supabase
    .from(HEADER_TABLE)
    .update({
      status: 'confirmed' as OrderStatus,
      total_amount: newTotal,
    })
    .eq('id', orderId)
    .eq('status', 'draft')
  if (statusErr) throw statusErr

  // 3. Create 7 progress rows
  const stages = [
    'warping', 'weaving', 'greige_check', 'dyeing',
    'finishing', 'final_check', 'packing',
  ] as const

  const progressRows = stages.map((stage) => ({
    order_id: orderId,
    stage,
    status: 'pending' as const,
  }))

  const { error: progressErr } = await supabase
    .from('order_progress')
    .insert(progressRows)
  if (progressErr) throw progressErr
}

/* ── Cancel order: release reserved rolls → cancel ── */

export async function cancelOrder(orderId: string): Promise<void> {
  // 1. Release all reserved rolls back to in_stock
  await supabase
    .from('finished_fabric_rolls')
    .update({ status: 'in_stock', reserved_for_order_id: null })
    .eq('reserved_for_order_id', orderId)
    .eq('status', 'reserved')

  // 2. Cancel the order
  const { error } = await supabase
    .from(HEADER_TABLE)
    .update({ status: 'cancelled' as OrderStatus })
    .eq('id', orderId)
  if (error) throw error
}

/* ── Complete order ── */

export async function completeOrder(orderId: string): Promise<void> {
  const { error } = await supabase
    .from(HEADER_TABLE)
    .update({ status: 'completed' as OrderStatus })
    .eq('id', orderId)
  if (error) throw error
}

/* ── Edge Function: get session token ── */

export async function getAccessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  return data?.session?.access_token ?? ''
}

/* ── Edge Function: invoke create-order ── */

export async function invokeCreateOrderFunction<TResult>(
  payload: Record<string, unknown>,
  token: string,
): Promise<TResult> {
  const { data, error } = await supabase.functions.invoke<TResult>('create-order', {
    body: payload,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  if (error) throw error
  return data as TResult
}
