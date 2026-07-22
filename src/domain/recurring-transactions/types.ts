/**
 * Recurring Transaction domain types.
 * Pure TypeScript — no React or Supabase dependency.
 */
import type { ExpenseCategory } from '@/schema/payment.schema';

export type RecurringFrequency = 'monthly' | 'quarterly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  tenant_id: string;
  name: string;
  category: ExpenseCategory;
  amount: number;
  frequency: RecurringFrequency;
  day_of_month: number;
  supplier_id: string | null;
  employee_id: string | null;
  account_id: string | null;
  description: string;
  notes: string | null;
  is_active: boolean;
  last_generated_date: string | null;
  next_run_date: string;
  created_at: string;
  updated_at: string;
  /** Joined relations (optional) */
  suppliers?: { name: string; code: string } | null;
  employees?: { name: string; code: string } | null;
  payment_accounts?: { name: string } | null;
}

export type RecurringQuickFilter =
  | 'all'
  | 'overdue'
  | 'today'
  | '7days'
  | 'active';

export type RecurringStatusFilter = 'active' | 'paused';

export interface RecurringTransactionFilter {
  search?: string;
  category?: ExpenseCategory;
  frequency?: RecurringFrequency;
  isActive?: boolean;
  status?: RecurringStatusFilter;
  quickFilter?: RecurringQuickFilter;
}
