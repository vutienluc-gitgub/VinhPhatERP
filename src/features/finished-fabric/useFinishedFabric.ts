import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/services/supabase/client'
import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination'
import type { PaginatedResult } from '@/shared/types/pagination'

import type { FinishedFabricFormValues } from './finished-fabric.module'
import type { BulkFinishedInputFormValues } from './finished-fabric.module'
import { findDuplicateRollNumbers } from './finished-fabric.module'
import type { FinishedFabricFilter, FinishedFabricRoll, RawRollOption } from './types'

const TABLE = 'finished_fabric_rolls'
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
    notes: values.notes?.trim() || null,
  }
}

export function useFinishedFabricList(filters: FinishedFabricFilter = {}, page = 1) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters, page],
    queryFn: async (): Promise<PaginatedResult<FinishedFabricRoll>> => {
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
        data: (data ?? []) as FinishedFabricRoll[],
        total,
        page,
        pageSize: DEFAULT_PAGE_SIZE,
        totalPages: Math.ceil(total / DEFAULT_PAGE_SIZE),
      }
    },
  })
}

export function useCreateFinishedFabric() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: FinishedFabricFormValues) => {
      const { data, error } = await supabase
        .from(TABLE)
        .insert([toDbRow(values)])
        .select()
        .single()
      if (error) throw error
      return data as FinishedFabricRoll
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useUpdateFinishedFabric() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: FinishedFabricFormValues }) => {
      const { data, error } = await supabase
        .from(TABLE)
        .update(toDbRow(values))
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as FinishedFabricRoll
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useDeleteFinishedFabric() {
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

/** Lấy danh sách cuộn vải mộc đang trong kho để chọn làm nguồn cho thành phẩm */
export function useRawRollOptions() {
  return useQuery({
    queryKey: ['raw-fabric', 'options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('raw_fabric_rolls')
        .select('id, roll_number, fabric_type, color_name, lot_number')
        .eq('status', 'in_stock')
        .order('roll_number')
        .limit(500)
      if (error) throw error
      return (data ?? []) as RawRollOption[]
    },
  })
}

/** Lấy danh sách cuộn mộc theo lot_number cụ thể */
export function useRawRollsByLot(lotNumber: string) {
  return useQuery({
    queryKey: ['raw-fabric', 'by-lot', lotNumber],
    enabled: lotNumber.trim().length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('raw_fabric_rolls')
        .select('id, roll_number, fabric_type, color_name, lot_number')
        .eq('lot_number', lotNumber.trim())
        .eq('status', 'in_stock')
        .order('roll_number')
        .limit(500)
      if (error) throw error
      return (data ?? []) as RawRollOption[]
    },
  })
}

/** Nhập hàng loạt cuộn thành phẩm — validate lot_number khớp raw roll rồi insert batch */
export function useCreateFinishedFabricBulk() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: BulkFinishedInputFormValues) => {
      // 1. Check duplicate roll numbers trong lô nhập
      const duplicates = findDuplicateRollNumbers(values.rolls)
      if (duplicates.length > 0) {
        throw new Error(`Mã cuộn bị trùng trong lô nhập: ${duplicates.join(', ')}`)
      }

      // 2. Check duplicate roll numbers trong DB
      const normalizedRollNumbers = values.rolls.map((r) => r.roll_number.trim())
      const { data: existingRolls, error: existErr } = await supabase
        .from(TABLE)
        .select('roll_number')
        .in('roll_number', normalizedRollNumbers)
      if (existErr) throw existErr
      if ((existingRolls ?? []).length > 0) {
        const taken = existingRolls.map((r) => r.roll_number).sort()
        throw new Error(`Mã cuộn đã tồn tại: ${taken.join(', ')}`)
      }

      // 3. Validate tất cả raw_roll_id thuộc đúng lot_number
      const rawRollIds = [...new Set(values.rolls.map((r) => r.raw_roll_id))]
      const { data: rawRolls, error: rawErr } = await supabase
        .from('raw_fabric_rolls')
        .select('id, roll_number, lot_number')
        .in('id', rawRollIds)
      if (rawErr) throw rawErr

      const rawMap = new Map((rawRolls ?? []).map((r) => [r.id, r]))
      const mismatches: string[] = []
      for (const row of values.rolls) {
        const raw = rawMap.get(row.raw_roll_id)
        if (!raw) {
          mismatches.push(`Cuộn mộc ${row.raw_roll_id} không tồn tại`)
        } else if (raw.lot_number !== values.lot_number.trim()) {
          mismatches.push(
            `Cuộn mộc ${raw.roll_number} thuộc lô "${raw.lot_number ?? '(trống)'}" — không khớp lô "${values.lot_number}"`,
          )
        }
      }
      if (mismatches.length > 0) {
        throw new Error(`Lỗi đối chiếu lô:\n${mismatches.join('\n')}`)
      }

      // 4. Build rows & insert
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
        // lot_number is auto-synced by DB trigger from raw_roll_id
      }))

      const { data, error } = await supabase
        .from(TABLE)
        .insert(rows)
        .select()
      if (error) throw error
      return (data ?? []) as FinishedFabricRoll[]
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
