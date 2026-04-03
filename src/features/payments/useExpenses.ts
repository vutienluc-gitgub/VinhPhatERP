import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/services/supabase/client'
import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination'
import type { PaginatedResult } from '@/shared/types/pagination'

import type { ExpenseFormValues } from './payments.module'
import type { Expense, ExpensesFilter } from './types'

const TABLE = 'expenses'
const QUERY_KEY = ['expenses'] as const

/* ── Expense list with filters ── */

export function useExpenseList(filters: ExpensesFilter = {}, page = 1) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters, page],
    queryFn: async (): Promise<PaginatedResult<Expense>> => {
      const from = (page - 1) * DEFAULT_PAGE_SIZE
      const to = from + DEFAULT_PAGE_SIZE - 1

      let query = supabase
        .from(TABLE)
        .select('*, suppliers(name, code), payment_accounts(name)', { count: 'exact' })
        .order('expense_date', { ascending: false })
        .range(from, to)

      if (filters.category) {
        query = query.eq('category', filters.category)
      }
      if (filters.supplierId) {
        query = query.eq('supplier_id', filters.supplierId)
      }
      if (filters.search?.trim()) {
        const q = filters.search.trim()
        query = query.or(`expense_number.ilike.%${q}%,description.ilike.%${q}%`)
      }

      const { data, error, count } = await query
      if (error) throw error
      const total = count ?? 0
      return {
        data: (data ?? []) as unknown as Expense[],
        total,
        page,
        pageSize: DEFAULT_PAGE_SIZE,
        totalPages: Math.ceil(total / DEFAULT_PAGE_SIZE),
      }
    },
  })
}

/* ── Auto-generate expense number ── */

export function useNextExpenseNumber() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'next-number'],
    queryFn: async () => {
      const now = new Date()
      const yy = String(now.getFullYear()).slice(-2)
      const mm = String(now.getMonth() + 1).padStart(2, '0')
      const prefix = `PC${yy}${mm}-`

      const { data, error } = await supabase
        .from(TABLE)
        .select('expense_number')
        .ilike('expense_number', `${prefix}%`)
        .order('expense_number', { ascending: false })
        .limit(1)

      if (error) throw error
      if (!data || data.length === 0) return `${prefix}0001`

      const first = data[0]
      if (!first) return `${prefix}0001`
      const last = first.expense_number
      const match = last.match(/(\d{4})$/)
      if (!match?.[1]) return `${prefix}0001`

      const nextNum = parseInt(match[1], 10) + 1
      return `${prefix}${String(nextNum).padStart(4, '0')}`
    },
  })
}

/* ── Create expense ── */

export function useCreateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: ExpenseFormValues) => {
      const { data, error } = await supabase
        .from(TABLE)
        .insert({
          expense_number: values.expenseNumber.trim(),
          category: values.category,
          amount: values.amount,
          expense_date: values.expenseDate,
          account_id: values.accountId || null,
          supplier_id: values.supplierId || null,
          description: values.description.trim(),
          reference_number: values.referenceNumber?.trim() || null,
          notes: values.notes?.trim() || null,
        })
        .select()
        .single()

      if (error) throw error
      return data as Expense
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: ['payment-accounts'] })
    },
  })
}

/* ── Update expense ── */

export function useUpdateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: ExpenseFormValues }) => {
      const { data, error } = await supabase
        .from(TABLE)
        .update({
          expense_number: values.expenseNumber.trim(),
          category: values.category,
          amount: values.amount,
          expense_date: values.expenseDate,
          account_id: values.accountId || null,
          supplier_id: values.supplierId || null,
          description: values.description.trim(),
          reference_number: values.referenceNumber?.trim() || null,
          notes: values.notes?.trim() || null,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Expense
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: ['payment-accounts'] })
    },
  })
}

/* ── Delete expense ── */

export function useDeleteExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(TABLE).delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: ['payment-accounts'] })
    },
  })
}
