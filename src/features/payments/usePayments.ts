import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/services/supabase/client'
import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination'
import type { PaginatedResult } from '@/shared/types/pagination'
import type { PaymentsFormValues } from './payments.module'
import type { DebtSummaryRow, Payment, PaymentsFilter } from './types'

const TABLE = 'payments'
const QUERY_KEY = ['payments'] as const

/* ── Payment list with filters ── */

export function usePaymentList(filters: PaymentsFilter = {}, page = 1) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters, page],
    queryFn: async (): Promise<PaginatedResult<Payment>> => {
      const from = (page - 1) * DEFAULT_PAGE_SIZE
      const to = from + DEFAULT_PAGE_SIZE - 1

      let query = supabase
        .from(TABLE)
        .select('*, orders(order_number, total_amount, paid_amount), customers(name, code)', { count: 'exact' })
        .order('payment_date', { ascending: false })
        .range(from, to)

      if (filters.orderId) {
        query = query.eq('order_id', filters.orderId)
      }
      if (filters.customerId) {
        query = query.eq('customer_id', filters.customerId)
      }
      if (filters.search?.trim()) {
        const q = filters.search.trim()
        query = query.ilike('payment_number', `%${q}%`)
      }

      const { data, error, count } = await query
      if (error) throw error
      const total = count ?? 0
      return {
        data: (data ?? []) as unknown as Payment[],
        total,
        page,
        pageSize: DEFAULT_PAGE_SIZE,
        totalPages: Math.ceil(total / DEFAULT_PAGE_SIZE),
      }
    },
  })
}

/* ── Payments for a specific order ── */

export function useOrderPayments(orderId: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'by-order', orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('order_id', orderId!)
        .order('payment_date', { ascending: false })
      if (error) throw error
      return (data ?? []) as Payment[]
    },
  })
}

/* ── Auto-generate payment number ── */

export function useNextPaymentNumber() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'next-number'],
    queryFn: async () => {
      const now = new Date()
      const yy = String(now.getFullYear()).slice(-2)
      const mm = String(now.getMonth() + 1).padStart(2, '0')
      const prefix = `TT${yy}${mm}-`

      const { data, error } = await supabase
        .from(TABLE)
        .select('payment_number')
        .ilike('payment_number', `${prefix}%`)
        .order('payment_number', { ascending: false })
        .limit(1)

      if (error) throw error
      if (!data || data.length === 0) return `${prefix}0001`

      const first = data[0]
      if (!first) return `${prefix}0001`
      const last = first.payment_number
      const match = last.match(/(\d{4})$/)
      if (!match?.[1]) return `${prefix}0001`

      const nextNum = parseInt(match[1], 10) + 1
      return `${prefix}${String(nextNum).padStart(4, '0')}`
    },
  })
}

/* ── Create payment ── */

export function useCreatePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: PaymentsFormValues) => {
      const { data, error } = await supabase
        .from(TABLE)
        .insert({
          payment_number: values.paymentNumber.trim(),
          order_id: values.orderId,
          customer_id: values.customerId,
          payment_date: values.paymentDate,
          amount: values.amount,
          payment_method: values.paymentMethod,
          reference_number: values.referenceNumber?.trim() || null,
        })
        .select()
        .single()

      if (error) throw error
      return data as Payment
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

/* ── Delete payment ── */

export function useDeletePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq('id', paymentId)

      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

/* ── Debt summary grouped by customer (server-side RPC) ── */

export function useDebtSummary() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'debt-summary'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_debt_summary')

      if (error) throw error

      return (data ?? []) as DebtSummaryRow[]
    },
  })
}
