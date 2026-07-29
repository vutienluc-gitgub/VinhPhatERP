import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import {
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  bulkUpdateCustomers,
  fetchNextCustomerCode,
  fetchCustomerPortalAccount,
  createCustomerPortalAccount,
  updateCustomerPortalAccountStatus,
  fetchCustomerById,
} from '@/api/customers.api';
import type {
  Customer,
  CustomerInsert,
  CustomersFilter,
  CustomerUpdate,
} from '@/domain/crm/customers.types';
import type { CustomersFormValues } from '@/schema/customer.schema';
import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination';
import type { PaginatedResult } from '@/shared/types/pagination';
import { sanitizePhoneSearchQuery } from '@/shared/utils/format';

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
    salesperson_id: values.salesperson_id || null,
  };
}

export function useCustomerList(
  filters: CustomersFilter = {},
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
) {
  const sanitizedFilters = {
    ...filters,
    query: filters.query ? sanitizePhoneSearchQuery(filters.query) : undefined,
  };

  return useQuery({
    queryKey: [...QUERY_KEY, sanitizedFilters, page, pageSize],
    queryFn: async (): Promise<
      PaginatedResult<Customer> & {
        stats: { active: number; new: number };
      }
    > => {
      const from = (page - 1) * pageSize;
      const data = await fetchCustomers(sanitizedFilters);
      const total = data.length;
      const pageData = data.slice(from, from + pageSize);
      return {
        data: pageData,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        stats: {
          active: data.filter((c) => c.status === 'active').length,
          new: data.length, // According to business logic, new is often total for the filtered period, or we could just return total length
        },
      };
    },
  });
}

export function useCustomerById(id: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'detail', id],
    queryFn: () => (id ? fetchCustomerById(id) : null),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const [clientId, setClientId] = useState(() => crypto.randomUUID());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CustomersFormValues) => {
      const reqPayload = { id: clientId, ...toDbRow(values) };
      return createCustomer(reqPayload);
    },
    onSuccess: () => {
      setClientId(crypto.randomUUID());
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
      expectedUpdatedAt,
    }: {
      id: string;
      values: CustomersFormValues;
      expectedUpdatedAt?: string;
    }) => updateCustomer(id, toDbRow(values), expectedUpdatedAt),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useBulkUpdateCustomers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ids,
      values,
    }: {
      ids: string[];
      values: Partial<CustomerUpdate>;
    }) => bulkUpdateCustomers(ids, values),
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
    }) => {
      return createCustomerPortalAccount(payload);
    },
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
