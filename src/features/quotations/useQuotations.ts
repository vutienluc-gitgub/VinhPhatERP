import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/services/supabase/client'
import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination'
import type { PaginatedResult } from '@/shared/types/pagination'
import type { QuotationsFormValues } from './quotations.module'
import { calculateQuotationTotals } from './quotations.module'
import type { DiscountType, Quotation, QuotationsFilter, QuotationStatus } from './types'

const HEADER_TABLE = 'quotations'
const ITEMS_TABLE = 'quotation_items'
const QUERY_KEY = ['quotations'] as const

/* ── List with filters + pagination ── */

export function useQuotationList(filters: QuotationsFilter = {}, page = 1) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters, page],
    queryFn: async (): Promise<PaginatedResult<Quotation>> => {
      const from = (page - 1) * DEFAULT_PAGE_SIZE
      const to = from + DEFAULT_PAGE_SIZE - 1

      let query = supabase
        .from(HEADER_TABLE)
        .select('*, customers(name, code)', { count: 'exact' })
        .order('quotation_date', { ascending: false })
        .range(from, to)

      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.customerId) {
        query = query.eq('customer_id', filters.customerId)
      }
      if (filters.search?.trim()) {
        const q = filters.search.trim()
        query = query.ilike('quotation_number', `%${q}%`)
      }

      const { data, error, count } = await query
      if (error) throw error
      const total = count ?? 0
      return {
        data: (data ?? []) as unknown as Quotation[],
        total,
        page,
        pageSize: DEFAULT_PAGE_SIZE,
        totalPages: Math.ceil(total / DEFAULT_PAGE_SIZE),
      }
    },
  })
}

/* ── Single quotation with items ── */

export function useQuotation(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(HEADER_TABLE)
        .select('*, customers(name, code), quotation_items(*)')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as unknown as Quotation
    },
  })
}

/* ── Auto-generate quotation number ── */

export function useNextQuotationNumber() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'next-number'],
    queryFn: async () => {
      const now = new Date()
      const yy = String(now.getFullYear()).slice(-2)
      const mm = String(now.getMonth() + 1).padStart(2, '0')
      const prefix = `BG${yy}${mm}-`

      const { data, error } = await supabase
        .from(HEADER_TABLE)
        .select('quotation_number')
        .ilike('quotation_number', `${prefix}%`)
        .order('quotation_number', { ascending: false })
        .limit(1)

      if (error) throw error
      if (!data || data.length === 0) return `${prefix}0001`

      const first = data[0]
      if (!first) return `${prefix}0001`
      const last = first.quotation_number
      const match = last.match(/(\d{4})$/)
      if (!match?.[1]) return `${prefix}0001`

      const nextNum = parseInt(match[1], 10) + 1
      return `${prefix}${String(nextNum).padStart(4, '0')}`
    },
  })
}



/* ── Create quotation (header + items) ── */

