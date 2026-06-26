/**
 * RecurringTransactionDomain — business logic for recurring expense generation.
 * Pure TypeScript, no React or Supabase dependency.
 *
 * DEPENDENCY RULE: Only import from @/schema (contract layer).
 * DO NOT import from @/features, @/api, @/services.
 */

import type { ExpenseCategory } from '@/schema/payment.schema';
import type { RecurringTransactionFormValues } from '@/schema/recurring-transaction.schema';

import type { RecurringFrequency } from './types';

// ─── Domain-owned Output Types ────────────────────────────────────────────────

/** Payload for upserting into recurring_transactions table */
export interface RecurringTransactionDbPayload {
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
  next_run_date: string;
}

// ─── Data Mapping ─────────────────────────────────────────────────────────────

/**
 * Map form values to DB payload for recurring_transactions table.
 */
export function mapRecurringTransactionFormToDb(
  values: RecurringTransactionFormValues,
): RecurringTransactionDbPayload {
  return {
    name: values.name.trim(),
    category: values.category,
    amount: values.amount,
    frequency: values.frequency,
    day_of_month: values.dayOfMonth,
    supplier_id: values.supplierId || null,
    employee_id: values.employeeId || null,
    account_id: values.accountId || null,
    description: values.description.trim(),
    notes: values.notes?.trim() || null,
    is_active: values.isActive,
    next_run_date: values.nextRunDate,
  };
}

// ─── Date Calculations ────────────────────────────────────────────────────────

/**
 * Calculate the next run date after a given date for a recurring frequency.
 */
export function calculateNextRunDate(
  frequency: RecurringFrequency,
  dayOfMonth: number,
  afterDate: Date = new Date(),
): string {
  const result = new Date(afterDate);

  switch (frequency) {
    case 'monthly':
      result.setMonth(result.getMonth() + 1);
      break;
    case 'quarterly':
      result.setMonth(result.getMonth() + 3);
      break;
    case 'yearly':
      result.setFullYear(result.getFullYear() + 1);
      break;
  }

  // Clamp day_of_month to actual days in month
  const lastDay = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate();
  const clampedDay = Math.min(dayOfMonth, lastDay);
  result.setDate(clampedDay);

  return result.toISOString().slice(0, 10);
}

/**
 * Calculate the initial next run date based on day_of_month and frequency.
 * If the day hasn't passed yet this month, use this month. Otherwise next period.
 */
export function calculateInitialNextRunDate(
  frequency: RecurringFrequency,
  dayOfMonth: number,
): string {
  const today = new Date();
  const currentDay = today.getDate();

  if (currentDay <= dayOfMonth) {
    // Day hasn't passed yet — schedule for this month
    const lastDay = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
    ).getDate();
    const clampedDay = Math.min(dayOfMonth, lastDay);
    const result = new Date(today.getFullYear(), today.getMonth(), clampedDay);
    return result.toISOString().slice(0, 10);
  }

  // Day has already passed — schedule for next period
  return calculateNextRunDate(frequency, dayOfMonth, today);
}

// ─── Status Logic ─────────────────────────────────────────────────────────────

export type RecurringStatus = 'active' | 'paused' | 'overdue';

/**
 * Determine the display status of a recurring transaction.
 */
export function getRecurringStatus(tx: {
  is_active: boolean;
  next_run_date: string;
}): RecurringStatus {
  if (!tx.is_active) return 'paused';

  const nextRun = new Date(tx.next_run_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (nextRun < today) return 'overdue';
  return 'active';
}

/**
 * Check if a recurring transaction is due (should generate an expense).
 */
export function isDue(nextRunDate: string): boolean {
  const next = new Date(nextRunDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  next.setHours(0, 0, 0, 0);
  return next <= today;
}

/**
 * Returns the number of days from today to the given date.
 * Negative number means the date is in the past (overdue).
 * Positive number means the date is in the future.
 * 0 means today.
 */
export function getRelativeDays(dateString: string): number {
  const target = new Date(dateString);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export type RelativeDateColor = 'danger' | 'warning' | 'info' | 'success';

/**
 * Returns a color representation based on the relative days.
 * - Overdue (days < 0): danger
 * - Today (days === 0): warning
 * - Soon (0 < days <= 7): info
 * - Future (days > 7): success
 */
export function getRelativeDateColor(days: number): RelativeDateColor {
  if (days < 0) return 'danger';
  if (days === 0) return 'warning';
  if (days <= 7) return 'info';
  return 'success';
}
