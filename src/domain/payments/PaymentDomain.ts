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

// ─── Debt Risk Classification ─────────────────────────────────────────────────

/** Mức rủi ro nợ (4 tier) */
export type DebtRiskTier = 'none' | 'normal' | 'warning' | 'danger';

/** Ngưỡng phân loại nợ quá hạn (ngày) */
const OVERDUE_WARNING_DAYS = 30;

interface DebtRiskInput {
  balance_due: number;
  /** Số ngày quá hạn lâu nhất (từ delivery_date hoặc order_date) */
  oldest_overdue_days?: number | null;
  /** Hạn mức tín dụng (credit_limit) của khách hàng */
  credit_limit?: number | null;
}

/**
 * Phân loại mức rủi ro nợ cho 1 đối tượng (khách hàng / nhà cung cấp).
 *
 * Tier logic:
 * - none:    balance_due <= 0 → không có nợ
 * - normal:  có nợ, chưa quá hạn, chưa vượt hạn mức
 * - warning: quá hạn < 30 ngày HOẶC nợ >= 80% credit_limit
 * - danger:  quá hạn >= 30 ngày HOẶC vượt credit_limit
 */
export function classifyDebtRisk(input: DebtRiskInput): DebtRiskTier {
  if (input.balance_due <= 0) return 'none';

  const overdueDays = input.oldest_overdue_days ?? 0;
  const creditLimit = input.credit_limit ?? 0;

  // Danger: quá hạn lâu hoặc vượt hạn mức tín dụng
  if (overdueDays >= OVERDUE_WARNING_DAYS) return 'danger';
  if (creditLimit > 0 && input.balance_due > creditLimit) return 'danger';

  // Warning: quá hạn ngắn hoặc gần chạm hạn mức (>= 80%)
  if (overdueDays > 0) return 'warning';
  if (creditLimit > 0 && input.balance_due >= creditLimit * 0.8)
    return 'warning';

  // Normal: có nợ nhưng trong hạn, trong hạn mức
  return 'normal';
}

/**
 * Backward-compatible: trả true nếu debt tier >= warning.
 * Dùng cho countOverdueDebts và KPI.
 */
export function isDebtRisky(input: DebtRiskInput): boolean {
  const tier = classifyDebtRisk(input);
  return tier === 'warning' || tier === 'danger';
}

/**
 * Đếm số lượng đối tượng đang có nợ (balance > 0).
 */
export function countDebtors(
  debts: Array<{ balance_due: number } | undefined | null>,
): number {
  return debts.filter((d) => d && d.balance_due > 0).length;
}

/**
 * Đếm số lượng đối tượng ở mức cảnh báo trở lên.
 */
export function countRiskyDebts(
  debts: Array<DebtRiskInput | undefined | null>,
): number {
  return debts.filter((d) => d && isDebtRisky(d)).length;
}

/**
 * @deprecated Dùng countDebtors hoặc countRiskyDebts thay thế.
 * Giữ lại để không break existing callers — sẽ xóa sau migration.
 */
export function countOverdueDebts(
  debts: Array<{ balance_due: number } | undefined | null>,
): number {
  return countDebtors(debts);
}
