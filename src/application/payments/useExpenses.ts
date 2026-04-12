import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchExpensesPaginated,
  fetchNextExpenseNumber,
  createExpense,
  updateExpense,
  deleteExpense,
} from '@/api/payments.api';
import { mapExpenseFormToDb } from '@/domain/payments';
import { DomainEventBus } from '@/domain/core/DomainEventBus';
import type { ExpenseFormValues } from '@/features/payments/payments.module';
import type { Expense, ExpensesFilter } from '@/features/payments/types';

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
      createExpense(mapExpenseFormToDb(values)),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      DomainEventBus.publish({
        eventName: 'ExpenseCreatedEvent',
        timestamp: new Date().toISOString(),
        payload: { expenseId: data.id },
      });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ExpenseFormValues }) =>
      updateExpense(id, mapExpenseFormToDb(values)),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      DomainEventBus.publish({
        eventName: 'ExpenseUpdatedEvent',
        timestamp: new Date().toISOString(),
        payload: { expenseId: data.id },
      });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteExpense,
    onSuccess: (_, deletedId) => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      DomainEventBus.publish({
        eventName: 'ExpenseDeletedEvent',
        timestamp: new Date().toISOString(),
        payload: { expenseId: deletedId },
      });
    },
  });
}
