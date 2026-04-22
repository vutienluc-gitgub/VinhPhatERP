/**
 * PaymentDomain — business logic cho quan ly thanh toan, thu/chi va cong no.
 * Pure TypeScript, khong phu thuoc React hay Supabase.
 *
 * DEPENDENCY RULE: Chi import tu @/schema (contract layer).
 * KHONG DUOC import tu @/features, @/api, @/services.
 */

import type {
  PaymentsFormValues,
  ExpenseFormValues,
  ExpenseCategory,
  PaymentMethod,
} from '@/schema/payment.schema';

// ─── Domain-owned Output Types ────────────────────────────────────────────────

/** Payload insert cho bang payments (domain dinh nghia, api/features tieu thu) */
export interface PaymentDbPayload {
  payment_number: string;
  order_id: string;
  customer_id: string;
  payment_date: string;
  amount: number;
  payment_method: PaymentMethod;
  account_id: string | null;
  reference_number: string | null;
}

/** Payload insert cho bang expenses (domain dinh nghia, api/features tieu thu) */
export interface ExpenseDbPayload {
  expense_number: string;
  category: ExpenseCategory;
  amount: number;
  expense_date: string;
  account_id: string | null;
  supplier_id: string | null;
  employee_id: string | null;
  description: string;
  reference_number: string | null;
  notes: string | null;
  allocations?: Array<{
    document_type: 'weaving_invoice' | 'yarn_receipt';
    document_id: string;
    allocated_amount: number;
  }>;
}

// ─── Data Mapping ─────────────────────────────────────────────────────────────

/**
 * Anh xa form tao Phieu Thu (Payment) sang payload DB.
 */
export function mapPaymentFormToDb(
  values: PaymentsFormValues,
): PaymentDbPayload {
  return {
    payment_number: values.paymentNumber.trim(),
    order_id: values.orderId,
    customer_id: values.customerId,
    payment_date: values.paymentDate,
    amount: values.amount,
    payment_method: values.paymentMethod,
    account_id: values.accountId || null,
    reference_number: values.referenceNumber?.trim() || null,
  };
}

/**
 * Anh xa form tao/sua Phieu Chi (Expense) sang payload DB.
 */
export function mapExpenseFormToDb(
  values: ExpenseFormValues,
): ExpenseDbPayload {
  return {
    expense_number: values.expenseNumber.trim(),
    category: (values.category || 'other') as ExpenseCategory,
    amount: values.amount,
    expense_date: values.expenseDate,
    account_id: values.accountId || null,
    supplier_id: values.supplierId || null,
    employee_id: values.employeeId || null,
    description: values.description.trim(),
    reference_number: values.referenceNumber?.trim() || null,
    notes: values.notes?.trim() || null,
    allocations: values.allocations,
  };
}

// ─── Calculations ─────────────────────────────────────────────────────────────

/**
 * Tính số tiền bảo lưu / dư nợ (Balance Due).
 * Áp dụng được cho cả khách hàng (Customer) lẫn nhà cung cấp (Supplier).
 */
export function calculateBalanceDue(
  totalAmount: number,
  paidAmount: number,
): number {
  return Math.max(0, totalAmount - paidAmount);
}

/**
 * Tính tỷ lệ phần trăm đã thanh toán.
 */
export function calculatePaymentPercentage(
  totalAmount: number,
  paidAmount: number,
): number {
  if (totalAmount <= 0) return 0;
  return Math.min(100, Math.round((paidAmount / totalAmount) * 100));
}

/**
 * Tính tổng nợ của một danh sách (customer debts hoặc supplier debts).
 */
export function calculateTotalDebt(
  debts: Array<{ balance_due: number } | undefined | null>,
): number {
  return debts.reduce((sum: number, d) => sum + (d?.balance_due || 0), 0);
}

/**
 * Đếm số lượng đối tượng (khách hàng/nhà cung cấp) đang có nợ.
 */
export function countOverdueDebts(
  debts: Array<{ balance_due: number } | undefined | null>,
): number {
  return debts.filter((d) => d && isDebtRisky(d.balance_due)).length;
}

// ─── Status & Guards ──────────────────────────────────────────────────────────

/**
 * Kiểm tra xem một đối tác có đang bị nợ xấu (Overdue) hay không.
 * Mức tolerance = 0, nghĩa là balance_due > 0 được coi là nợ rủi ro.
 */
export function isDebtRisky(balanceDue: number): boolean {
  return balanceDue > 0;
}
