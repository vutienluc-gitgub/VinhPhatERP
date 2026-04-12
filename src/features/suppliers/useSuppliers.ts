import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchSuppliersPaginated,
  fetchNextSupplierCode,
  createSupplier,
  updateSupplierRpc,
  deleteSupplier,
} from '@/api/suppliers.api';

import type { SupplierFormValues } from './suppliers.module';
import type { Supplier, SupplierFilter, SupplierInsert } from './types';

export type { Supplier, SupplierFilter };

const QUERY_KEY = ['suppliers'] as const;

function toInsertRow(values: SupplierFormValues): SupplierInsert {
  return {
    code: values.code,
    name: values.name,
    category: values.category,
    phone: values.phone?.trim() || null,
    email: values.email?.trim() || null,
    address: values.address?.trim() || null,
    tax_code: values.tax_code?.trim() || null,
    contact_person: values.contact_person?.trim() || null,
    notes: values.notes?.trim() || null,
    status: values.status,
  };
}

export function useSuppliersList(filters: SupplierFilter = {}, page = 1) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters, page],
    queryFn: () => fetchSuppliersPaginated(filters, page),
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: SupplierFormValues) =>
      createSupplier(toInsertRow(values)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: SupplierFormValues }) =>
      updateSupplierRpc(id, {
        p_code: values.code,
        p_name: values.name,
        p_category: values.category,
        p_phone: values.phone?.trim() || undefined,
        p_email: values.email?.trim() || undefined,
        p_address: values.address?.trim() || undefined,
        p_tax_code: values.tax_code?.trim() || undefined,
        p_contact_person: values.contact_person?.trim() || undefined,
        p_notes: values.notes?.trim() || undefined,
        p_status: values.status,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useNextSupplierCode() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'next-code'],
    queryFn: fetchNextSupplierCode,
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
