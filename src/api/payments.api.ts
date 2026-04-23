import type {
  PaymentAccount,
  PaymentsFilter,
  Expense,
  ExpensesFilter,
  CashFlowRow,
  ExpenseByCategoryRow,
  SupplierDebtRow,
  DebtSummaryRow,
} from '@/features/payments/types';
import type { Payment } from '@/features/payments/types';
import type { PaymentDbPayload, ExpenseDbPayload } from '@/domain/payments';
import { supabase } from '@/services/supabase/client';
import { untypedDb } from '@/services/supabase/untyped';
import { getTenantId } from '@/services/supabase/tenant';
import {
  fetchNextDocNumber,
  monthlyPrefix,
} from '@/api/helpers/next-doc-number';
import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination';
import type { PaginatedResult } from '@/shared/types/pagination';
import { paymentResponseSchema } from '@/schema/payment.schema';

/* ─── Payments ─────────────────────────────────── */

const PAYMENTS_TABLE = 'payments';

export async function fetchPaymentsPaginated(
  filters: PaymentsFilter = {},
  page = 1,
): Promise<PaginatedResult<Payment>> {
  const from = (page - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;

  let query = supabase
    .from(PAYMENTS_TABLE)
    .select(
      '*, orders(order_number, total_amount, paid_amount), customers(name, code)',
      { count: 'exact' },
    )
    .order('payment_date', { ascending: false })
    .range(from, to);

  if (filters.orderId) query = query.eq('order_id', filters.orderId);
  if (filters.customerId) query = query.eq('customer_id', filters.customerId);
  if (filters.search?.trim()) {
    const term = filters.search.trim();
    const { data: cus } = await supabase
      .from('customers')
      .select('id')
      .ilike('name', `%${term}%`);
    const cIds = cus?.map((c) => c.id) || [];
    if (cIds.length > 0) {
      query = query.or(
        `payment_number.ilike.%${term}%,customer_id.in.(${cIds.join(',')})`,
      );
    } else {
      query = query.or(`payment_number.ilike.%${term}%`);
    }
  }

  const { data, error, count } = await query;
  if (error) throw error;
  const total = count ?? 0;
  return {
    data: paymentResponseSchema.array().parse(data ?? []) as Payment[],
    total,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: Math.ceil(total / DEFAULT_PAGE_SIZE),
  };
}

export async function fetchPaymentsByOrder(
  orderId: string,
): Promise<Payment[]> {
  const { data, error } = await supabase
    .from(PAYMENTS_TABLE)
    .select('*')
    .eq('order_id', orderId)
    .order('payment_date', { ascending: false });
  if (error) throw error;
  return paymentResponseSchema.array().parse(data ?? []) as Payment[];
}

export async function fetchNextPaymentNumber(): Promise<string> {
  const { fetchNextDocNumber, monthlyPrefix } =
    await import('@/api/helpers/next-doc-number');
  return fetchNextDocNumber({
    table: 'payments',
    column: 'payment_number',
    prefix: monthlyPrefix('TT'),
  });
}

export async function createPaymentRecord(
  row: PaymentDbPayload,
): Promise<Payment> {
  const { data, error } = await untypedDb.rpc('rpc_create_payment', {
    p_data: row,
  });
  if (error) throw error;
  return data as unknown as Payment;
}

export async function deletePaymentRecord(id: string): Promise<void> {
  const { error } = await supabase.from(PAYMENTS_TABLE).delete().eq('id', id);
  if (error) throw error;
}

export async function fetchDebtSummary(): Promise<DebtSummaryRow[]> {
  const { data, error } = await supabase.rpc('rpc_get_debt_summary');
  if (error) throw error;
  return (data ?? []) as DebtSummaryRow[];
}

/* ─── Payment Accounts ──────────────────────────── */

export type AccountInsertRow = {
  name: string;
  type: string;
  bank_name: string | null;
  account_number: string | null;
  initial_balance: number;
  current_balance?: number;
  notes: string | null;
  status: string;
};

export async function fetchPaymentAccounts(
  showInactive = false,
): Promise<PaymentAccount[]> {
  // untypedDb because payment_accounts might not be in the generated types yet
  let query = untypedDb
    .from('payment_accounts')
    .select('*')
    .order('name', { ascending: true });
  if (!showInactive) query = query.eq('status', 'active');
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as PaymentAccount[];
}

export async function createPaymentAccount(
  row: AccountInsertRow,
): Promise<PaymentAccount> {
  const tenantId = await getTenantId();
  const { data, error } = await untypedDb
    .from('payment_accounts')
    .insert({
      ...row,
      tenant_id: tenantId,
    })
    .select()
    .single();
  if (error) throw error;
  return data as PaymentAccount;
}

export async function updatePaymentAccount(
  id: string,
  row: Omit<AccountInsertRow, 'current_balance'>,
): Promise<PaymentAccount> {
  const { data, error } = await untypedDb
    .from('payment_accounts')
    .update(row)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as PaymentAccount;
}

export async function deletePaymentAccount(id: string): Promise<void> {
  const { error } = await untypedDb
    .from('payment_accounts')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

/* ─── Expenses ──────────────────────────────────── */

const EXPENSES_TABLE = 'expenses';

export async function fetchExpensesPaginated(
  filters: ExpensesFilter = {},
  page = 1,
): Promise<PaginatedResult<Expense>> {
  const from = (page - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;

  // untypedDb because expenses table structure might change rapidly
  let query = untypedDb
    .from('expenses')
    .select('*, suppliers(name, code), payment_accounts(name)', {
      count: 'exact',
    })
    .order('expense_date', { ascending: false })
    .range(from, to);

  if (filters.category) query = query.eq('category', filters.category);
  if (filters.supplierId) query = query.eq('supplier_id', filters.supplierId);
  if (filters.search?.trim()) {
    const term = filters.search.trim();
    const { data: sups } = await supabase
      .from('suppliers')
      .select('id')
      .ilike('name', `%${term}%`);
    const sIds = sups?.map((s) => s.id) || [];
    if (sIds.length > 0) {
      query = query.or(
        `expense_number.ilike.%${term}%,description.ilike.%${term}%,supplier_id.in.(${sIds.join(',')})`,
      );
    } else {
      query = query.or(
        `expense_number.ilike.%${term}%,description.ilike.%${term}%`,
      );
    }
  }

  const { data, error, count } = await query;
  if (error) throw error;
  const total = count ?? 0;
  return {
    data: (data ?? []) as unknown as Expense[],
    total,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: Math.ceil(total / DEFAULT_PAGE_SIZE),
  };
}

export async function fetchNextExpenseNumber(): Promise<string> {
  return fetchNextDocNumber({
    table: 'expenses',
    column: 'expense_number',
    prefix: monthlyPrefix('PC'),
  });
}

export async function createExpense(row: ExpenseDbPayload): Promise<Expense> {
  const { data, error } = await untypedDb.rpc('rpc_create_expense', {
    p_data: row,
  });
  if (error) throw error;
  return data as unknown as Expense;
}

export async function updateExpense(
  id: string,
  row: ExpenseDbPayload,
): Promise<Expense> {
  const { data, error } = await untypedDb
    .from('expenses')
    .update(row)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Expense;
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from(EXPENSES_TABLE).delete().eq('id', id);
  if (error) throw error;
}

/* ─── Cash flow (RPC) ───────────────────────────── */

export async function fetchCashFlowSummary(
  fromDate: string,
  toDate: string,
): Promise<CashFlowRow[]> {
  const { data, error } = await supabase.rpc('rpc_get_cash_flow_summary', {
    p_from: fromDate,
    p_to: toDate,
  });
  if (error) throw error;
  return (data ?? []) as CashFlowRow[];
}

export async function fetchExpenseByCategory(
  fromDate: string,
  toDate: string,
): Promise<ExpenseByCategoryRow[]> {
  const { data, error } = await supabase.rpc('rpc_get_expense_by_category', {
    p_from: fromDate,
    p_to: toDate,
  });
  if (error) throw error;
  return (data ?? []) as ExpenseByCategoryRow[];
}

export async function fetchSupplierDebt(): Promise<SupplierDebtRow[]> {
  const { data, error } = await supabase.from('v_supplier_debt').select('*');
  if (error) throw error;
  return (data ?? []) as unknown as SupplierDebtRow[];
}

export async function fetchUnpaidDocuments(supplierId: string) {
  const { data, error } = await untypedDb
    .from('v_unpaid_documents')
    .select('*')
    .eq('supplier_id', supplierId)
    .order('document_date', { ascending: true });
  if (error) throw error;
  return data;
}
