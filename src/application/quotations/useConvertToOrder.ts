import { useMutation, useQueryClient } from '@tanstack/react-query';

import { convertQuotationToOrder } from '@/api/quotations.api';

/**
 * Hook chuyển đổi Báo giá đã duyệt → Đơn hàng (draft).
 */
export function useConvertToOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: convertQuotationToOrder,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['quotations'] });
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
