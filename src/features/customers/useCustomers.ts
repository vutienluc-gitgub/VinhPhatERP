import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/services/supabase/client'
import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination'
import type { PaginatedResult } from '@/shared/types/pagination'

import type { CustomersFormValues } from './customers.module'
import type { Customer, CustomersFilter } from './types'

const TABLE = 'customers'
const QUERY_KEY = ['customers'] as const

function toDbRow(
  values: CustomersFormValues,
): Omit<Customer, 'id' | 'created_at' | 'updated_at'> {
  return {
    code: values.code.trim(),
    name: values.name.trim(),
    phone: values.phone?.trim() || null,
    email: values.email?.trim() || null,
    address: values.address?.trim() || null,
    tax_code: values.tax_code?.trim() || null,
    contact_person: values.contact_person?.trim() || null,
    source: values.source,
    notes: values.notes?.trim() || null,
    status: values.status,
  }
}

export function useCustomerList(filters: CustomersFilter = {}, page = 1) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters, page],
    queryFn: async (): Promise<PaginatedResult<Customer>> => {
      const from = (page - 1) * DEFAULT_PAGE_SIZE
      const to = from + DEFAULT_PAGE_SIZE - 1

      let query = supabase
        .from(TABLE)
        .select('*', { count: 'exact' })
        .order('name', { ascending: true })
        .range(from, to)

      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.query?.trim()) {
        const q = filters.query.trim()
        query = query.or(
          `name.ilike.%${q}%,code.ilike.%${q}%,phone.ilike.%${q}%`,
        )
      }

      const { data, error, count } = await query
      if (error) throw error
      const total = count ?? 0
      return {
        data: (data ?? []) as Customer[],
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
      const { data, error } = await supabase
        .from(TABLE)
        .insert([toDbRow(values)])
        .select()
        .single()
      if (error) throw error
      return data as Customer
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
      const { data, error } = await supabase
        .from(TABLE)
        .update(toDbRow(values))
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Customer
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useNextCustomerCode() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'next-code'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('code')
        .ilike('code', 'KH-%')
        .order('code', { ascending: false })
        .limit(1)

      if (error) throw error

      if (!data || data.length === 0) return 'KH-001'

      const first = data[0]
      if (!first) return 'KH-001'
      const lastCode = first.code
      const match = lastCode.match(/^KH-(\d+)$/)
      if (!match?.[1]) return 'KH-001'

      const nextNum = parseInt(match[1], 10) + 1
      return `KH-${String(nextNum).padStart(3, '0')}`
    },
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(TABLE).delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
