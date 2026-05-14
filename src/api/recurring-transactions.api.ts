/**
 * Recurring Transactions API — Supabase CRUD operations.
 *
 * Uses safeUpsert for idempotent writes.
 * Generates expenses via createExpense RPC when a transaction is due.
 */
import type {
  RecurringTransaction,
  RecurringTransactionFilter,
} from '@/domain/recurring-transactions/types';
import type { RecurringTransactionDbPayload } from '@/domain/recurring-transactions';
import { untypedDb } from '@/services/supabase/untyped';
import { getTenantId } from '@/services/supabase/tenant';
import { safeUpsertOne } from '@/lib/db-guard';
import { createExpense } from '@/api/payments.api';
import {
  fetchNextDocNumber,
  monthlyPrefix,
} from '@/api/helpers/next-doc-number';
import { calculateNextRunDate, isDue } from '@/domain/recurring-transactions';
import type { RecurringFrequency } from '@/domain/recurring-transactions/types';

const TABLE = 'recurring_transactions';

/* ─── Read ─────────────────────────────────────── */

export async function fetchRecurringTransactions(
  filters: RecurringTransactionFilter = {},
): Promise<RecurringTransaction[]> {
  let query = untypedDb
    .from(TABLE)
    .select(
      '*, suppliers(name, code), employees(name, code), payment_accounts(name)',
    )
    .order('is_active', { ascending: false })
    .order('next_run_date', { ascending: true });

  if (filters.category) {
    query = query.eq('category', filters.category as never);
  }
  if (filters.frequency) {
    query = query.eq('frequency', filters.frequency as never);
  }
  if (filters.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive);
  }
  if (filters.search?.trim()) {
    const term = filters.search.trim();
    query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as RecurringTransaction[];
}

export async function fetchRecurringTransactionById(
  id: string,
): Promise<RecurringTransaction> {
  const { data, error } = await untypedDb
    .from(TABLE)
    .select(
      '*, suppliers(name, code), employees(name, code), payment_accounts(name)',
    )
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as unknown as RecurringTransaction;
}

/* ─── Write (Idempotent) ───────────────────────── */

export async function createRecurringTransaction(
  payload: RecurringTransactionDbPayload,
): Promise<RecurringTransaction> {
  const tenantId = await getTenantId();
  const result = await safeUpsertOne({
    table: TABLE,
    data: {
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      ...payload,
    },
    conflictKey: 'id',
  });
  return result as RecurringTransaction;
}

export async function updateRecurringTransaction(
  id: string,
  payload: RecurringTransactionDbPayload,
): Promise<RecurringTransaction> {
  const { data, error } = await untypedDb
    .from(TABLE)
    .update({ ...payload, updated_at: new Date().toISOString() } as never)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as RecurringTransaction;
}

export async function deleteRecurringTransaction(id: string): Promise<void> {
  const { error } = await untypedDb.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}

export async function toggleRecurringTransaction(
  id: string,
  isActive: boolean,
): Promise<RecurringTransaction> {
  const { data, error } = await untypedDb
    .from(TABLE)
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as RecurringTransaction;
}

/* ─── Generate Expenses ────────────────────────── */

export interface GenerateResult {
  generatedCount: number;
  errors: Array<{ transactionId: string; error: string }>;
}

/**
 * Generate expense vouchers for all active recurring transactions that are due.
 * This is called manually by the user from the UI.
 */
export async function generateDueExpenses(): Promise<GenerateResult> {
  // 1. Fetch all active, due transactions
  const { data: transactions, error } = await untypedDb
    .from(TABLE)
    .select('*')
    .eq('is_active', true)
    .lte('next_run_date', new Date().toISOString().slice(0, 10));

  if (error) throw error;

  const dueTransactions = (transactions ??
    []) as unknown as RecurringTransaction[];
  const result: GenerateResult = { generatedCount: 0, errors: [] };

  // 2. Generate an expense for each due transaction
  for (const tx of dueTransactions) {
    if (!isDue(tx.next_run_date)) continue;

    try {
      // Generate the next expense number
      const expenseNumber = await fetchNextDocNumber({
        table: 'expenses',
        column: 'expense_number',
        prefix: monthlyPrefix('PC'),
      });

      // Create the expense
      await createExpense({
        expense_number: expenseNumber,
        category: tx.category,
        amount: tx.amount,
        expense_date: new Date().toISOString().slice(0, 10),
        account_id: tx.account_id,
        supplier_id: tx.supplier_id,
        employee_id: tx.employee_id,
        description: `[Định kỳ] ${tx.description}`,
        reference_number: null,
        notes: tx.notes
          ? `Tự động tạo từ: ${tx.name}. ${tx.notes}`
          : `Tự động tạo từ: ${tx.name}`,
      });

      // Update the recurring transaction's next_run_date & last_generated_date
      const nextDate = calculateNextRunDate(
        tx.frequency as RecurringFrequency,
        tx.day_of_month,
        new Date(),
      );

      await untypedDb
        .from(TABLE)
        .update({
          last_generated_date: new Date().toISOString().slice(0, 10),
          next_run_date: nextDate,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', tx.id);

      result.generatedCount++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      result.errors.push({ transactionId: tx.id, error: message });
    }
  }

  return result;
}
