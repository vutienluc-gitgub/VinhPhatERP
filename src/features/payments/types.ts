export type PaymentMethod = 'cash' | 'bank_transfer' | 'check' | 'other'

export type Payment = {
  id: string
  payment_number: string
  order_id: string
  customer_id: string
  payment_date: string
  amount: number
  payment_method: PaymentMethod
  reference_number: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  /** Joined */
  orders?: { order_number: string; total_amount: number; paid_amount: number } | null
  customers?: { name: string; code: string } | null
}

export type PaymentsFilter = {
  search?: string
  orderId?: string
  customerId?: string
}

export type DebtSummaryRow = {
  customer_id: string
  customer_name: string
  customer_code: string
  total_ordered: number
  total_paid: number
  balance_due: number
  order_count: number
}
