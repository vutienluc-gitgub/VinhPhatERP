import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  fetchOrdersPaginated,
  fetchOrderById,
  fetchNextOrderNumber,
  createOrder,
  updateOrderWithItems,
  confirmOrder,
  cancelOrder,
  completeOrder,
  deleteOrder,
} from '@/api/orders.api'

import type { OrdersFormValues } from './orders.module'
import type { OrdersFilter } from './types'

const QUERY_KEY = ['orders'] as const

/* ── List with filters + pagination ── */

export function useOrderList(filters: OrdersFilter = {}, page = 1) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters, page] as const,
    queryFn: () => fetchOrdersPaginated(filters, page),
  })
}

/* ── Single order with items ── */

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    enabled: !!id,
    queryFn: () => fetchOrderById(id!),
  })
}

/* ── Auto-generate order number ── */

export function useNextOrderNumber() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'next-number'],
    queryFn: fetchNextOrderNumber,
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

      return createOrder(
        {
          order_number: values.orderNumber.trim(),
          customer_id: values.customerId,
          order_date: values.orderDate,
          delivery_date: values.deliveryDate?.trim() || null,
          total_amount: total,
          notes: values.notes?.trim() || null,
          status: 'draft' as const,
        },
        values.items.map((item, idx) => ({
          fabric_type: item.fabricType.trim(),
          color_name: item.colorName?.trim() || null,
          color_code: item.colorCode?.trim() || null,
          unit: item.unit ?? 'kg',
          quantity: item.quantity,
          unit_price: item.unitPrice,
          sort_order: idx,
        })),
      )
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

      await updateOrderWithItems(
        id,
        {
          order_number: values.orderNumber.trim(),
          customer_id: values.customerId,
          order_date: values.orderDate,
          delivery_date: values.deliveryDate?.trim() || null,
          total_amount: total,
          notes: values.notes?.trim() || null,
        },
        values.items.map((item, idx) => ({
          fabric_type: item.fabricType.trim(),
          color_name: item.colorName?.trim() || null,
          color_code: item.colorCode?.trim() || null,
          unit: item.unit ?? 'kg',
          quantity: item.quantity,
          unit_price: item.unitPrice,
          sort_order: idx,
        })),
      )
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
    mutationFn: confirmOrder,
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
    mutationFn: cancelOrder,
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
    mutationFn: completeOrder,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

/* ── Delete order ── */

export function useDeleteOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteOrder,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
