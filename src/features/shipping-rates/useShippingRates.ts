import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchShippingRates,
  fetchActiveShippingRates,
  createShippingRate,
  updateShippingRate,
  deleteShippingRate,
} from '@/api/shipping-rates.api'
import type { ShippingRateFormValues } from './shipping-rates.module'
import type { ShippingRateFilter } from './types'

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
    queryFn: () => fetchShippingRates(filters),
  })
}

/** List chỉ active — dùng cho dropdown trong ShipmentForm */
export function useActiveShippingRates() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'active'],
    queryFn: fetchActiveShippingRates,
  })
}

export function useCreateShippingRate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: ShippingRateFormValues) => createShippingRate(toDbRow(values)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useUpdateShippingRate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ShippingRateFormValues }) =>
      updateShippingRate(id, toDbRow(values)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useDeleteShippingRate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteShippingRate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}
