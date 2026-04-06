import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/services/supabase/client'
import type { Database } from '@/services/supabase/database.types'
import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination'
import type { PaginatedResult } from '@/shared/types/pagination'
import type { ShipmentsFormValues, DeliveryConfirmFormValues } from './shipments.module'
import { exportShipmentToPdf } from './shipment-document'
import type { Shipment, ShipmentDocument, ShipmentsFilter, ShipmentStatus, DeliveryStaffSummary } from './types'

const HEADER_TABLE = 'shipments'
const ITEMS_TABLE = 'shipment_items'
const QUERY_KEY = ['shipments'] as const

type ShipmentHeaderRow = Database['public']['Tables']['shipments']['Row']
type FinishedRollAvailabilityRow = Pick<
  Database['public']['Tables']['finished_fabric_rolls']['Row'],
  'id' | 'fabric_type' | 'color_name'
>
type FinishedRollDocumentRow = Pick<
  Database['public']['Tables']['finished_fabric_rolls']['Row'],
  'id' | 'roll_number' | 'color_name' | 'length_m' | 'warehouse_location'
>

async function fetchReservableRolls(rollIds: string[]): Promise<Map<string, FinishedRollAvailabilityRow>> {
  const uniqueRollIds = Array.from(new Set(rollIds))
  if (uniqueRollIds.length === 0) return new Map()

  const { data, error } = await supabase
    .from('finished_fabric_rolls')
    .select('id, fabric_type, color_name')
    .in('status', ['in_stock', 'reserved'])
    .in('id', uniqueRollIds)

  if (error) throw error

  const rows = (data ?? []) as FinishedRollAvailabilityRow[]
  if (rows.length !== uniqueRollIds.length) {
    throw new Error('Một hoặc nhiều cuộn thành phẩm không còn sẵn sàng để xuất.')
  }

  return new Map(rows.map((row) => [row.id, row]))
}

export async function fetchShipmentDocument(shipmentId: string): Promise<ShipmentDocument> {
  const { data, error } = await supabase
    .from(HEADER_TABLE)
    .select('*, orders(order_number), customers(name, code, address, phone, contact_person), shipment_items(*)')
    .eq('id', shipmentId)
    .single()

  if (error) throw error

  const shipment = data as unknown as ShipmentDocument
  const shipmentItems = shipment.shipment_items ?? []
  const rollIds = Array.from(
    new Set(
      shipmentItems
        .map((item) => item.finished_roll_id)
        .filter((rollId): rollId is string => !!rollId),
    ),
  )

  if (rollIds.length === 0) {
    return {
      ...shipment,
      shipment_items: shipmentItems.map((item) => ({
        ...item,
        roll_number: null,
        roll_length_m: null,
        warehouse_location: null,
      })),
    }
  }

  const { data: rolls, error: rollError } = await supabase
    .from('finished_fabric_rolls')
    .select('id, roll_number, color_name, length_m, warehouse_location')
    .in('id', rollIds)

  if (rollError) throw rollError

  const rollMap = new Map(
    ((rolls ?? []) as FinishedRollDocumentRow[]).map((roll) => [roll.id, roll]),
  )

  return {
    ...shipment,
    shipment_items: shipmentItems.map((item) => {
      const roll = item.finished_roll_id ? rollMap.get(item.finished_roll_id) : undefined
      return {
        ...item,
        color_name: item.color_name ?? roll?.color_name ?? null,
        roll_number: roll?.roll_number ?? null,
        roll_length_m: roll?.length_m ?? null,
        warehouse_location: roll?.warehouse_location ?? null,
      }
    }),
  }
}

/* ── Shipment list with filters ── */

