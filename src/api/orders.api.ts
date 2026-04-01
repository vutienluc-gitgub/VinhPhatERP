import { supabase } from '@/services/supabase/client'
import type {
  Order,
  OrderInsert,
  OrderUpdate,
  OrderItemInsert,
  OrdersFilter,
} from '@/models'

const HEADER_TABLE = 'orders'
const ITEMS_TABLE = 'order_items'

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

export async function fetchOrderById(id: string): Promise<Order> {
  const { data, error } = await supabase
    .from(HEADER_TABLE)
    .select('*, customers(name, code), order_items(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as unknown as Order
}

export async function createOrder(
  header: OrderInsert,
  items: OrderItemInsert[],
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

export async function deleteOrder(id: string): Promise<void> {
  const { error } = await supabase.from(HEADER_TABLE).delete().eq('id', id)
  if (error) throw error
}
