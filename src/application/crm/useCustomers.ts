import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  fetchNextCustomerCode,
  fetchCustomerPortalAccount,
  createCustomerPortalAccount,
  updateCustomerPortalAccountStatus,
} from '@/api/customers.api';
import type {
  Customer,
  CustomerInsert,
  CustomersFilter,
} from '@/features/customers/types';
import type { CustomersFormValues } from '@/schema/customer.schema';
import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination';
import type { PaginatedResult } from '@/shared/types/pagination';

const QUERY_KEY = ['customers'] as const;

function toDbRow(values: CustomersFormValues): CustomerInsert {
  return {
    code: values.code.trim(),
    name: values.name.trim(),
    phone: values.phone?.trim() || null,
    email: values.email?.trim() || null,
    address: values.address?.trim() || null,
    tax_code: values.tax_code?.trim() || null,
    contact_person: values.contact_person?.trim() || null,
    source: values.source ?? 'other',
    notes: values.notes?.trim() || null,
    status: values.status,
  };
}

export function useCustomerList(filters: CustomersFilter = {}, page = 1) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters, page],
    queryFn: async (): Promise<PaginatedResult<Customer>> => {
      const from = (page - 1) * DEFAULT_PAGE_SIZE;
      const data = await fetchCustomers(filters);
      const total = data.length;
      const pageData = data.slice(from, from + DEFAULT_PAGE_SIZE);
      return {
        data: pageData,
        total,
        page,
        pageSize: DEFAULT_PAGE_SIZE,
        totalPages: Math.ceil(total / DEFAULT_PAGE_SIZE),
      };
    },
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CustomersFormValues) =>
      createCustomer(toDbRow(values)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: CustomersFormValues }) =>
      updateCustomer(id, toDbRow(values)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useNextCustomerCode() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'next-code'],
    queryFn: fetchNextCustomerCode,
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function usePortalAccount(customerId: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, customerId, 'portal-account'],
    queryFn: () => fetchCustomerPortalAccount(customerId),
    enabled: !!customerId,
  });
}

export function useCreatePortalAccount(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      customer_id: string;
      full_name: string;
      email: string;
      password?: string;
    }) => createCustomerPortalAccount(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...QUERY_KEY, customerId, 'portal-account'],
      });
    },
  });
}

export function useUpdatePortalAccountStatus(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateCustomerPortalAccountStatus(id, isActive),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...QUERY_KEY, customerId, 'portal-account'],
      });
    },
  });
}
