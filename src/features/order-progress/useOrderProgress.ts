import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/services/supabase/client'
import type { OrderProgress, OrderProgressWithOrder, ProgressAuditLog, ProgressAuditLogWithOrder, StageStatus } from './types'

const TABLE = 'order_progress'
const QUERY_KEY = ['order-progress'] as const
const AUDIT_KEY = ['progress-audit'] as const

// progress_audit_log isn't in generated DB types yet — use untyped client for it
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const auditTable = () => (supabase as any).from('progress_audit_log')

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
      // 1. Fetch current row to get old_status for audit
      const { data: current, error: fetchErr } = await supabase
        .from(TABLE)
        .select('order_id, stage, status')
        .eq('id', progressId)
        .single()
      if (fetchErr) throw fetchErr

      const oldStatus = current.status as StageStatus

      // 2. Update the progress row
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

      // 3. Write audit log entry
      const { data: userData } = await supabase.auth.getUser()
      await auditTable().insert({
        progress_id: progressId,
        order_id: current.order_id,
        stage: current.stage,
        old_status: oldStatus,
        new_status: status,
        changed_by: userData.user?.id ?? null,
        notes: notes?.trim() || null,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: AUDIT_KEY })
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

/* ── Audit log for a single order ── */

export function useProgressAuditLog(orderId: string | undefined) {
  return useQuery({
    queryKey: [...AUDIT_KEY, orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const { data, error } = await auditTable()
        .select('*')
        .eq('order_id', orderId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as ProgressAuditLog[]
    },
  })
}

/* ── Recent audit log (all orders) ── */

export function useRecentAuditLog(limit = 50) {
  return useQuery({
    queryKey: [...AUDIT_KEY, 'recent', limit],
    queryFn: async () => {
      const { data, error } = await auditTable()
        .select('*, orders(order_number, customers(name))')
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return (data ?? []) as ProgressAuditLogWithOrder[]
    },
  })
}

/* ── Dashboard: overdue & ready-to-ship ── */

export function useProgressDashboard() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*, orders(id, order_number, delivery_date, status, customers(name))')
        .order('created_at')
      if (error) throw error

      const rows = (data ?? []) as unknown as OrderProgressWithOrder[]
      const today = new Date().toISOString().slice(0, 10)

      // Group by order
      const orderMap = new Map<string, {
        orderId: string
        orderNumber: string
        customerName: string
        deliveryDate: string | null
        orderStatus: string
        stages: OrderProgressWithOrder[]
      }>()

      for (const row of rows) {
        let group = orderMap.get(row.order_id)
        if (!group) {
          group = {
            orderId: row.order_id,
            orderNumber: row.orders?.order_number ?? '—',
            customerName: row.orders?.customers?.name ?? '—',
            deliveryDate: row.orders?.delivery_date ?? null,
            orderStatus: (row.orders as Record<string, unknown>)?.status as string ?? '',
            stages: [],
          }
          orderMap.set(row.order_id, group)
        }
        group.stages.push(row)
      }

      const allOrders = Array.from(orderMap.values())

      // Overdue: delivery_date < today AND not all stages done
      const overdue = allOrders.filter((o) => {
        if (!o.deliveryDate || o.deliveryDate >= today) return false
        if (o.orderStatus === 'completed' || o.orderStatus === 'cancelled') return false
        const allDone = o.stages.every((s) => s.status === 'done' || s.status === 'skipped')
        return !allDone
      })

      // Ready to ship: all stages done but order not yet completed
      const readyToShip = allOrders.filter((o) => {
        if (o.orderStatus === 'completed' || o.orderStatus === 'cancelled') return false
        const nonSkipped = o.stages.filter((s) => s.status !== 'skipped')
        return nonSkipped.length > 0 && nonSkipped.every((s) => s.status === 'done')
      })

      // In progress: has at least one stage in_progress
      const inProgress = allOrders.filter((o) => {
        if (o.orderStatus === 'completed' || o.orderStatus === 'cancelled') return false
        return o.stages.some((s) => s.status === 'in_progress')
      })

      return { overdue, readyToShip, inProgress, totalOrders: allOrders.length }
    },
  })
}
