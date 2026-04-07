import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  fetchNextCustomerCode
} from '@/api/customers.api'
import type { Customer, CustomerInsert, CustomersFilter } from '@/models'
import type { CustomersFormValues } from '@/schema/customer.schema'

import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination'
import type { PaginatedResult } from '@/shared/types/pagination'

const QUERY_KEY = ['customers'] as const

function toDbRow(
  values: CustomersFormValues,
): CustomerInsert {
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
  }
}

export function useCustomerList(filters: CustomersFilter = {}, page = 1) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters, page],
    queryFn: async (): Promise<PaginatedResult<Customer>> => {
      // The API currently returns all matches. For pagination we'll slice it here,
      // but ideally the API should be updated to handle pagination natively.
      const from = (page - 1) * DEFAULT_PAGE_SIZE
      const data = await fetchCustomers(filters)
      
      const total = data.length
      const pageData = data.slice(from, from + DEFAULT_PAGE_SIZE)
      
      return {
        data: pageData,
        total,
        page,
        pageSize: DEFAULT_PAGE_SIZE,
        totalPages: Math.ceil(total / DEFAULT_PAGE_SIZE),
      }
    },
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: CustomersFormValues) => {
      return createCustomer(toDbRow(values))
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string
      values: CustomersFormValues
    }) => {
      return updateCustomer(id, toDbRow(values))
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useNextCustomerCode() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'next-code'],
    queryFn: fetchNextCustomerCode,
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
