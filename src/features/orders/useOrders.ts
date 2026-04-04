import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/services/supabase/client'
import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination'
import type { PaginatedResult } from '@/shared/types/pagination'
import type { OrdersFormValues } from './orders.module'
import type { Order, OrdersFilter, OrderStatus } from './types'

const HEADER_TABLE = 'orders'
const ITEMS_TABLE = 'order_items'
const QUERY_KEY = ['orders'] as const

/* ── List with filters + pagination ── */

export function useOrderList(filters: OrdersFilter = {}, page = 1) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters, page],
    queryFn: async (): Promise<PaginatedResult<Order>> => {
      const from = (page - 1) * DEFAULT_PAGE_SIZE
      const to = from + DEFAULT_PAGE_SIZE - 1

      let query = supabase
        .from(HEADER_TABLE)
        .select('*, customers(name, code), quotations!source_quotation_id(quotation_number)', { count: 'exact' })
        .order('order_date', { ascending: false })
        .range(from, to)

      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.customerId) {
        query = query.eq('customer_id', filters.customerId)
      }
      if (filters.search?.trim()) {
        const q = filters.search.trim()
        query = query.ilike('order_number', `%${q}%`)
      }

      const { data, error, count } = await query
      if (error) throw error
      const total = count ?? 0
      return {
        data: (data ?? []) as unknown as Order[],
        total,
        page,
        pageSize: DEFAULT_PAGE_SIZE,
        totalPages: Math.ceil(total / DEFAULT_PAGE_SIZE),
      }
    },
  })
}

/* ── Single order with items ── */

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(HEADER_TABLE)
        .select('*, customers(name, code), quotations!source_quotation_id(quotation_number), order_items(*)')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as unknown as Order
    },
  })
}

/* ── Auto-generate order number ── */

export function useNextOrderNumber() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'next-number'],
    queryFn: async () => {
      const now = new Date()
      const yy = String(now.getFullYear()).slice(-2)
      const mm = String(now.getMonth() + 1).padStart(2, '0')
      const prefix = `DH${yy}${mm}-`

      const { data, error } = await supabase
        .from(HEADER_TABLE)
        .select('order_number')
        .ilike('order_number', `${prefix}%`)
        .order('order_number', { ascending: false })
        .limit(1)

      if (error) throw error
      if (!data || data.length === 0) return `${prefix}0001`

      const first = data[0]
      if (!first) return `${prefix}0001`
      const last = first.order_number
      const match = last.match(/(\d{4})$/)
      if (!match?.[1]) return `${prefix}0001`

      const nextNum = parseInt(match[1], 10) + 1
      return `${prefix}${String(nextNum).padStart(4, '0')}`
    },
  })
}



/* ── Create order (header + items) ── */

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: OrdersFormValues) => {
      const total = values.items.reduce(
        (sum, it) => sum + it.quantity * it.unitPrice,
        0,
      )

      // 1. Insert header
      const { data: header, error: headerErr } = await supabase
        .from(HEADER_TABLE)
        .insert({
          order_number: values.orderNumber.trim(),
          customer_id: values.customerId,
          order_date: values.orderDate,
          delivery_date: values.deliveryDate?.trim() || null,
          total_amount: total,
          notes: values.notes?.trim() || null,
          status: 'draft' as const,
        })
        .select()
        .single()

      if (headerErr) throw headerErr
      if (!header) throw new Error('Không thể tạo đơn hàng')

      const headerId = (header as Order).id

      // 2. Insert items
      const items = values.items.map((item, idx) => ({
        order_id: headerId,
        fabric_type: item.fabricType.trim(),
        color_name: item.colorName?.trim() || null,
        color_code: item.colorCode?.trim() || null,
        unit: item.unit ?? 'm',
        quantity: item.quantity,
        unit_price: item.unitPrice,
        sort_order: idx,
      }))

      const { error: itemsErr } = await supabase.from(ITEMS_TABLE).insert(items)

      if (itemsErr) {
        await supabase.from(HEADER_TABLE).delete().eq('id', headerId)
        throw itemsErr
      }

      return header as Order
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

/* ── Update order ── */

export function useUpdateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string
      values: OrdersFormValues
    }) => {
      const total = values.items.reduce(
        (sum, it) => sum + it.quantity * it.unitPrice,
        0,
      )

      const { error: headerErr } = await supabase
        .from(HEADER_TABLE)
        .update({
          order_number: values.orderNumber.trim(),
          customer_id: values.customerId,
          order_date: values.orderDate,
          delivery_date: values.deliveryDate?.trim() || null,
          total_amount: total,
          notes: values.notes?.trim() || null,
        })
        .eq('id', id)

      if (headerErr) throw headerErr

      const { error: delErr } = await supabase
        .from(ITEMS_TABLE)
        .delete()
        .eq('order_id', id)

      if (delErr) throw delErr

      const items = values.items.map((item, idx) => ({
        order_id: id,
        fabric_type: item.fabricType.trim(),
        color_name: item.colorName?.trim() || null,
        color_code: item.colorCode?.trim() || null,
        unit: item.unit ?? 'm',
        quantity: item.quantity,
        unit_price: item.unitPrice,
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

/* ── Confirm order → recalculate total, update status, create progress rows ── */

export function useConfirmOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (orderId: string) => {
      // 1. Fetch items to recalculate total
      const { data: items, error: itemsErr } = await supabase
        .from(ITEMS_TABLE)
        .select('quantity, unit_price')
        .eq('order_id', orderId)

      if (itemsErr) throw itemsErr

      const newTotal = (items ?? []).reduce(
        (sum, it) => sum + Number(it.quantity) * Number(it.unit_price),
        0,
      )

      // 2. Update status + recalculate total + log confirmed_at
      const { error: statusErr } = await supabase
        .from(HEADER_TABLE)
        .update({
          status: 'confirmed' as OrderStatus,
          total_amount: newTotal,
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .eq('status', 'draft')

      if (statusErr) throw statusErr

      // 3. Create 7 progress rows
      const stages = [
        'warping', 'weaving', 'greige_check', 'dyeing',
        'finishing', 'final_check', 'packing',
      ] as const

      const progressRows = stages.map((stage) => ({
        order_id: orderId,
        stage,
        status: 'pending' as const,
      }))

      const { error: progressErr } = await supabase
        .from('order_progress')
        .insert(progressRows)

      if (progressErr) throw progressErr
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: ['order-progress'] })
    },
  })
}

/* ── Cancel order ── */

export function useCancelOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (orderId: string) => {
      // 1. Release all reserved rolls back to in_stock
      await supabase
        .from('finished_fabric_rolls')
        .update({ status: 'in_stock', reserved_for_order_id: null })
        .eq('reserved_for_order_id', orderId)
        .eq('status', 'reserved')

      // 2. Cancel the order
      const { error } = await supabase
        .from(HEADER_TABLE)
        .update({ status: 'cancelled' as OrderStatus })
        .eq('id', orderId)

      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: ['reserve-rolls'] })
      void queryClient.invalidateQueries({ queryKey: ['finished-fabric'] })
    },
  })
}

/* ── Complete order ── */

export function useCompleteOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from(HEADER_TABLE)
        .update({ status: 'completed' as OrderStatus })
        .eq('id', orderId)

      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

/* ── Delete order ── */

export function useDeleteOrder() {
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