export function useShipmentList(filters: ShipmentsFilter = {}, page = 1) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters, page],
    queryFn: async (): Promise<PaginatedResult<Shipment>> => {
      const from = (page - 1) * DEFAULT_PAGE_SIZE
      const to = from + DEFAULT_PAGE_SIZE - 1

      let query = supabase
        .from(HEADER_TABLE)
        .select('*, orders(order_number), customers(name, code), delivery_staff:profiles!shipments_delivery_staff_id_fkey(full_name, phone)', { count: 'exact' })
        .order('shipment_date', { ascending: false })
        .range(from, to)

      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.orderId) {
        query = query.eq('order_id', filters.orderId)
      }
      if (filters.deliveryStaffId) {
        query = query.eq('delivery_staff_id', filters.deliveryStaffId)
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
    queryFn: async () => fetchShipmentDocument(id!),
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

export function useAvailableFinishedRolls(orderId?: string) {
  return useQuery({
    queryKey: ['finished-fabric-rolls', 'available', orderId],
    queryFn: async () => {
      // 1. Fetch in_stock rolls
      const { data: inStock, error: e1 } = await supabase
        .from('finished_fabric_rolls')
        .select('id, roll_number, fabric_type, color_name, length_m, weight_kg, status')
        .eq('status', 'in_stock')
        .order('roll_number')
      if (e1) throw e1

      // 2. Fetch reserved rolls for this order (prioritized)
      if (!orderId) return inStock ?? []

      const { data: reserved, error: e2 } = await supabase
        .from('finished_fabric_rolls')
        .select('id, roll_number, fabric_type, color_name, length_m, weight_kg, status')
        .eq('status', 'reserved')
        .eq('reserved_for_order_id', orderId)
        .order('roll_number')
      if (e2) throw e2

      // Reserved rolls first, then in_stock
      return [...(reserved ?? []), ...(inStock ?? [])]
    },
  })
}

/* ── Create shipment ── */

export function useCreateShipment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: ShipmentsFormValues) => {
      const selectedRollIds = values.items
        .map((item) => item.finishedRollId?.trim())
        .filter((id): id is string => !!id)
      const selectedRollMap = await fetchReservableRolls(selectedRollIds)

      const { data: header, error: headerErr } = await supabase
        .from(HEADER_TABLE)
        .insert({
          shipment_number: values.shipmentNumber.trim(),
          order_id: values.orderId,
          customer_id: values.customerId,
          shipment_date: values.shipmentDate,
          delivery_address: values.deliveryAddress?.trim() || null,
          delivery_staff_id: values.deliveryStaffId?.trim() || null,
          shipping_rate_id: values.shippingRateId?.trim() || null,
          shipping_cost: values.shippingCost,
          loading_fee: values.loadingFee,
          vehicle_info: values.vehicleInfo?.trim() || null,
          status: 'preparing' as const,
        })
        .select()
        .single()

      if (headerErr) throw headerErr

      const shipmentHeader = header as ShipmentHeaderRow
      const headerId = shipmentHeader.id

      const items = values.items.map((item, idx) => {
        const finishedRollId = item.finishedRollId?.trim() || null
        const selectedRoll = finishedRollId ? selectedRollMap.get(finishedRollId) : undefined

        return {
          shipment_id: headerId,
          finished_roll_id: finishedRollId,
          fabric_type: selectedRoll?.fabric_type ?? item.fabricType.trim(),
          color_name: selectedRoll?.color_name ?? null,
          quantity: item.quantity,
          unit: 'kg',
          sort_order: idx,
        }
      })

      const { error: itemsErr } = await supabase.from(ITEMS_TABLE).insert(items)

      if (itemsErr) {
        await supabase.from(HEADER_TABLE).delete().eq('id', headerId)
        throw itemsErr
      }

      // Mark rolls as reserved/preparing if linked
      const rollIds = selectedRollIds

      if (rollIds.length > 0) {
        await supabase
          .from('finished_fabric_rolls')
          .update({ status: 'reserved', reserved_for_order_id: values.orderId })
          .in('id', rollIds)
      }

      return shipmentHeader as Shipment
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
      void queryClient.invalidateQueries({ queryKey: ['finished-fabric-rolls'] })
      void queryClient.invalidateQueries({ queryKey: ['reserve-rolls'] })
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
        .update({ status: 'shipped' as ShipmentStatus, shipped_at: new Date().toISOString() })
        .eq('id', shipmentId)
        .eq('status', 'preparing')

      if (error) throw error

      // Update roll statuses to shipped + clear reservation
      const rollIds = (items ?? [])
        .map((i) => i.finished_roll_id)
        .filter((id): id is string => !!id)

      if (rollIds.length > 0) {
        await supabase
          .from('finished_fabric_rolls')
          .update({ status: 'shipped', reserved_for_order_id: null })
          .in('id', rollIds)
      }

      return fetchShipmentDocument(shipmentId)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
      void queryClient.invalidateQueries({ queryKey: ['finished-fabric-rolls'] })
      void queryClient.invalidateQueries({ queryKey: ['reserve-rolls'] })
    },
  })
}

export function useExportShipmentPdf() {
  return useMutation({
    mutationFn: async (shipmentId: string) => {
      const shipment = await fetchShipmentDocument(shipmentId)
      exportShipmentToPdf(shipment)
      return shipment
    },
  })
}

/* ── Mark delivered (with proof) ── */

export function useMarkDelivered() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ shipmentId, values }: { shipmentId: string; values: DeliveryConfirmFormValues }) => {
      const { error } = await supabase
        .from(HEADER_TABLE)
        .update({
          status: 'delivered' as ShipmentStatus,
          delivered_at: new Date().toISOString(),
          receiver_name: values.receiverName.trim(),
          receiver_phone: values.receiverPhone?.trim() || null,
          delivery_proof: values.deliveryProof.trim(),
          notes: values.notes?.trim() || null,
        })
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

/* ── Assign delivery staff ── */

export function useAssignDeliveryStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ shipmentId, staffId, vehicleInfo }: { shipmentId: string; staffId: string; vehicleInfo?: string }) => {
      const { error } = await supabase
        .from(HEADER_TABLE)
        .update({
          delivery_staff_id: staffId,
          vehicle_info: vehicleInfo?.trim() || null,
        })
        .eq('id', shipmentId)

      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

/* ── List delivery staff (role = driver) ── */

export function useDeliveryStaffList() {
  return useQuery({
    queryKey: ['delivery-staff'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .eq('role', 'driver')
        .eq('is_active', true)
        .order('full_name')

      if (error) throw error
      return (data ?? []) as DeliveryStaffSummary[]
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
