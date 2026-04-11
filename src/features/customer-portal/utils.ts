/**
 * Pure utility functions for Customer Portal.
 * No React or Supabase dependencies — safe to use in tests.
 */

/** Filter records to only those matching the given customerId */
export function applyCustomerFilter<T extends { customer_id: string }>(
  records: T[],
  customerId: string,
): T[] {
  return records.filter((r) => r.customer_id === customerId);
}

/** Sort records by a date field descending (newest first) */
export function sortByDateDesc<T>(records: T[], dateField: keyof T): T[] {
  return [...records].sort((a, b) => {
    const da = new Date(a[dateField] as string).getTime();
    const db = new Date(b[dateField] as string).getTime();
    return db - da;
  });
}

export interface DebtSummary {
  total_amount: number;
  paid_amount: number;
  remaining_debt: number;
}

/** Compute debt summary: remaining = total - paid */
export function computeDebtSummary(
  totalAmount: number,
  paidAmount: number,
): DebtSummary {
  return {
    total_amount: totalAmount,
    paid_amount: paidAmount,
    remaining_debt: totalAmount - paidAmount,
  };
}

export interface StageOverdueInput {
  actual_date: string | null;
  planned_date: string | null;
}

/** Determine if a production stage is overdue: actual_date > planned_date */
export function computeStageOverdue(stage: StageOverdueInput): {
  is_overdue: boolean;
} {
  if (!stage.actual_date || !stage.planned_date) {
    return { is_overdue: false };
  }
  return {
    is_overdue: new Date(stage.actual_date) > new Date(stage.planned_date),
  };
}

/** Split a list into pages of pageSize */
export function paginateList<T>(records: T[], pageSize: number): T[][] {
  if (pageSize <= 0) return [];
  const pages: T[][] = [];
  for (let i = 0; i < records.length; i += pageSize) {
    pages.push(records.slice(i, i + pageSize));
  }
  return pages;
}
