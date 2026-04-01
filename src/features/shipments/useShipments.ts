import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/services/supabase/client'
import type { Database } from '@/services/supabase/database.types'
import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination'
import type { PaginatedResult } from '@/shared/types/pagination'
import type { ShipmentsFormValues } from './shipments.module'
import type { Shipment, ShipmentsFilter, ShipmentStatus } from './types'

const HEADER_TABLE = 'shipments'
const ITEMS_TABLE = 'shipment_items'
const QUERY_KEY = ['shipments'] as const

type ShipmentHeaderRow = Database['public']['Tables']['shipments']['Row']

/* ── Shipment list with filters ── */

export function useShipmentList(filters: ShipmentsFilter = {}, page = 1) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters, page],
    queryFn: async (): Promise<PaginatedResult<Shipment>> => {
      const from = (page - 1) * DEFAULT_PAGE_SIZE
      const to = from + DEFAULT_PAGE_SIZE - 1

      let query = supabase
        .from(HEADER_TABLE)
        .select('*, orders(order_number), customers(name, code)', { count: 'exact' })
        .order('shipment_date', { ascending: false })
        .range(from, to)

      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.orderId) {
        query = query.eq('order_id', filters.orderId)
      }
      if (filters.search?.trim()) {
        const q = filters.search.trim()
        query = query.ilike('shipment_number', `%${q}%`)
      }

      const { data, error, count } = await query
      if (error) throw error
      const total = count ?? 0
      return {
        data: (data ?? []) as unknown as Shipment[],
        total,
        page,
        pageSize: DEFAULT_PAGE_SIZE,
        totalPages: Math.ceil(total / DEFAULT_PAGE_SIZE),
      }
    },
  })
}

/* ── Single shipment with items ── */

export function useShipment(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(HEADER_TABLE)
        .select('*, orders(order_number), customers(name, code), shipment_items(*)')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as unknown as Shipment
    },
  })
}

/* ── Auto-generate shipment number ── */

export function useNextShipmentNumber() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'next-number'],
    queryFn: async () => {
      const now = new Date()
      const yy = String(now.getFullYear()).slice(-2)
      const mm = String(now.getMonth() + 1).padStart(2, '0')
      const prefix = `XK${yy}${mm}-`

      const { data, error } = await supabase
        .from(HEADER_TABLE)
        .select('shipment_number')
        .ilike('shipment_number', `${prefix}%`)
        .order('shipment_number', { ascending: false })
        .limit(1)

      if (error) throw error
      if (!data || data.length === 0) return `${prefix}0001`

      const first = data[0]
      if (!first) return `${prefix}0001`
      const last = first.shipment_number
      const match = last.match(/(\d{4})$/)
      if (!match?.[1]) return `${prefix}0001`

      const nextNum = parseInt(match[1], 10) + 1
      return `${prefix}${String(nextNum).padStart(4, '0')}`
    },
  })
}

/* ── Available finished rolls for picking ── */

export function useAvailableFinishedRolls() {
  return useQuery({
    queryKey: ['finished-fabric-rolls', 'available'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('finished_fabric_rolls')
        .select('id, roll_number, fabric_type, color_name, length_m, weight_kg, status')
        .eq('status', 'in_stock')
        .order('roll_number')
      if (error) throw error
      return data ?? []
    },
  })
}

/* ── Create shipment ── */

export function useCreateShipment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: ShipmentsFormValues) => {
      const { data: header, error: headerErr } = await supabase
        .from(HEADER_TABLE)
        .insert({
          shipment_number: values.shipmentNumber.trim(),
          order_id: values.orderId,
          customer_id: values.customerId,
          shipment_date: values.shipmentDate,
          delivery_address: values.deliveryAddress?.trim() || null,
          status: 'preparing' as const,
        })
        .select()
        .single()

      if (headerErr) throw headerErr

      const shipmentHeader = header as ShipmentHeaderRow
      const headerId = shipmentHeader.id

      const items = values.items.map((item, idx) => ({
        shipment_id: headerId,
        finished_roll_id: item.finishedRollId?.trim() || null,
        fabric_type: item.fabricType.trim(),
        quantity: item.quantity,
        unit: 'm',
        sort_order: idx,
      }))

      const { error: itemsErr } = await supabase.from(ITEMS_TABLE).insert(items)

      if (itemsErr) {
        await supabase.from(HEADER_TABLE).delete().eq('id', headerId)
        throw itemsErr
      }

      // Mark rolls as reserved if linked
      const rollIds = values.items
        .map((i) => i.finishedRollId?.trim())
        .filter((id): id is string => !!id)

      if (rollIds.length > 0) {
        await supabase
          .from('finished_fabric_rolls')
          .update({ status: 'reserved' })
          .in('id', rollIds)
      }

      return shipmentHeader as Shipment
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
      void queryClient.invalidateQueries({ queryKey: ['finished-fabric-rolls'] })
    },
  })
}

/* ── Confirm shipment (preparing → shipped) ── */

export function useConfirmShipment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (shipmentId: string) => {
      // Get shipment items to update roll statuses
      const { data: items } = await supabase
        .from(ITEMS_TABLE)
        .select('finished_roll_id')
        .eq('shipment_id', shipmentId)

      const { error } = await supabase
        .from(HEADER_TABLE)
        .update({ status: 'shipped' as ShipmentStatus })
        .eq('id', shipmentId)
        .eq('status', 'preparing')

      if (error) throw error

      // Update roll statuses to shipped
      const rollIds = (items ?? [])
        .map((i) => i.finished_roll_id)
        .filter((id): id is string => !!id)

      if (rollIds.length > 0) {
        await supabase
          .from('finished_fabric_rolls')
          .update({ status: 'shipped' })
          .in('id', rollIds)
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
      void queryClient.invalidateQueries({ queryKey: ['finished-fabric-rolls'] })
    },
  })
}

/* ── Mark delivered ── */

export function useMarkDelivered() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (shipmentId: string) => {
      const { error } = await supabase
        .from(HEADER_TABLE)
        .update({ status: 'delivered' as ShipmentStatus })
        .eq('id', shipmentId)
        .eq('status', 'shipped')

      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

/* ── Delete shipment (preparing only) ── */

export function useDeleteShipment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (shipmentId: string) => {
      // Restore roll statuses
      const { data: items } = await supabase
        .from(ITEMS_TABLE)
        .select('finished_roll_id')
        .eq('shipment_id', shipmentId)

      const rollIds = (items ?? [])
        .map((i) => i.finished_roll_id)
        .filter((id): id is string => !!id)

      if (rollIds.length > 0) {
        await supabase
          .from('finished_fabric_rolls')
          .update({ status: 'in_stock' })
          .in('id', rollIds)
      }

      const { error } = await supabase
        .from(HEADER_TABLE)
        .delete()
        .eq('id', shipmentId)
        .eq('status', 'preparing')

      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: ['finished-fabric-rolls'] })
    },
  })
}

/* ── Shipments for a specific order ── */

export function useOrderShipments(orderId: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'by-order', orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(HEADER_TABLE)
        .select('*, shipment_items(*)')
        .eq('order_id', orderId!)
        .order('shipment_date', { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as Shipment[]
    },
  })
}
