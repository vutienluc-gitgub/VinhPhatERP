import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/services/supabase/client'
import type { ShippingRateFormValues } from './shipping-rates.module'
import type { ShippingRate, ShippingRateFilter } from './types'

const TABLE = 'shipping_rates'
const QUERY_KEY = ['shipping-rates'] as const

function toDbRow(values: ShippingRateFormValues) {
  return {
    name: values.name.trim(),
    destination_area: values.destinationArea.trim(),
    rate_per_trip: values.ratePerTrip,
    rate_per_meter: values.ratePerMeter,
    rate_per_kg: values.ratePerKg,
    loading_fee: values.loadingFee,
    min_charge: values.minCharge,
    is_active: values.isActive,
    notes: values.notes?.trim() || null,
  }
}

export function useShippingRateList(filters: ShippingRateFilter = {}) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters],
    queryFn: async () => {
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
    },
  })
}

/** List chỉ active — dùng cho dropdown trong ShipmentForm */
export function useActiveShippingRates() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('is_active', true)
        .order('destination_area')

      if (error) throw error
      return (data ?? []) as ShippingRate[]
    },
  })
}

export function useCreateShippingRate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: ShippingRateFormValues) => {
      const { data, error } = await supabase
        .from(TABLE)
        .insert([toDbRow(values)])
        .select()
        .single()
      if (error) throw error
      return data as ShippingRate
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useUpdateShippingRate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: ShippingRateFormValues }) => {
      const { data, error } = await supabase
        .from(TABLE)
        .update(toDbRow(values))
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as ShippingRate
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useDeleteShippingRate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(TABLE).delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}