export function useCreateQuotation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: QuotationsFormValues) => {
      const totals = calculateQuotationTotals(
        values.items,
        values.discountType as DiscountType,
        values.discountValue,
        values.vatRate,
      )

      // 1. Insert header
      const { data: header, error: headerErr } = await supabase
        .from(HEADER_TABLE)
        .insert({
          quotation_number: values.quotationNumber.trim(),
          customer_id: values.customerId,
          quotation_date: values.quotationDate,
          valid_until: values.validUntil?.trim() || null,
          subtotal: totals.subtotal,
          discount_type: values.discountType,
          discount_value: values.discountValue,
          discount_amount: totals.discountAmount,
          total_before_vat: totals.totalBeforeVat,
          vat_rate: values.vatRate,
          vat_amount: totals.vatAmount,
          total_amount: totals.totalAmount,
          delivery_terms: values.deliveryTerms?.trim() || null,
          payment_terms: values.paymentTerms?.trim() || null,
          notes: values.notes?.trim() || null,
          status: 'draft' as const,
        })
        .select()
        .single()

      if (headerErr) throw headerErr
      if (!header) throw new Error('Không thể tạo báo giá')

      const headerId = (header as unknown as Quotation).id

      // 2. Insert items
      const items = values.items.map((item, idx) => ({
        quotation_id: headerId,
        fabric_type: item.fabricType.trim(),
        color_name: item.colorName?.trim() || null,
        color_code: item.colorCode?.trim() || null,
        width_cm: item.widthCm || null,
        unit: item.unit ?? 'm',
        quantity: item.quantity,
        unit_price: item.unitPrice,
        lead_time_days: item.leadTimeDays || null,
        notes: item.notes?.trim() || null,
        sort_order: idx,
      }))

      const { error: itemsErr } = await supabase.from(ITEMS_TABLE).insert(items)

      if (itemsErr) {
        await supabase.from(HEADER_TABLE).delete().eq('id', headerId)
        throw itemsErr
      }

      return header as unknown as Quotation
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

/* ── Update quotation ── */

export function useUpdateQuotation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string
      values: QuotationsFormValues
    }) => {
      const totals = calculateQuotationTotals(
        values.items,
        values.discountType as DiscountType,
        values.discountValue,
        values.vatRate,
      )

      const { error: headerErr } = await supabase
        .from(HEADER_TABLE)
        .update({
          quotation_number: values.quotationNumber.trim(),
          customer_id: values.customerId,
          quotation_date: values.quotationDate,
          valid_until: values.validUntil?.trim() || null,
          subtotal: totals.subtotal,
          discount_type: values.discountType,
          discount_value: values.discountValue,
          discount_amount: totals.discountAmount,
          total_before_vat: totals.totalBeforeVat,
          vat_rate: values.vatRate,
          vat_amount: totals.vatAmount,
          total_amount: totals.totalAmount,
          delivery_terms: values.deliveryTerms?.trim() || null,
          payment_terms: values.paymentTerms?.trim() || null,
          notes: values.notes?.trim() || null,
        })
        .eq('id', id)

      if (headerErr) throw headerErr

      const { error: delErr } = await supabase
        .from(ITEMS_TABLE)
        .delete()
        .eq('quotation_id', id)

      if (delErr) throw delErr

      const items = values.items.map((item, idx) => ({
        quotation_id: id,
        fabric_type: item.fabricType.trim(),
        color_name: item.colorName?.trim() || null,
        color_code: item.colorCode?.trim() || null,
        width_cm: item.widthCm || null,
        unit: item.unit ?? 'm',
        quantity: item.quantity,
        unit_price: item.unitPrice,
        lead_time_days: item.leadTimeDays || null,
        notes: item.notes?.trim() || null,
        sort_order: idx,
      }))

      const { error: insertErr } = await supabase.from(ITEMS_TABLE).insert(items)
      if (insertErr) throw insertErr
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

/* ── Send quotation to customer ── */

export function useSendQuotation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (quotationId: string) => {
      const { error } = await supabase
        .from(HEADER_TABLE)
        .update({ status: 'sent' as QuotationStatus })
        .eq('id', quotationId)
        .in('status', ['draft'])

      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

/* ── Confirm quotation (customer approved) ── */

export function useConfirmQuotation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (quotationId: string) => {
      const { error } = await supabase
        .from(HEADER_TABLE)
        .update({
          status: 'confirmed' as QuotationStatus,
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', quotationId)
        .in('status', ['sent', 'draft'])

      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

/* ── Reject quotation ── */

export function useRejectQuotation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (quotationId: string) => {
      const { error } = await supabase
        .from(HEADER_TABLE)
        .update({ status: 'rejected' as QuotationStatus })
        .eq('id', quotationId)
        .in('status', ['sent', 'draft'])

      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

/* ── Delete quotation ── */

export function useDeleteQuotation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(HEADER_TABLE).delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

/* ── Expiring quotations count (for warnings) ── */

export function useExpiringQuotationsCount() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'expiring-count'],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10)
      const threeDaysLater = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)

      // Count quotations expiring within 3 days
      const { count: expiringCount, error: err1 } = await supabase
        .from(HEADER_TABLE)
        .select('*', { count: 'exact', head: true })
        .in('status', ['draft', 'sent'])
        .gte('valid_until', today)
        .lte('valid_until', threeDaysLater)

      if (err1) throw err1

      // Count already expired quotations still not rejected/converted
      const { count: expiredCount, error: err2 } = await supabase
        .from(HEADER_TABLE)
        .select('*', { count: 'exact', head: true })
        .in('status', ['draft', 'sent'])
        .lt('valid_until', today)

      if (err2) throw err2

      return {
        expiring: expiringCount ?? 0,
        expired: expiredCount ?? 0,
      }
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 min
  })
}
