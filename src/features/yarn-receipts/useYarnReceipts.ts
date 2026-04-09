import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchYarnReceiptsPaginated,
  fetchYarnReceiptById,
  fetchNextReceiptNumber,
  fetchYarnSuppliers,
  fetchYarnCatalogOptionsForReceipt,
  createYarnReceiptFull,
  updateYarnReceiptFull,
  deleteYarnReceiptRecord,
  confirmYarnReceipt,
} from '@/api/yarn-receipts.api';
import type {
  YarnSupplierOption,
  YarnCatalogOption,
} from '@/api/yarn-receipts.api';

import type { YarnReceipt, YarnReceiptsFilter } from './types';
import type { YarnReceiptsFormValues } from './yarn-receipts.module';

export type { YarnSupplierOption, YarnCatalogOption };

const QUERY_KEY = ['yarn-receipts'] as const;

export function useYarnReceiptList(filters: YarnReceiptsFilter = {}, page = 1) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters, page],
    queryFn: () => fetchYarnReceiptsPaginated(filters, page),
  });
}

export function useYarnReceipt(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    enabled: !!id,
    queryFn: () => fetchYarnReceiptById(id!) as Promise<YarnReceipt>,
  });
}

export function useNextReceiptNumber() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'next-number'],
    queryFn: fetchNextReceiptNumber,
  });
}

export function useActiveSuppliers() {
  return useQuery<YarnSupplierOption[]>({
    queryKey: ['suppliers', 'active-list'],
    queryFn: fetchYarnSuppliers,
  });
}

export function useYarnCatalogOptions() {
  return useQuery<YarnCatalogOption[]>({
    queryKey: ['yarn-catalog', 'receipt-picker'],
    queryFn: fetchYarnCatalogOptionsForReceipt,
  });
}

export function useCreateYarnReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: YarnReceiptsFormValues) =>
      createYarnReceiptFull({
        receiptNumber: values.receiptNumber,
        supplierId: values.supplierId,
        receiptDate: values.receiptDate,
        notes: values.notes?.trim() || null,
        items: values.items.map((item) => ({
          yarnType: item.yarnType,
          colorName: item.colorName ?? null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lotNumber: item.lotNumber ?? null,
          tensileStrength: item.tensileStrength ?? null,
          composition: item.composition ?? null,
          origin: item.origin ?? null,
          yarnCatalogId: item.yarnCatalogId ?? null,
        })),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateYarnReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: YarnReceiptsFormValues;
    }) =>
      updateYarnReceiptFull(id, {
        receiptNumber: values.receiptNumber,
        supplierId: values.supplierId,
        receiptDate: values.receiptDate,
        notes: values.notes?.trim() || null,
        items: values.items.map((item) => ({
          yarnType: item.yarnType,
          colorName: item.colorName ?? null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lotNumber: item.lotNumber ?? null,
          tensileStrength: item.tensileStrength ?? null,
          composition: item.composition ?? null,
          origin: item.origin ?? null,
          yarnCatalogId: item.yarnCatalogId ?? null,
        })),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteYarnReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteYarnReceiptRecord,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useConfirmYarnReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: confirmYarnReceipt,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
