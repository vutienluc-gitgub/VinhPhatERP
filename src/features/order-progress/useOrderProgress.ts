import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/services/supabase/client'
import type { OrderProgress, OrderProgressWithOrder, StageStatus } from './types'

const TABLE = 'order_progress'
const QUERY_KEY = ['order-progress'] as const

/* ── Progress rows for a single order ── */

export function useOrderProgress(orderId: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('order_id', orderId!)
        .order('created_at')
      if (error) throw error
      return (data ?? []) as OrderProgress[]
    },
  })
}

/* ── Board view: all progress rows grouped by order (for confirmed/in_progress orders) ── */

export function useProgressBoard() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'board'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*, orders(order_number, delivery_date, customers(name))')
        .order('created_at')
      if (error) throw error
      return (data ?? []) as unknown as OrderProgressWithOrder[]
    },
  })
}

/* ── Update a single stage status ── */

export function useUpdateStageStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      progressId,
      status,
      notes,
    }: {
      progressId: string
      status: StageStatus
      notes?: string
    }) => {
      const update: Record<string, unknown> = { status }
      if (status === 'in_progress' || status === 'done') {
        update.actual_date = new Date().toISOString().slice(0, 10)
      }
      if (notes !== undefined) {
        update.notes = notes.trim() || null
      }

      const { error } = await supabase
        .from(TABLE)
        .update(update)
        .eq('id', progressId)

      if (error) throw error

      // If marking done, check if all stages are done → update order status
      // We do this optimistically — the real logic could also be a DB trigger
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

/* ── Update planned date for a stage ── */

export function useUpdatePlannedDate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      progressId,
      plannedDate,
    }: {
      progressId: string
      plannedDate: string | null
    }) => {
      const { error } = await supabase
        .from(TABLE)
        .update({ planned_date: plannedDate })
        .eq('id', progressId)

      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
