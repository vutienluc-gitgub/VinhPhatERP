import { supabase } from '@/services/supabase/client'
import type { Supplier, SupplierInsert, SupplierUpdate, SupplierFilter } from '@/models'

const TABLE = 'suppliers'

export async function fetchSuppliers(filters: SupplierFilter = {}): Promise<Supplier[]> {
  let query = supabase
    .from(TABLE)
    .select('*')
    .order('name', { ascending: true })

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.category) query = query.eq('category', filters.category)
  if (filters.search?.trim()) {
    const q = filters.search.trim()
    query = query.or(
      `name.ilike.%${q}%,code.ilike.%${q}%,phone.ilike.%${q}%`,
    )
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Supplier[]
}

export async function createSupplier(row: SupplierInsert): Promise<Supplier> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([row])
    .select()
    .single()
  if (error) throw error
  return data as Supplier
}

export async function updateSupplier(id: string, row: SupplierUpdate): Promise<Supplier> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(row)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Supplier
}

export async function deleteSupplier(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}
