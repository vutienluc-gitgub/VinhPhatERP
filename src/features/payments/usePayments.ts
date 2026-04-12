import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchPaymentsPaginated,
  fetchPaymentsByOrder,
  fetchNextPaymentNumber,
  createPaymentRecord,
  deletePaymentRecord,
  fetchDebtSummary,
} from '@/api/payments.api';
import { mapPaymentFormToDb } from '@/domain/payments';
import { DomainEventBus } from '@/domain/core/DomainEventBus';

import type { PaymentsFormValues } from './payments.module';
import type { DebtSummaryRow, Payment, PaymentsFilter } from './types';

export type { Payment, PaymentsFilter, DebtSummaryRow };

const QUERY_KEY = ['payments'] as const;

export function usePaymentList(filters: PaymentsFilter = {}, page = 1) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters, page],
    queryFn: () => fetchPaymentsPaginated(filters, page),
  });
}

export function useOrderPayments(orderId: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'by-order', orderId],
    enabled: !!orderId,
    queryFn: () => fetchPaymentsByOrder(orderId!),
  });
}

export function useNextPaymentNumber() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'next-number'],
    queryFn: fetchNextPaymentNumber,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: PaymentsFormValues) =>
      createPaymentRecord(mapPaymentFormToDb(values)),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      DomainEventBus.publish({
        eventName: 'PaymentCreatedEvent',
        timestamp: new Date().toISOString(),
        payload: {
          paymentId: data.id,
          orderId: data.order_id || undefined,
        },
      });
    },
  });
}

export function useDeletePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePaymentRecord,
    onSuccess: (_, deletedId) => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      DomainEventBus.publish({
        eventName: 'PaymentDeletedEvent',
        timestamp: new Date().toISOString(),
        payload: { paymentId: deletedId },
      });
    },
  });
}

export function useDebtSummary() {
  return useQuery<DebtSummaryRow[]>({
    queryKey: [...QUERY_KEY, 'debt-summary'],
    queryFn: fetchDebtSummary,
  });
}
