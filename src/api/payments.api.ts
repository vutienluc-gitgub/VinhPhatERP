import type {
  PaymentAccount,
  PaymentsFilter,
  Expense,
  ExpensesFilter,
  CashFlowRow,
  ExpenseByCategoryRow,
  SupplierDebtRow,
  DebtSummaryRow,
  ExpenseCategory,
} from '@/features/payments/types'

import type { Payment, PaymentInsert } from '@/models'
import { supabase } from '@/services/supabase/client'

import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination'
import type { PaginatedResult } from '@/shared/types/pagination'

/* ─── Payments ─────────────────────────────────── */

const PAYMENTS_TABLE = 'payments'

export async function fetchPaymentsPaginated(
  filters: PaymentsFilter = {},
  page = 1,
): Promise<PaginatedResult<Payment>> {
  const from = (page - 1) * DEFAULT_PAGE_SIZE
  const to = from + DEFAULT_PAGE_SIZE - 1

  let query = supabase
    .from(PAYMENTS_TABLE)
    .select('*, orders(order_number, total_amount, paid_amount), customers(name, code)', { count: 'exact' })
    .order('payment_date', { ascending: false })
    .range(from, to)

  if (filters.orderId) query = query.eq('order_id', filters.orderId)
  if (filters.customerId) query = query.eq('customer_id', filters.customerId)
  if (filters.search?.trim()) query = query.ilike('payment_number', `%${filters.search.trim()}%`)

  const { data, error, count } = await query
  if (error) throw error
  const total = count ?? 0
  return {
    data: (data ?? []) as unknown as Payment[],
    total,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: Math.ceil(total / DEFAULT_PAGE_SIZE),
  }
}

export async function fetchPaymentsByOrder(orderId: string): Promise<Payment[]> {
  const { data, error } = await supabase
    .from(PAYMENTS_TABLE)
    .select('*')
    .eq('order_id', orderId)
    .order('payment_date', { ascending: false })
  if (error) throw error
  return (data ?? []) as Payment[]
}

export async function fetchNextPaymentNumber(): Promise<string> {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const prefix = `TT${yy}${mm}-`

  const { data, error } = await supabase
    .from(PAYMENTS_TABLE)
    .select('payment_number')
    .ilike('payment_number', `${prefix}%`)
    .order('payment_number', { ascending: false })
    .limit(1)

  if (error) throw error
  if (!data || data.length === 0) return `${prefix}0001`
  const last = data[0]?.payment_number ?? ''
  const match = last.match(/(\d{4})$/)
  if (!match?.[1]) return `${prefix}0001`
  return `${prefix}${String(parseInt(match[1], 10) + 1).padStart(4, '0')}`
}

export async function createPaymentRecord(row: PaymentInsert): Promise<Payment> {
  const { data, error } = await supabase.from(PAYMENTS_TABLE).insert([row]).select().single()
  if (error) throw error
  return data as Payment
}

export async function deletePaymentRecord(id: string): Promise<void> {
  const { error } = await supabase.from(PAYMENTS_TABLE).delete().eq('id', id)
  if (error) throw error
}

export async function fetchDebtSummary(): Promise<DebtSummaryRow[]> {
  const { data, error } = await supabase.rpc('get_debt_summary')
  if (error) throw error
  return (data ?? []) as DebtSummaryRow[]
}

/* ─── Payment Accounts ──────────────────────────── */

export type AccountInsertRow = {
  name: string
  type: string
  bank_name: string | null
  account_number: string | null
  initial_balance: number
  current_balance?: number
  notes: string | null
  status: string
}

export async function fetchPaymentAccounts(showInactive = false): Promise<PaymentAccount[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any).from('payment_accounts').select('*').order('name', { ascending: true })
  if (!showInactive) query = query.eq('status', 'active')
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as PaymentAccount[]
}

