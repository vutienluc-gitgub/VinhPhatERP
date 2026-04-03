export type ShippingRate = {
  id: string
  name: string
  destination_area: string
  rate_per_trip: number | null
  rate_per_meter: number | null
  rate_per_kg: number | null
  loading_fee: number
  min_charge: number
  is_active: boolean
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type ShippingRateFilter = {
  query?: string
  isActive?: boolean
}
