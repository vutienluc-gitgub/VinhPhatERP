import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchQuotationsPaginated,
  fetchQuotationById,
  fetchNextQuotationNumber,
  createQuotation,
  updateQuotationWithItems,
  sendQuotation,
  confirmQuotation,
  rejectQuotation,
  deleteQuotation,
  fetchExpiringQuotationsCount,
} from '@/api/quotations.api';
import type { PaginatedResult } from '@/shared/types/pagination';
import type { QuotationsFormValues } from '@/features/quotations/quotations.module';
import { calculateQuotationTotals } from '@/features/quotations/quotations.module';
import type {
  DiscountType,
  Quotation,
  QuotationsFilter,
} from '@/features/quotations/types';

const QUERY_KEY = ['quotations'] as const;

export function useQuotationList(filters: QuotationsFilter = {}, page = 1) {
  return useQuery<PaginatedResult<Quotation>>({
    queryKey: [...QUERY_KEY, filters, page],
    queryFn: () => fetchQuotationsPaginated(filters, page),
  });
}

export function useQuotation(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    enabled: !!id,
    queryFn: () => fetchQuotationById(id!),
  });
}

export function useNextQuotationNumber() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'next-number'],
    queryFn: fetchNextQuotationNumber,
  });
}

export function useCreateQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: QuotationsFormValues) => {
      const totals = calculateQuotationTotals(
        values.items,
        values.discountType as DiscountType,
        values.discountValue,
        values.vatRate,
      );

      return createQuotation(
        {
          quotation_number: values.quotationNumber.trim(),
          customer_id: values.customerId,
          quotation_date: values.quotationDate,
          valid_until: values.validUntil?.trim() || null,
          subtotal: totals.subtotal,
          discount_type: values.discountType,
          discount_value: values.discountValue,
          discount_amount: totals.discountAmount,
          total_before_vat: totals.totalBeforeVat,
          vat_rate: values.vatRate,
          vat_amount: totals.vatAmount,
          total_amount: totals.totalAmount,
          delivery_terms: values.deliveryTerms?.trim() || null,
          payment_terms: values.paymentTerms?.trim() || null,
          notes: values.notes?.trim() || null,
          status: 'draft' as const,
        },
        values.items.map((item, idx) => ({
          fabric_type: item.fabricType.trim(),
          color_name: item.colorName?.trim() || null,
          color_code: item.colorCode?.trim() || null,
          width_cm: item.widthCm || null,
          unit: item.unit ?? 'kg',
          quantity: item.quantity,
          unit_price: item.unitPrice,
          lead_time_days: item.leadTimeDays || null,
          notes: item.notes?.trim() || null,
          sort_order: idx,
        })),
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: QuotationsFormValues;
    }) => {
      const totals = calculateQuotationTotals(
        values.items,
        values.discountType as DiscountType,
        values.discountValue,
        values.vatRate,
      );

      await updateQuotationWithItems(
        id,
        {
          quotation_number: values.quotationNumber.trim(),
          customer_id: values.customerId,
          quotation_date: values.quotationDate,
          valid_until: values.validUntil?.trim() || null,
          subtotal: totals.subtotal,
          discount_type: values.discountType,
          discount_value: values.discountValue,
          discount_amount: totals.discountAmount,
          total_before_vat: totals.totalBeforeVat,
          vat_rate: values.vatRate,
          vat_amount: totals.vatAmount,
          total_amount: totals.totalAmount,
          delivery_terms: values.deliveryTerms?.trim() || null,
          payment_terms: values.paymentTerms?.trim() || null,
          notes: values.notes?.trim() || null,
        },
        values.items.map((item, idx) => ({
          fabric_type: item.fabricType.trim(),
          color_name: item.colorName?.trim() || null,
          color_code: item.colorCode?.trim() || null,
          width_cm: item.widthCm || null,
          unit: item.unit ?? 'kg',
          quantity: item.quantity,
          unit_price: item.unitPrice,
          lead_time_days: item.leadTimeDays || null,
          notes: item.notes?.trim() || null,
          sort_order: idx,
        })),
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useSendQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendQuotation,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useConfirmQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: confirmQuotation,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useRejectQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rejectQuotation,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteQuotation,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useExpiringQuotationsCount() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'expiring-count'],
    queryFn: fetchExpiringQuotationsCount,
    refetchInterval: 5 * 60 * 1000,
  });
}
