import { supabase } from '@/services/supabase/client'
import type { Customer, CustomerInsert, CustomerUpdate, CustomersFilter } from '@/models'

const TABLE = 'customers'

export async function fetchCustomers(filters: CustomersFilter = {}): Promise<Customer[]> {
  let query = supabase
    .from(TABLE)
    .select('*')
    .order('name', { ascending: true })

  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.query?.trim()) {
    const q = filters.query.trim()
    query = query.or(
      `name.ilike.%${q}%,code.ilike.%${q}%,phone.ilike.%${q}%`,
    )
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Customer[]
}

export async function createCustomer(row: CustomerInsert): Promise<Customer> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([row])
    .select()
    .single()
  if (error) throw error
  return data as Customer
}

export async function updateCustomer(id: string, row: CustomerUpdate): Promise<Customer> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(row)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Customer
}

export async function deleteCustomer(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}

export async function fetchNextCustomerCode(): Promise<string> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('code')
    .ilike('code', 'KH-%')
    .order('code', { ascending: false })
    .limit(1)

  if (error) throw error

  if (!data || data.length === 0) return 'KH-001'

  const first = data[0]
  if (!first) return 'KH-001'
  const lastCode = first.code
  const match = lastCode.match(/^KH-(\d+)$/)
  if (!match?.[1]) return 'KH-001'

  const nextNum = parseInt(match[1], 10) + 1
  return `KH-${String(nextNum).padStart(3, '0')}`
}
