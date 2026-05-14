import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchRecurringTransactions,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  toggleRecurringTransaction,
  generateDueExpenses,
} from '@/api/recurring-transactions.api';
import { mapRecurringTransactionFormToDb } from '@/domain/recurring-transactions';
import { DomainEventBus } from '@/domain/core/DomainEventBus';
import type { RecurringTransactionFormValues } from '@/schema/recurring-transaction.schema';
import type {
  RecurringTransaction,
  RecurringTransactionFilter,
} from '@/domain/recurring-transactions/types';

export type { RecurringTransaction, RecurringTransactionFilter };

const QUERY_KEY = ['recurring-transactions'] as const;

export function useRecurringTransactionList(
  filters: RecurringTransactionFilter = {},
) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters],
    queryFn: () => fetchRecurringTransactions(filters),
  });
}

export function useCreateRecurringTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: RecurringTransactionFormValues) => {
      const payload = mapRecurringTransactionFormToDb(values);
      return createRecurringTransaction(payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      DomainEventBus.publish({
        eventName: 'RecurringTransactionCreatedEvent',
        timestamp: new Date().toISOString(),
        payload: {},
      });
    },
  });
}

export function useUpdateRecurringTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: RecurringTransactionFormValues;
    }) =>
      updateRecurringTransaction(id, mapRecurringTransactionFormToDb(values)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      DomainEventBus.publish({
        eventName: 'RecurringTransactionUpdatedEvent',
        timestamp: new Date().toISOString(),
        payload: {},
      });
    },
  });
}

export function useDeleteRecurringTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRecurringTransaction,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useToggleRecurringTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleRecurringTransaction(id, isActive),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useGenerateDueExpenses() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: generateDueExpenses,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      // Also invalidate expenses list so new expenses show up immediately
      void queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}
