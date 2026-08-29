import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import {
  transitionDeliveryAttempt,
  type TransitionAttemptParams,
} from '@/features/driver-portal/api/delivery-execution.api';
import { enqueueOfflineCommand } from '@/features/driver-portal/services/offline-command-queue';

export function useDeliveryExecution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: TransitionAttemptParams) => {
      // If client is offline, enqueue to local IndexedDB
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const cmdId = params.commandId ?? crypto.randomUUID();
        await enqueueOfflineCommand({
          commandId: cmdId,
          aggregateId: params.attemptId,
          commandName: 'transition_delivery_attempt',
          payload: { ...params, commandId: cmdId },
        });
        return {
          ok: true,
          attempt_id: params.attemptId,
          stop_id: '',
          previous_state: params.expectedState,
          current_state: params.targetState,
          updated_at: new Date().toISOString(),
          isOffline: true,
        };
      }

      const res = await transitionDeliveryAttempt(params);
      return { ...res, isOffline: false };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['driver-shipments'] });
      queryClient.invalidateQueries({ queryKey: ['delivery-stops'] });
      queryClient.invalidateQueries({ queryKey: ['journey-logs'] });

      if (data?.isOffline) {
        toast.success('Đã lưu trạng thái ngoại tuyến. Sẽ đồng bộ khi có mạng!');
      } else {
        toast.success('Cập nhật trạng thái thành công!');
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Có lỗi khi cập nhật trạng thái',
      );
    },
  });
}
