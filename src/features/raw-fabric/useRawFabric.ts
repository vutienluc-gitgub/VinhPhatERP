import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchRawFabricPaginated,
  createRawFabric,
  updateRawFabric,
  deleteRawFabric,
  createRawFabricBulk,
  fetchWeavingPartners,
  fetchYarnReceiptOptions,
  fetchWorkOrderOptions,
  fetchRawFabricStats,
} from '@/api/raw-fabric.api'
import type { SupplierOption, YarnReceiptOption, WorkOrderOption, InventoryStats } from '@/api/raw-fabric.api'
import type { BulkInputFormValues } from './raw-fabric.module'
import { findDuplicateRollNumbers, generateBarcode } from './raw-fabric.module'
import type { RawFabricFormValues } from './raw-fabric.module'
import type { RawFabricFilter, RawFabricRoll } from './types'

export type { SupplierOption, YarnReceiptOption, WorkOrderOption }

const QUERY_KEY = ['raw-fabric'] as const

function toDbRow(values: RawFabricFormValues): Omit<RawFabricRoll, 'id' | 'created_at' | 'updated_at'> {
  return {
    roll_number: values.roll_number,
    fabric_type: values.fabric_type,
    yarn_receipt_id: values.yarn_receipt_id?.trim() || null,
    weaving_partner_id: values.weaving_partner_id?.trim() || null,
    color_name: values.color_name?.trim() || null,
    color_code: values.color_code?.trim() || null,
    width_cm: values.width_cm ?? null,
    length_m: values.length_m ?? null,
    weight_kg: values.weight_kg ?? null,
    quality_grade: values.quality_grade ?? null,
    status: values.status,
    warehouse_location: values.warehouse_location?.trim() || null,
    production_date: values.production_date?.trim() || null,
    notes: values.notes?.trim() || null,
    lot_number: values.lot_number?.trim() || null,
    barcode: generateBarcode(values.roll_number),
    work_order_id: values.work_order_id?.trim() || null,
  }
}

export function useRawFabricList(filters: RawFabricFilter = {}, page = 1) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters, page],
    queryFn: () => fetchRawFabricPaginated(filters, page),
  })
}

export function useCreateRawFabric() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: RawFabricFormValues) => createRawFabric(toDbRow(values)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useUpdateRawFabric() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: RawFabricFormValues }) =>
      updateRawFabric(id, toDbRow(values)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useDeleteRawFabric() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteRawFabric,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

/** Nhập hàng loạt cuộn vải mộc */
export function useCreateRawFabricBulk() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: BulkInputFormValues) => {
      const duplicateRollNumbers = findDuplicateRollNumbers(values.rolls)
      if (duplicateRollNumbers.length > 0) {
        throw new Error(`Mã cuộn bị trùng trong lô nhập: ${duplicateRollNumbers.join(', ')}`)
      }

      const rows = values.rolls.map((row) => ({
        roll_number: row.roll_number.trim(),
        fabric_type: values.fabric_type,
        yarn_receipt_id: values.yarn_receipt_id?.trim() || null,
        weaving_partner_id: values.weaving_partner_id?.trim() || null,
        color_name: values.color_name?.trim() || null,
        color_code: values.color_code?.trim() || null,
        width_cm: values.width_cm ?? null,
        length_m: row.length_m ?? null,
        weight_kg: row.weight_kg ?? null,
        quality_grade: row.quality_grade ?? values.quality_grade ?? null,
        status: values.status,
        warehouse_location: values.warehouse_location?.trim() || null,
        production_date: values.production_date?.trim() || null,
        notes: row.notes?.trim() || null,
        lot_number: values.lot_number?.trim() || null,
        barcode: generateBarcode(row.roll_number.trim()),
        work_order_id: values.work_order_id?.trim() || null,
      }))

      return createRawFabricBulk(rows)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useWeavingPartners() {
  return useQuery({
    queryKey: ['suppliers', 'weaving'],
    queryFn: fetchWeavingPartners,
  })
}

export function useYarnReceiptOptions() {
  return useQuery({
    queryKey: ['yarn-receipts', 'options'],
    queryFn: fetchYarnReceiptOptions,
  })
}

export function useWorkOrderOptions() {
  return useQuery({
    queryKey: ['work-orders', 'options'],
    queryFn: fetchWorkOrderOptions,
  })
}

export type { InventoryStats }

export function useRawFabricStats() {
  return useQuery<InventoryStats>({
    queryKey: [...QUERY_KEY, 'stats'],
    queryFn: fetchRawFabricStats,
  })
}
