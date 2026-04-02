import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/services/supabase/client'
import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination'
import type { PaginatedResult } from '@/shared/types/pagination'

import type { BulkInputFormValues } from './raw-fabric.module'
import { findDuplicateRollNumbers, generateBarcode } from './raw-fabric.module'
import type { RawFabricFormValues } from './raw-fabric.module'
import type { RawFabricFilter, RawFabricRoll } from './types'

export type SupplierOption = { id: string; code: string; name: string }
export type YarnReceiptOption = { id: string; receipt_number: string; receipt_date: string }

const TABLE = 'raw_fabric_rolls'
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
  }
}

export function useRawFabricList(filters: RawFabricFilter = {}, page = 1) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters, page],
    queryFn: async (): Promise<PaginatedResult<RawFabricRoll>> => {
      const from = (page - 1) * DEFAULT_PAGE_SIZE
      const to = from + DEFAULT_PAGE_SIZE - 1

      let query = supabase
        .from(TABLE)
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.quality_grade) {
        query = query.eq('quality_grade', filters.quality_grade)
      }
      if (filters.fabric_type) {
        query = query.ilike('fabric_type', `%${filters.fabric_type}%`)
      }

      const { data, error, count } = await query
      if (error) throw error
      const total = count ?? 0
      return {
        data: (data ?? []) as RawFabricRoll[],
        total,
        page,
        pageSize: DEFAULT_PAGE_SIZE,
        totalPages: Math.ceil(total / DEFAULT_PAGE_SIZE),
      }
    },
  })
}

export function useCreateRawFabric() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: RawFabricFormValues) => {
      const { data, error } = await supabase
        .from(TABLE)
        .insert([toDbRow(values)])
        .select()
        .single()
      if (error) throw error
      return data as RawFabricRoll
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useUpdateRawFabric() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: RawFabricFormValues }) => {
      const { data, error } = await supabase
        .from(TABLE)
        .update(toDbRow(values))
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as RawFabricRoll
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useDeleteRawFabric() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(TABLE).delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

/** Nhập hàng loạt cuộn vải mộc — gộp thông tin chung + danh sách cuộn thành rows rồi insert batch */
export function useCreateRawFabricBulk() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: BulkInputFormValues) => {
      const duplicateRollNumbers = findDuplicateRollNumbers(values.rolls)
      if (duplicateRollNumbers.length > 0) {
        throw new Error(`Mã cuộn bị trùng trong lô nhập: ${duplicateRollNumbers.join(', ')}`)
      }

      const normalizedRollNumbers = values.rolls.map((row) => row.roll_number.trim())
      const { data: existingRolls, error: existingRollsError } = await supabase
        .from(TABLE)
        .select('roll_number')
        .in('roll_number', normalizedRollNumbers)

      if (existingRollsError) {
        throw existingRollsError
      }

      if ((existingRolls ?? []).length > 0) {
        const takenRollNumbers = existingRolls
          .map((row) => row.roll_number)
          .sort((left, right) => left.localeCompare(right))
        throw new Error(`Mã cuộn đã tồn tại: ${takenRollNumbers.join(', ')}`)
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
      }))

      const { data, error } = await supabase
        .from(TABLE)
        .insert(rows)
        .select()
      if (error) throw error
      return (data ?? []) as RawFabricRoll[]
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

/** Lấy danh sách nhà dệt (category = 'weaving') để hiển thị trong form */
export function useWeavingPartners() {
  return useQuery({
    queryKey: ['suppliers', 'weaving'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, code, name')
        .eq('category', 'weaving')
        .eq('status', 'active')
        .order('name')
      if (error) throw error
      return (data ?? []) as SupplierOption[]
    },
  })
}

/** Lấy danh sách phiếu nhập sợi để liên kết cuộn vải mộc */
export function useYarnReceiptOptions() {
  return useQuery({
    queryKey: ['yarn-receipts', 'options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('yarn_receipts')
        .select('id, receipt_number, receipt_date')
        .eq('status', 'confirmed')
        .order('receipt_date', { ascending: false })
        .limit(200)
      if (error) throw error
      return (data ?? []) as YarnReceiptOption[]
    },
  })
}

export type InventoryStats = {
  totalRolls: number
  totalLengthM: number
  totalWeightKg: number
}

/** Thống kê nhanh tồn kho vải mộc từ view v_raw_fabric_inventory */
export function useRawFabricStats() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'stats'],
    queryFn: async (): Promise<InventoryStats> => {
      const { data, error } = await supabase
        .from('v_raw_fabric_inventory')
        .select('roll_count, total_length_m, total_weight_kg')
      if (error) throw error
      const rows = data ?? []
      return {
        totalRolls: rows.reduce((s, r) => s + (r.roll_count ?? 0), 0),
        totalLengthM: rows.reduce((s, r) => s + (r.total_length_m ?? 0), 0),
        totalWeightKg: rows.reduce((s, r) => s + (r.total_weight_kg ?? 0), 0),
      }
    },
  })
}
