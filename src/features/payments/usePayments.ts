import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchPaymentsPaginated,
  fetchPaymentsByOrder,
  fetchNextPaymentNumber,
  createPaymentRecord,
  deletePaymentRecord,
  fetchDebtSummary,
} from '@/api/payments.api';

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
      createPaymentRecord({
        payment_number: values.paymentNumber.trim(),
        order_id: values.orderId,
        customer_id: values.customerId,
        payment_date: values.paymentDate,
        amount: values.amount,
        payment_method: values.paymentMethod,
        account_id: values.accountId || null,
        reference_number: values.referenceNumber?.trim() || null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useDeletePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePaymentRecord,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useDebtSummary() {
  return useQuery<DebtSummaryRow[]>({
    queryKey: [...QUERY_KEY, 'debt-summary'],
    queryFn: fetchDebtSummary,
  });
}
