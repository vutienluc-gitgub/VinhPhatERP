/**
 * PaymentDomain — business logic cho quản lý thanh toán, thu/chi và công nợ.
 * Pure TypeScript, không phụ thuộc React hay Supabase.
 */

import type { PaymentInsert } from '@/features/payments/types';
import type {
  PaymentsFormValues,
  ExpenseFormValues,
  ExpenseCategory,
} from '@/schema/payment.schema';
import type { ExpenseInsertRow } from '@/api/payments.api';

// ─── Data Mapping ─────────────────────────────────────────────────────────────

/**
 * Ánh xạ form tạo Phiếu Thu (Payment) sang payload DB.
 */
export function mapPaymentFormToDb(values: PaymentsFormValues): PaymentInsert {
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
 * Ánh xạ form tạo/sửa Phiếu Chi (Expense) sang payload DB.
 */
export function mapExpenseFormToDb(
  values: ExpenseFormValues,
): ExpenseInsertRow {
  return {
    expense_number: values.expenseNumber.trim(),
    category: (values.category || 'other') as ExpenseCategory,
    amount: values.amount,
    expense_date: values.expenseDate,
    account_id: values.accountId || null,
    supplier_id: values.supplierId || null,
    description: values.description.trim(),
    reference_number: values.referenceNumber?.trim() || null,
    notes: values.notes?.trim() || null,
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
