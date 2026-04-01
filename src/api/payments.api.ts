import { supabase } from '@/services/supabase/client'
import type { Payment, PaymentInsert, PaymentUpdate, PaymentsFilter } from '@/models'

const TABLE = 'payments'

export async function fetchPayments(filters: PaymentsFilter = {}): Promise<Payment[]> {
  let query = supabase
    .from(TABLE)
    .select('*, orders(order_number, total_amount, paid_amount), customers(name, code)')
    .order('payment_date', { ascending: false })

  if (filters.orderId) query = query.eq('order_id', filters.orderId)
  if (filters.customerId) query = query.eq('customer_id', filters.customerId)
  if (filters.search?.trim()) {
    query = query.ilike('payment_number', `%${filters.search.trim()}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as unknown as Payment[]
}

export async function createPayment(row: PaymentInsert): Promise<Payment> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([row])
    .select()
    .single()
  if (error) throw error
  return data as Payment
}

export async function updatePayment(id: string, row: PaymentUpdate): Promise<Payment> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(row)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Payment
}

export async function deletePayment(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}
