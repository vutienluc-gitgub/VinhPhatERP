import type { TableRow, TableInsert, TableUpdate } from './common'

export type Payment = TableRow<'payments'> & {
  orders?: { order_number: string; total_amount: number; paid_amount: number } | null
  customers?: { name: string; code: string } | null
}

export type PaymentInsert = TableInsert<'payments'>
export type PaymentUpdate = TableUpdate<'payments'>

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
