import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/services/supabase/client'
import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination'
import type { PaginatedResult } from '@/shared/types/pagination'
import type { YarnReceiptsFormValues } from './yarn-receipts.module'
import type { YarnReceipt, YarnReceiptsFilter } from './types'

const HEADER_TABLE = 'yarn_receipts'
const ITEMS_TABLE = 'yarn_receipt_items'
const QUERY_KEY = ['yarn-receipts'] as const

/* ── List with filters ── */

export function useYarnReceiptList(filters: YarnReceiptsFilter = {}, page = 1) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters, page],
    queryFn: async (): Promise<PaginatedResult<YarnReceipt>> => {
      const from = (page - 1) * DEFAULT_PAGE_SIZE
      const to = from + DEFAULT_PAGE_SIZE - 1

      let query = supabase
        .from(HEADER_TABLE)
        .select('*, suppliers(name, code)', { count: 'exact' })
        .order('receipt_date', { ascending: false })
        .range(from, to)

      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.supplierId) {
        query = query.eq('supplier_id', filters.supplierId)
      }
      if (filters.dateFrom) {
        query = query.gte('receipt_date', filters.dateFrom)
      }
      if (filters.dateTo) {
        query = query.lte('receipt_date', filters.dateTo)
      }
      if (filters.search?.trim()) {
        const q = filters.search.trim()
        query = query.ilike('receipt_number', `%${q}%`)
      }

      const { data, error, count } = await query
      if (error) throw error
      const total = count ?? 0
      return {
        data: (data ?? []) as unknown as YarnReceipt[],
        total,
        page,
        pageSize: DEFAULT_PAGE_SIZE,
        totalPages: Math.ceil(total / DEFAULT_PAGE_SIZE),
      }
    },
  })
}

/* ── Single receipt with items ── */

export function useYarnReceipt(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(HEADER_TABLE)
        .select('*, suppliers(name, code), yarn_receipt_items(*)')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as unknown as YarnReceipt
    },
  })
}

/* ── Auto-generate receipt number ── */

export function useNextReceiptNumber() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'next-number'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(HEADER_TABLE)
        .select('receipt_number')
        .ilike('receipt_number', 'NS-%')
        .order('receipt_number', { ascending: false })
        .limit(1)

      if (error) throw error
      if (!data || data.length === 0) return 'NS-001'

      const first = data[0]
      if (!first) return 'NS-001'
      const last = first.receipt_number
      const match = last.match(/^NS-(\d+)$/)
      if (!match?.[1]) return 'NS-001'

      const nextNum = parseInt(match[1], 10) + 1
      return `NS-${String(nextNum).padStart(3, '0')}`
    },
  })
}

/* ── Active suppliers for picker ── */

export function useActiveSuppliers() {
  return useQuery({
    queryKey: ['suppliers', 'active-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, code, name')
        .eq('category', 'yarn')
        .eq('status', 'active')
        .order('name')
      if (error) throw error
      return data ?? []
    },
  })
}

/* ── Yarn catalog options for picker ── */

export type YarnCatalogOption = {
  id: string
  code: string
  name: string
  composition: string | null
  color_name: string | null
  tensile_strength: string | null
  origin: string | null
  unit: string
}

export function useYarnCatalogOptions() {
  return useQuery({
    queryKey: ['yarn-catalog', 'receipt-picker'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('yarn_catalogs')
        .select('id, code, name, composition, color_name, tensile_strength, origin, unit')
        .eq('status', 'active')
        .order('name')
      if (error) throw error
      return (data ?? []) as YarnCatalogOption[]
    },
  })
}

/* ── Create receipt (header + items in one transaction) ── */

export function useCreateYarnReceipt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: YarnReceiptsFormValues) => {
      // 1. Insert header
      const { data: header, error: headerErr } = await supabase
        .from(HEADER_TABLE)
        .insert({
          receipt_number: values.receiptNumber.trim(),
          supplier_id: values.supplierId,
          receipt_date: values.receiptDate,
          notes: values.notes?.trim() || null,
          status: 'draft' as const,
        })
        .select('id, receipt_number, supplier_id, receipt_date, total_amount, status, notes, created_by, created_at, updated_at')
        .single()

      if (headerErr) throw headerErr

      const headerId = header.id

      // 2. Insert items
      const items = values.items.map((item, idx) => ({
        receipt_id: headerId,
        yarn_type: item.yarnType.trim(),
        color_name: item.colorName?.trim() || null,
        unit: 'kg',
        quantity: item.quantity,
        unit_price: item.unitPrice,
        lot_number: item.lotNumber?.trim() || null,
        tensile_strength: item.tensileStrength?.trim() || null,
        composition: item.composition?.trim() || null,
        origin: item.origin?.trim() || null,
        yarn_catalog_id: item.yarnCatalogId?.trim() || null,
        sort_order: idx,
      }))

      const { error: itemsErr } = await supabase.from(ITEMS_TABLE).insert(items)

      if (itemsErr) {
        // Rollback header if items fail
        await supabase.from(HEADER_TABLE).delete().eq('id', headerId)
        throw itemsErr
      }

      // 3. Update total_amount on header
      const total = values.items.reduce(
        (sum, it) => sum + it.quantity * it.unitPrice,
        0,
      )
      await supabase
        .from(HEADER_TABLE)
        .update({ total_amount: total })
        .eq('id', headerId)

      return header as YarnReceipt
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

/* ── Update receipt ── */

export function useUpdateYarnReceipt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string
      values: YarnReceiptsFormValues
    }) => {
      // 1. Update header
      const { error: headerErr } = await supabase
        .from(HEADER_TABLE)
        .update({
          receipt_number: values.receiptNumber.trim(),
          supplier_id: values.supplierId,
          receipt_date: values.receiptDate,
          notes: values.notes?.trim() || null,
          total_amount: values.items.reduce(
            (sum, it) => sum + it.quantity * it.unitPrice,
            0,
          ),
        })
        .eq('id', id)

      if (headerErr) throw headerErr

      // 2. Delete old items and insert new ones
      const { error: delErr } = await supabase
        .from(ITEMS_TABLE)
        .delete()
        .eq('receipt_id', id)

      if (delErr) throw delErr

      const items = values.items.map((item, idx) => ({
        receipt_id: id,
        yarn_type: item.yarnType.trim(),
        color_name: item.colorName?.trim() || null,
        unit: 'kg',
        quantity: item.quantity,
        unit_price: item.unitPrice,
        lot_number: item.lotNumber?.trim() || null,
        tensile_strength: item.tensileStrength?.trim() || null,
        composition: item.composition?.trim() || null,
        origin: item.origin?.trim() || null,
        yarn_catalog_id: item.yarnCatalogId?.trim() || null,
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

/* ── Delete receipt ── */

export function useDeleteYarnReceipt() {
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
