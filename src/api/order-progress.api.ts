import { supabase } from '@/services/supabase/client'
import type { OrderProgress, OrderProgressInsert, OrderProgressUpdate, OrderProgressWithOrder } from '@/models'

const TABLE = 'order_progress'

export async function fetchOrderProgress(orderId?: string): Promise<OrderProgressWithOrder[]> {
  let query = supabase
    .from(TABLE)
    .select('*, orders(order_number, delivery_date, customers(name))')
    .order('created_at', { ascending: false })

  if (orderId) query = query.eq('order_id', orderId)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as unknown as OrderProgressWithOrder[]
}

export async function createOrderProgress(row: OrderProgressInsert): Promise<OrderProgress> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([row])
    .select()
    .single()
  if (error) throw error
  return data as OrderProgress
}

export async function updateOrderProgress(
  id: string,
  row: OrderProgressUpdate,
): Promise<OrderProgress> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(row)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as OrderProgress
}
