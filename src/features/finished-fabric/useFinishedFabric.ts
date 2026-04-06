import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchFinishedFabricPaginated,
  createFinishedFabric,
  updateFinishedFabric,
  deleteFinishedFabric,
  fetchRawRollOptions,
  fetchRawRollsByLot,
  createFinishedFabricBulk,
  fetchFinishedFabricStats,
  fetchTraceChain,
} from '@/api/finished-fabric.api'
import type { InventoryStats } from '@/api/finished-fabric.api'
import type { FinishedFabricFormValues, BulkFinishedInputFormValues } from './finished-fabric.module'
import { findDuplicateRollNumbers } from './finished-fabric.module'
import type { FinishedFabricFilter, FinishedFabricRoll, RawRollOption } from './types'

export type { InventoryStats }

const QUERY_KEY = ['finished-fabric'] as const

function toDbRow(
  values: FinishedFabricFormValues,
): Omit<FinishedFabricRoll, 'id' | 'created_at' | 'updated_at' | 'lot_number'> {
  return {
    roll_number: values.roll_number,
    raw_roll_id: values.raw_roll_id,
    fabric_type: values.fabric_type,
    color_name: values.color_name?.trim() || null,
    color_code: values.color_code?.trim() || null,
    width_cm: values.width_cm ?? null,
    length_m: values.length_m ?? null,
    weight_kg: values.weight_kg ?? null,
    quality_grade: values.quality_grade ?? null,
    status: values.status,
    warehouse_location: values.warehouse_location?.trim() || null,
    production_date: values.production_date?.trim() || null,
    reserved_for_order_id: values.reserved_for_order_id ?? null,
    notes: values.notes?.trim() || null,
  }
}

export function useFinishedFabricList(filters: FinishedFabricFilter = {}, page = 1) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters, page],
    queryFn: () => fetchFinishedFabricPaginated(filters, page),
  })
}

export function useCreateFinishedFabric() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: FinishedFabricFormValues) => createFinishedFabric(toDbRow(values)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useUpdateFinishedFabric() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: FinishedFabricFormValues }) =>
      updateFinishedFabric(id, toDbRow(values)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useDeleteFinishedFabric() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteFinishedFabric,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useRawRollOptions() {
  return useQuery<RawRollOption[]>({
    queryKey: ['raw-fabric', 'options'],
    queryFn: fetchRawRollOptions,
  })
}

export function useRawRollsByLot(lotNumber: string) {
  return useQuery<RawRollOption[]>({
    queryKey: ['raw-fabric', 'by-lot', lotNumber],
    enabled: lotNumber.trim().length > 0,
    queryFn: () => fetchRawRollsByLot(lotNumber),
  })
}

export function useCreateFinishedFabricBulk() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: BulkFinishedInputFormValues) => {
      const duplicates = findDuplicateRollNumbers(values.rolls)
      if (duplicates.length > 0) {
        throw new Error(`Mã cuộn bị trùng trong lô nhập: ${duplicates.join(', ')}`)
      }

      const rows = values.rolls.map((row) => ({
        roll_number: row.roll_number.trim(),
        raw_roll_id: row.raw_roll_id,
        fabric_type: values.fabric_type,
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
        reserved_for_order_id: null,
      }))

      return createFinishedFabricBulk(rows, values.lot_number)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useFinishedFabricStats() {
  return useQuery<InventoryStats>({
    queryKey: [...QUERY_KEY, 'stats'],
    queryFn: fetchFinishedFabricStats,
  })
}

/* ── Trace chain (re-export from API types) ── */
export type { TraceChainData, TraceRawRoll, TraceYarnReceipt } from '@/api/finished-fabric.api'

export function useTraceChain(rawRollId: string | null) {
  return useQuery({
    queryKey: ['trace-chain', rawRollId],
    enabled: !!rawRollId,
    queryFn: () => fetchTraceChain(rawRollId!),
  })
}