export async function createPaymentAccount(row: AccountInsertRow): Promise<PaymentAccount> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).from('payment_accounts').insert(row).select().single()
  if (error) throw error
  return data as PaymentAccount
}

export async function updatePaymentAccount(id: string, row: Omit<AccountInsertRow, 'current_balance'>): Promise<PaymentAccount> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).from('payment_accounts').update(row).eq('id', id).select().single()
  if (error) throw error
  return data as PaymentAccount
}

export async function deletePaymentAccount(id: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('payment_accounts').delete().eq('id', id)
  if (error) throw error
}

/* ─── Expenses ──────────────────────────────────── */

const EXPENSES_TABLE = 'expenses'

export type ExpenseInsertRow = {
  expense_number: string
  category: ExpenseCategory
  amount: number
  expense_date: string
  account_id: string | null
  supplier_id: string | null
  description: string
  reference_number: string | null
  notes: string | null
}

export async function fetchExpensesPaginated(
  filters: ExpensesFilter = {},
  page = 1,
): Promise<PaginatedResult<Expense>> {
  const from = (page - 1) * DEFAULT_PAGE_SIZE
  const to = from + DEFAULT_PAGE_SIZE - 1

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('expenses')
    .select('*, suppliers(name, code), payment_accounts(name)', { count: 'exact' })
    .order('expense_date', { ascending: false })
    .range(from, to)

  if (filters.category) query = query.eq('category', filters.category)
  if (filters.supplierId) query = query.eq('supplier_id', filters.supplierId)
  if (filters.search?.trim()) {
    const q = filters.search.trim()
    query = query.or(`expense_number.ilike.%${q}%,description.ilike.%${q}%`)
  }

  const { data, error, count } = await query
  if (error) throw error
  const total = count ?? 0
  return {
    data: (data ?? []) as unknown as Expense[],
    total,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: Math.ceil(total / DEFAULT_PAGE_SIZE),
  }
}

export async function fetchNextExpenseNumber(): Promise<string> {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const prefix = `PC${yy}${mm}-`

  const { data, error } = await supabase
    .from(EXPENSES_TABLE)
    .select('expense_number')
    .ilike('expense_number', `${prefix}%`)
    .order('expense_number', { ascending: false })
    .limit(1)

  if (error) throw error
  if (!data || data.length === 0) return `${prefix}0001`
  const last = data[0]?.expense_number ?? ''
  const match = last.match(/(\d{4})$/)
  if (!match?.[1]) return `${prefix}0001`
  return `${prefix}${String(parseInt(match[1], 10) + 1).padStart(4, '0')}`
}

export async function createExpense(row: ExpenseInsertRow): Promise<Expense> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).from('expenses').insert(row).select().single()
  if (error) throw error
  return data as Expense
}

export async function updateExpense(id: string, row: ExpenseInsertRow): Promise<Expense> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).from('expenses').update(row).eq('id', id).select().single()
  if (error) throw error
  return data as Expense
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from(EXPENSES_TABLE).delete().eq('id', id)
  if (error) throw error
}

/* ─── Cash flow (RPC) ───────────────────────────── */

export async function fetchCashFlowSummary(fromDate: string, toDate: string): Promise<CashFlowRow[]> {
  const { data, error } = await supabase.rpc('get_cash_flow_summary', { p_from: fromDate, p_to: toDate })
  if (error) throw error
  return (data ?? []) as CashFlowRow[]
}

export async function fetchExpenseByCategory(fromDate: string, toDate: string): Promise<ExpenseByCategoryRow[]> {
  const { data, error } = await supabase.rpc('get_expense_by_category', { p_from: fromDate, p_to: toDate })
  if (error) throw error
  return (data ?? []) as ExpenseByCategoryRow[]
}

export async function fetchSupplierDebt(): Promise<SupplierDebtRow[]> {
  const { data, error } = await supabase.from('v_supplier_debt').select('*')
  if (error) throw error
  return (data ?? []) as unknown as SupplierDebtRow[]
}
