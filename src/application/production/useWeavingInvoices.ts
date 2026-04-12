import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchWeavingInvoicesPaginated,
  fetchWeavingInvoiceById,
  fetchNextWeavingInvoiceNumber,
  fetchWeavingSuppliers,
  fetchWeavingSupplierDebt,
  createWeavingInvoice,
  updateWeavingInvoice,
  confirmWeavingInvoice,
  markWeavingInvoicePaid,
  deleteWeavingInvoice,
} from '@/api/weaving-invoices.api';
import type {
  WeavingInvoice,
  WeavingInvoiceFilter,
} from '@/features/weaving-invoices/types';
import type { WeavingInvoiceFormValues } from '@/features/weaving-invoices/weaving-invoices.module';

export type { WeavingSupplierDebtRow } from '@/api/weaving-invoices.api';
export type { WeavingInvoice, WeavingInvoiceFilter };

const QK = ['weaving-invoices'] as const;

export function useWeavingInvoiceList(
  filters: WeavingInvoiceFilter = {},
  page = 1,
) {
  return useQuery({
    queryKey: [...QK, filters, page],
    queryFn: () => fetchWeavingInvoicesPaginated(filters, page),
  });
}

export function useWeavingInvoice(id: string | undefined) {
  return useQuery({
    queryKey: [...QK, id],
    enabled: !!id,
    queryFn: () => fetchWeavingInvoiceById(id!),
  });
}

export function useNextWeavingInvoiceNumber() {
  return useQuery({
    queryKey: [...QK, 'next-number'],
    queryFn: fetchNextWeavingInvoiceNumber,
  });
}

export function useWeavingSuppliers() {
  return useQuery({
    queryKey: ['suppliers', 'weaving'],
    queryFn: fetchWeavingSuppliers,
  });
}

export function useWeavingSupplierDebt() {
  return useQuery({
    queryKey: [...QK, 'supplier-debt'],
    queryFn: fetchWeavingSupplierDebt,
  });
}

export function useCreateWeavingInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: WeavingInvoiceFormValues) =>
      createWeavingInvoice(values),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK });
    },
  });
}

export function useUpdateWeavingInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: WeavingInvoiceFormValues;
    }) => updateWeavingInvoice(id, values),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK });
    },
  });
}

export function useConfirmWeavingInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: confirmWeavingInvoice,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK });
      void qc.invalidateQueries({ queryKey: ['raw-fabric'] });
      void qc.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useMarkWeavingInvoicePaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, paidAmount }: { id: string; paidAmount: number }) =>
      markWeavingInvoicePaid(id, paidAmount),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK });
    },
  });
}

export function useDeleteWeavingInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteWeavingInvoice,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK });
    },
  });
}
