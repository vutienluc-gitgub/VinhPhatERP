import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import {
  fetchExpensesPaginated,
  fetchNextExpenseNumber,
  createExpense,
  updateExpense,
  deleteExpense,
  fetchUnpaidDocuments,
} from '@/api/payments.api';
import { mapExpenseFormToDb } from '@/domain/payments';
import { DomainEventBus } from '@/domain/core/DomainEventBus';
import type { ExpenseFormValues } from '@/schema/payment.schema';
import type {
  Expense,
  ExpensesFilter,
  UnpaidDocument,
} from '@/domain/payments/types';

export type { Expense, ExpensesFilter };

const QUERY_KEY = ['expenses'] as const;

export function useUnpaidDocuments(supplierId?: string) {
  return useQuery({
    queryKey: ['unpaid-documents', supplierId],
    queryFn: () =>
      supplierId ? fetchUnpaidDocuments(supplierId) : Promise.resolve([]),
    enabled: !!supplierId,
  }) as { data: UnpaidDocument[]; isLoading: boolean };
}

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
  const [clientId, setClientId] = useState(() => crypto.randomUUID());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: ExpenseFormValues) => {
      const reqPayload = { id: clientId, ...mapExpenseFormToDb(values) };
      return createExpense(reqPayload);
    },
    onSuccess: (data) => {
      setClientId(crypto.randomUUID());
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
