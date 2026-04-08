import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchExpensesPaginated,
  fetchNextExpenseNumber,
  createExpense,
  updateExpense,
  deleteExpense,
} from '@/api/payments.api';

import type { ExpenseFormValues } from './payments.module';
import type { Expense, ExpensesFilter } from './types';

export type { Expense, ExpensesFilter };

const QUERY_KEY = ['expenses'] as const;

export function useExpenseList(filters: ExpensesFilter = {}, page = 1) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters, page],
    queryFn: () => fetchExpensesPaginated(filters, page),
  });
}

export function useNextExpenseNumber() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'next-number'],
    queryFn: fetchNextExpenseNumber,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: ExpenseFormValues) =>
      createExpense({
        expense_number: values.expenseNumber.trim(),
        category: values.category,
        amount: values.amount,
        expense_date: values.expenseDate,
        account_id: values.accountId || null,
        supplier_id: values.supplierId || null,
        description: values.description.trim(),
        reference_number: values.referenceNumber?.trim() || null,
        notes: values.notes?.trim() || null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['payment-accounts'] });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ExpenseFormValues }) =>
      updateExpense(id, {
        expense_number: values.expenseNumber.trim(),
        category: values.category,
        amount: values.amount,
        expense_date: values.expenseDate,
        account_id: values.accountId || null,
        supplier_id: values.supplierId || null,
        description: values.description.trim(),
        reference_number: values.referenceNumber?.trim() || null,
        notes: values.notes?.trim() || null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['payment-accounts'] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['payment-accounts'] });
    },
  });
}
