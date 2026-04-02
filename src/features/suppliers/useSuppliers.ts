import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/services/supabase/client'
import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination'
import type { PaginatedResult } from '@/shared/types/pagination'

import type { SupplierFormValues } from './suppliers.module'
import type { Supplier, SupplierFilter } from './types'

const TABLE = 'suppliers'
const QUERY_KEY = ['suppliers'] as const

function toDbRow(values: SupplierFormValues): Omit<Supplier, 'id' | 'created_at' | 'updated_at'> {
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
  }
}

export function useSuppliersList(filters: SupplierFilter = {}, page = 1) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters, page],
    queryFn: async (): Promise<PaginatedResult<Supplier>> => {
      const from = (page - 1) * DEFAULT_PAGE_SIZE
      const to = from + DEFAULT_PAGE_SIZE - 1

      let query = supabase
        .from(TABLE)
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

      if (filters.category) {
        query = query.eq('category', filters.category)
      }
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)
      }

      const { data, error, count } = await query
      if (error) throw error
      const total = count ?? 0
      return {
        data: (data ?? []) as Supplier[],
        total,
        page,
        pageSize: DEFAULT_PAGE_SIZE,
        totalPages: Math.ceil(total / DEFAULT_PAGE_SIZE),
      }
    },
  })
}

export function useCreateSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: SupplierFormValues) => {
      const { data, error } = await supabase
        .from(TABLE)
        .insert([toDbRow(values)])
        .select()
        .single()
      if (error) throw error
      return data as Supplier
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: SupplierFormValues }) => {
      const { data, error } = await supabase.rpc('update_supplier', {
        p_id: id,
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
      })
      if (error) {
        if (error.message.includes('NOT_AUTHENTICATED'))
          throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
        if (error.message.includes('FORBIDDEN'))
          throw new Error('Bạn không có quyền cập nhật nhà cung cấp. Liên hệ admin.')
        if (error.message.includes('NOT_FOUND'))
          throw new Error('Bản ghi không tồn tại hoặc đã bị xóa.')
        throw error
      }
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useNextSupplierCode() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'next-code'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('code')
        .ilike('code', 'NCC-%')
        .order('code', { ascending: false })
        .limit(1)

      if (error) throw error

      if (!data || data.length === 0) return 'NCC-001'

      const first = data[0]
      if (!first) return 'NCC-001'
      const lastCode = first.code
      const match = lastCode.match(/^NCC-(\d+)$/)
      if (!match?.[1]) return 'NCC-001'

      const nextNum = parseInt(match[1], 10) + 1
      return `NCC-${String(nextNum).padStart(3, '0')}`
    },
  })
}

export function useDeleteSupplier() {
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
