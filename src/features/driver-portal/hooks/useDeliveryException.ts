import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import {
  reportDeliveryException,
  type ReportExceptionParams,
} from '@/features/driver-portal/api/delivery-execution.api';
import { enqueueOfflineCommand } from '@/features/driver-portal/services/offline-command-queue';

export function useDeliveryException() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: ReportExceptionParams) => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const cmdId = params.commandId ?? crypto.randomUUID();
        await enqueueOfflineCommand({
          commandId: cmdId,
          aggregateId: params.attemptId,
          commandName: 'report_delivery_exception',
          payload: { ...params, commandId: cmdId },
        });

        return {
          ok: true,
          attempt_id: params.attemptId,
          exception_id: 'offline-pending',
          exception_type: params.exceptionType,
          status: 'failed_attempt',
          reported_at: new Date().toISOString(),
          isOffline: true,
        };
      }

      const res = await reportDeliveryException(params);
      return { ...res, isOffline: false };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['driver-shipments'] });
      queryClient.invalidateQueries({ queryKey: ['delivery-stops'] });
      queryClient.invalidateQueries({ queryKey: ['journey-logs'] });

      if (data?.isOffline) {
        toast.success('Đã ghi nhận sự cố giao hàng ngoại tuyến.');
      } else {
        toast.success('Đã báo cáo sự cố giao hàng tới điều phối!');
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Có lỗi khi báo cáo sự cố',
      );
    },
  });
}
