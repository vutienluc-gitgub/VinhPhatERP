import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import {
  fetchSuppliersPaginated,
  fetchNextSupplierCode,
  createSupplier,
  fetchSuppliers,
  updateSupplierRpc,
  deleteSupplier,
  fetchSupplierPrice,
  fetchAllSupplierPrices,
  upsertSupplierPrice,
  fetchSupplierCategories,
  fetchSupplierStats,
  fetchSupplierById,
} from '@/api/suppliers.api';
import type { SupplierFormValues } from '@/features/procurement/suppliers/suppliers.module';
import type {
  Supplier,
  SupplierFilter,
  SupplierInsert,
} from '@/domain/crm/suppliers.types';

export type { Supplier, SupplierFilter };

const QUERY_KEY = ['suppliers'] as const;

export function useSupplierById(id: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'detail', id],
    queryFn: () => (id ? fetchSupplierById(id) : null),
    enabled: !!id,
  });
}

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

export function useSupplierPrice(supplierId: string, materialId: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'price', supplierId, materialId],
    queryFn: () => fetchSupplierPrice(supplierId, materialId),
    enabled: !!supplierId && !!materialId,
    staleTime: 5 * 60 * 1000, // Cache for 5 mins
  });
}

export function useAllSupplierPrices(supplierId: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'prices', supplierId],
    queryFn: () => fetchAllSupplierPrices(supplierId),
    enabled: !!supplierId,
  });
}

export function useUpsertSupplierPrice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      supplierId,
      priceData,
    }: {
      supplierId: string;
      priceData: {
        material_id: string;
        unit_price: number;
        uom: string;
        moq: number;
        lead_time_days: number;
      };
    }) => upsertSupplierPrice(supplierId, priceData),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [...QUERY_KEY, 'prices', variables.supplierId],
      });
      void queryClient.invalidateQueries({
        queryKey: [
          ...QUERY_KEY,
          'price',
          variables.supplierId,
          variables.priceData.material_id,
        ],
      });
    },
  });
}

export function useActiveSuppliers() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'active'],
    queryFn: () => fetchSuppliers({ status: 'active' }),
  });
}

export function useSupplierCategories() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'categories'],
    queryFn: fetchSupplierCategories,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours cache
  });
}

export function useSupplierStats() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'stats'],
    queryFn: fetchSupplierStats,
    staleTime: 5 * 60 * 1000, // Cache 5 phút
  });
}
