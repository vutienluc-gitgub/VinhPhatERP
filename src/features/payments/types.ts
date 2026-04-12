import type {
  TableRow,
  TableInsert,
  TableUpdate,
} from '@/shared/types/database.models';
import type {
  PaymentMethod,
  AccountType,
  ExpenseCategory,
} from '@/schema/payment.schema';

export type { PaymentMethod, AccountType, ExpenseCategory };

/* ── Payment (Phiếu thu) ── */
export type Payment = TableRow<'payments'> & {
  orders?: {
    order_number: string;
    total_amount: number;
    paid_amount: number;
  } | null;
  customers?: { name: string; code: string } | null;
};
export type PaymentInsert = TableInsert<'payments'>;
export type PaymentUpdate = TableUpdate<'payments'>;

export type PaymentsFilter = {
  search?: string;
  orderId?: string;
  customerId?: string;
};

/* ── Payment Account (Tài khoản thanh toán) ── */
export type PaymentAccount = TableRow<'payment_accounts'>;
export type PaymentAccountInsert = TableInsert<'payment_accounts'>;
export type PaymentAccountUpdate = TableUpdate<'payment_accounts'>;

/* ── Expense (Phiếu chi) ── */
export type Expense = TableRow<'expenses'> & {
  suppliers?: { name: string; code: string } | null;
  payment_accounts?: { name: string } | null;
};
export type ExpenseInsert = TableInsert<'expenses'>;
export type ExpenseUpdate = TableUpdate<'expenses'>;

export type ExpensesFilter = {
  search?: string;
  category?: ExpenseCategory;
  supplierId?: string;
};

/* ── Debt Summaries ── */
export type DebtSummaryRow = {
  customer_id: string;
  customer_name: string;
  customer_code: string;
  total_ordered: number;
  total_paid: number;
  balance_due: number;
  order_count: number;
};

export type SupplierDebtRow = {
  supplier_id: string;
  supplier_name: string;
  supplier_code: string;
  total_purchased: number;
  total_paid: number;
  balance_due: number;
  supplier_category?: string | null;
  pending_work_value?: number | null;
  document_count: number;
};

/* ── Cash Flow ── */
export type CashFlowRow = {
  period: string;
  total_inflow: number;
  total_outflow: number;
  net_flow: number;
  inflow_count: number;
  outflow_count: number;
};

export type ExpenseByCategoryRow = {
  category: ExpenseCategory;
  total_amount: number;
  expense_count: number;
};
