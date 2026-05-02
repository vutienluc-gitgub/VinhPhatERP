import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import {
  fetchSuppliersPaginated,
  fetchNextSupplierCode,
  createSupplier,
  updateSupplierRpc,
  deleteSupplier,
} from '@/api/suppliers.api';
import type { SupplierFormValues } from '@/features/suppliers/suppliers.module';
import type {
  Supplier,
  SupplierFilter,
  SupplierInsert,
} from '@/features/suppliers/types';

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
  const [clientId, setClientId] = useState(() => crypto.randomUUID());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: SupplierFormValues) => {
      const reqPayload = { id: clientId, ...toInsertRow(values) };
      return createSupplier(reqPayload);
    },
    onSuccess: () => {
      setClientId(crypto.randomUUID());
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
      expectedUpdatedAt,
    }: {
      id: string;
      values: SupplierFormValues;
      expectedUpdatedAt?: string;
    }) =>
      updateSupplierRpc(
        id,
        {
          code: values.code,
          name: values.name,
          category: values.category,
          phone: values.phone?.trim() || undefined,
          email: values.email?.trim() || undefined,
          address: values.address?.trim() || undefined,
          tax_code: values.tax_code?.trim() || undefined,
          contact_person: values.contact_person?.trim() || undefined,
          notes: values.notes?.trim() || undefined,
          status: values.status,
        },
        expectedUpdatedAt,
      ),
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
