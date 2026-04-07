import type { ShippingRate, ShippingRateFilter } from '@/features/shipping-rates/types'

import { supabase } from '@/services/supabase/client'

const TABLE = 'shipping_rates'

type ShippingRateRow = {
  name: string
  destination_area: string
  rate_per_trip: number | null
  rate_per_meter: number | null
  rate_per_kg: number | null
  loading_fee: number
  min_charge: number
  is_active: boolean
  notes: string | null
}

export async function fetchShippingRates(filters: ShippingRateFilter = {}): Promise<ShippingRate[]> {
  let query = supabase
    .from(TABLE)
    .select('*')
    .order('destination_area')

  if (filters.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive)
  }

  if (filters.query?.trim()) {
    const q = filters.query.trim()
    query = query.or(`name.ilike.%${q}%,destination_area.ilike.%${q}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as ShippingRate[]
}

export async function fetchActiveShippingRates(): Promise<ShippingRate[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('is_active', true)
    .order('destination_area')
  if (error) throw error
  return (data ?? []) as ShippingRate[]
}

export async function createShippingRate(row: ShippingRateRow): Promise<ShippingRate> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([row])
    .select()
    .single()
  if (error) throw error
  return data as ShippingRate
}

export async function updateShippingRate(id: string, row: ShippingRateRow): Promise<ShippingRate> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(row)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as ShippingRate
}

export async function deleteShippingRate(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}
