import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/services/supabase/client'
import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination'
import type { PaginatedResult } from '@/shared/types/pagination'

import type { FinishedFabricFormValues } from './finished-fabric.module'
import type { FinishedFabricFilter, FinishedFabricRoll, RawRollOption } from './types'

const TABLE = 'finished_fabric_rolls'
const QUERY_KEY = ['finished-fabric'] as const

function toDbRow(
  values: FinishedFabricFormValues,
): Omit<FinishedFabricRoll, 'id' | 'created_at' | 'updated_at'> {
  return {
    roll_number: values.roll_number,
    raw_roll_id: values.raw_roll_id?.trim() || null,
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
        .select('id, roll_number, fabric_type, color_name')
        .eq('status', 'in_stock')
        .order('roll_number')
        .limit(500)
      if (error) throw error
      return (data ?? []) as RawRollOption[]
    },
  })
}
