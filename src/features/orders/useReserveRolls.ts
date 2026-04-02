import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/services/supabase/client'
import type { FinishedFabricRoll } from '@/features/finished-fabric/types'

const FINISHED_TABLE = 'finished_fabric_rolls'

type AvailableRollRow = Pick<
  FinishedFabricRoll,
  'id' | 'roll_number' | 'fabric_type' | 'color_name' | 'length_m' | 'weight_kg' | 'quality_grade' | 'warehouse_location'
>

/** Cuộn đang được giữ cho 1 đơn (bao gồm thông tin roll) */
export type ReservedRoll = AvailableRollRow & { status: string }

/** Lấy các cuộn thành phẩm đang in_stock, khớp fabric_type + color_name */
export function useAvailableRolls(fabricType: string, colorName: string | null) {
  return useQuery({
    queryKey: ['reserve-rolls', 'available', fabricType, colorName],
    enabled: fabricType.length > 0,
    queryFn: async () => {
      let query = supabase
        .from(FINISHED_TABLE)
        .select('id, roll_number, fabric_type, color_name, length_m, weight_kg, quality_grade, warehouse_location')
        .eq('status', 'in_stock')
        .ilike('fabric_type', fabricType)
        .order('roll_number')
        .limit(200)

      if (colorName) {
        query = query.ilike('color_name', colorName)
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as AvailableRollRow[]
    },
  })
}

/** Lấy các cuộn đã reserved cho 1 đơn hàng cụ thể */
export function useReservedRollsForOrder(orderId: string) {
  return useQuery({
    queryKey: ['reserve-rolls', 'order', orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(FINISHED_TABLE)
        .select('id, roll_number, fabric_type, color_name, length_m, weight_kg, quality_grade, warehouse_location, status')
        .eq('reserved_for_order_id', orderId)
        .eq('status', 'reserved')
        .order('roll_number')

      if (error) throw error
      return (data ?? []) as ReservedRoll[]
    },
  })
}

/** Reserve 1 cuộn cho đơn hàng */
export function useReserveRoll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ rollId, orderId }: { rollId: string; orderId: string }) => {
      const { error } = await supabase
        .from(FINISHED_TABLE)
        .update({ status: 'reserved', reserved_for_order_id: orderId })
        .eq('id', rollId)
        .eq('status', 'in_stock')

      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['reserve-rolls'] })
      void queryClient.invalidateQueries({ queryKey: ['finished-fabric'] })
    },
  })
}

/** Bỏ reserve 1 cuộn → trả về in_stock */
export function useUnreserveRoll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (rollId: string) => {
      const { error } = await supabase
        .from(FINISHED_TABLE)
        .update({ status: 'in_stock', reserved_for_order_id: null })
        .eq('id', rollId)
        .eq('status', 'reserved')

      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['reserve-rolls'] })
      void queryClient.invalidateQueries({ queryKey: ['finished-fabric'] })
    },
  })
}

/** Bỏ reserve TẤT CẢ cuộn của 1 đơn hàng (dùng khi huỷ đơn) */
export function useReleaseAllReserved() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from(FINISHED_TABLE)
        .update({ status: 'in_stock', reserved_for_order_id: null })
        .eq('reserved_for_order_id', orderId)
        .eq('status', 'reserved')

      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['reserve-rolls'] })
      void queryClient.invalidateQueries({ queryKey: ['finished-fabric'] })
    },
  })
}
