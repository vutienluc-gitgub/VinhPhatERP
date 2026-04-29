/**
 * React Query hooks cho Yarn Reservation System.
 */
import type { PostgrestError } from '@supabase/supabase-js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  fetchYarnAvailability,
  reserveYarn,
  releaseYarnReservation,
  consumeYarnReservation,
} from '@/api/yarn-reservation.api';
import type {
  YarnAvailability,
  ReserveYarnItem,
  ReserveYarnResult,
} from '@/api/yarn-reservation.api';

export type { YarnAvailability, ReserveYarnResult };

const QUERY_KEY = 'yarn_availability';

/**
 * Hook: Lấy toàn bộ danh sách tồn kho sợi (available = stock - reserved).
 */
export function useYarnAvailability() {
  return useQuery<YarnAvailability[]>({
    queryKey: [QUERY_KEY],
    queryFn: fetchYarnAvailability,
    staleTime: 1000 * 30, // 30s — inventory thay đổi thường xuyên
  });
}

/**
 * Hook: Reserve sợi cho Work Order.
 */
export function useReserveYarn() {
  const queryClient = useQueryClient();
  return useMutation<
    ReserveYarnResult,
    PostgrestError,
    { workOrderId: string; items: ReserveYarnItem[] }
  >({
    mutationFn: ({ workOrderId, items }) => reserveYarn(workOrderId, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['work_orders'] });
    },
  });
}

/**
 * Hook: Giải phóng reservation (khi hủy WO).
 */
export function useReleaseYarnReservation() {
  const queryClient = useQueryClient();
  return useMutation<void, PostgrestError, string>({
    mutationFn: releaseYarnReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['work_orders'] });
    },
  });
}

/**
 * Hook: Consume reservation (khi WO hoàn thành).
 */
export function useConsumeYarnReservation() {
  const queryClient = useQueryClient();
  return useMutation<void, PostgrestError, string>({
    mutationFn: consumeYarnReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['work_orders'] });
    },
  });
}
