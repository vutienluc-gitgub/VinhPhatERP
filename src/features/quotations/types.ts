export type QuotationStatus = 'draft' | 'sent' | 'confirmed' | 'rejected' | 'expired' | 'converted'

export type DiscountType = 'percent' | 'amount'

export type QuotationItem = {
  id: string
  quotation_id: string
  fabric_type: string
  color_name: string | null
  color_code: string | null
  width_cm: number | null
  quantity: number
  unit: string
  unit_price: number
  amount: number
  lead_time_days: number | null
  notes: string | null
  sort_order: number
}

export type Quotation = {
  id: string
  quotation_number: string
  customer_id: string
  quotation_date: string
  valid_until: string | null
  subtotal: number
  discount_type: DiscountType
  discount_value: number
  discount_amount: number
  total_before_vat: number
  vat_rate: number
  vat_amount: number
  total_amount: number
  status: QuotationStatus
  revision: number
  parent_quotation_id: string | null
  converted_order_id: string | null
  delivery_terms: string | null
  payment_terms: string | null
  notes: string | null
  created_by: string | null
  confirmed_at: string | null
  created_at: string
  updated_at: string
  /** Joined from customers table */
  customers?: { name: string; code: string } | null
  quotation_items?: QuotationItem[]
}

export type QuotationsFilter = {
  search?: string
  status?: QuotationStatus
  customerId?: string
}
