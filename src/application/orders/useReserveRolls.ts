import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchAvailableRolls,
  fetchReservedRollsForOrder,
  reserveRoll,
  unreserveRoll,
  releaseAllReserved,
} from '@/api/reserve-rolls.api';
import type { ReservedRoll } from '@/api/reserve-rolls.api';

export type { ReservedRoll };

/** Lấy các cuộn thành phẩm đang in_stock, khớp fabric_type + color_name */
export function useAvailableRolls(
  fabricType: string,
  colorName: string | null,
) {
  return useQuery({
    queryKey: ['reserve-rolls', 'available', fabricType, colorName],
    enabled: fabricType.length > 0,
    queryFn: () => fetchAvailableRolls(fabricType, colorName),
  });
}

/** Lấy các cuộn đã reserved cho 1 đơn hàng cụ thể */
export function useReservedRollsForOrder(orderId: string) {
  return useQuery({
    queryKey: ['reserve-rolls', 'order', orderId],
    enabled: !!orderId,
    queryFn: () => fetchReservedRollsForOrder(orderId),
  });
}

/** Reserve 1 cuộn cho đơn hàng */
export function useReserveRoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rollId, orderId }: { rollId: string; orderId: string }) =>
      reserveRoll(rollId, orderId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['reserve-rolls'] });
      void queryClient.invalidateQueries({ queryKey: ['finished-fabric'] });
    },
  });
}

/** Bỏ reserve 1 cuộn → trả về in_stock */
export function useUnreserveRoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unreserveRoll,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['reserve-rolls'] });
      void queryClient.invalidateQueries({ queryKey: ['finished-fabric'] });
    },
  });
}

/** Bỏ reserve TẤT CẢ cuộn của 1 đơn hàng (dùng khi huỷ đơn) */
export function useReleaseAllReserved() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: releaseAllReserved,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['reserve-rolls'] });
      void queryClient.invalidateQueries({ queryKey: ['finished-fabric'] });
    },
  });
}
