import type { PaymentMethod, AccountType, ExpenseCategory } from '@/schema/payment.schema'
export type { PaymentMethod, AccountType, ExpenseCategory }

/* ── Payment (Phiếu thu) ── */

export type Payment = {
  id: string
  payment_number: string
  order_id: string
  customer_id: string
  payment_date: string
  amount: number
  payment_method: PaymentMethod
  account_id: string | null
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

/* ── Payment Account (Tài khoản thanh toán) ── */

export type PaymentAccount = {
  id: string
  name: string
  type: AccountType
  bank_name: string | null
  account_number: string | null
  initial_balance: number
  current_balance: number
  status: string
  notes: string | null
  created_at: string
  updated_at: string
}

/* ── Expense (Phiếu chi) ── */

export type Expense = {
  id: string
  expense_number: string
  category: ExpenseCategory
  amount: number
  expense_date: string
  account_id: string | null
  supplier_id: string | null
  description: string
  reference_number: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  /** Joined */
  suppliers?: { name: string; code: string } | null
  payment_accounts?: { name: string } | null
}

export type ExpensesFilter = {
  search?: string
  category?: ExpenseCategory
  supplierId?: string
}

/* ── Debt Summaries ── */

export type DebtSummaryRow = {
  customer_id: string
  customer_name: string
  customer_code: string
  total_ordered: number
  total_paid: number
  balance_due: number
  order_count: number
}

export type SupplierDebtRow = {
  supplier_id: string
  supplier_name: string
  supplier_code: string
  total_purchased: number
  total_paid: number
  balance_due: number
  supplier_category?: string | null
  pending_work_value?: number | null
  document_count: number
}

/* ── Cash Flow ── */

export type CashFlowRow = {
  period: string
  total_inflow: number
  total_outflow: number
  net_flow: number
  inflow_count: number
  outflow_count: number
}

export type ExpenseByCategoryRow = {
  category: ExpenseCategory
  total_amount: number
  expense_count: number
}
