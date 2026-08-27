import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

import { useAuth } from '@/shared/hooks/useAuth';
import {
  type NotificationFsmState,
  NotificationFsm,
} from '@/features/notifications/domain/notification-fsm';
import { NotificationFacade } from '@/features/notifications/application/notification.facade';

export function useNotificationFacade() {
  const { user } = useAuth();
  const userId = user?.id;

  const [fsmState, setFsmState] = useState<NotificationFsmState>('CHECKING');
  const [isLoading, setIsLoading] = useState(false);

  const refreshState = useCallback(async () => {
    try {
      const state = await NotificationFacade.getDeviceState();
      setFsmState(state);
    } catch {
      setFsmState('UNKNOWN');
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    void NotificationFacade.getDeviceState().then((state) => {
      if (mounted) setFsmState(state);
    });
    return () => {
      mounted = false;
    };
  }, [userId]);

  const enablePush = useCallback(async (): Promise<boolean> => {
    if (!userId) {
      toast.error('Vui lòng đăng nhập để bật thông báo.');
      return false;
    }

    setIsLoading(true);
    setFsmState('REQUESTING');

    const result = await NotificationFacade.enableDevicePush(userId);
    setIsLoading(false);

    if (result.success) {
      toast.success('Đã kích hoạt thông báo đẩy trên thiết bị này thành công!');
      setFsmState('ACTIVE');
      return true;
    }

    const userMessage =
      result.error?.userMessage || 'Không thể bật thông báo trên thiết bị.';
    toast.error(userMessage);

    void refreshState();
    return false;
  }, [userId, refreshState]);

  const disablePush = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    const result = await NotificationFacade.disableDevicePush();
    setIsLoading(false);

    if (result.success) {
      toast.success('Đã tắt thông báo đẩy trên thiết bị này.');
      setFsmState('PERMISSION_REQUIRED');
      return true;
    }

    toast.error('Không thể tắt thông báo. Vui lòng thử lại.');
    void refreshState();
    return false;
  }, [refreshState]);

  return {
    fsmState,
    statusLabel: NotificationFsm.getStatusLabel(fsmState),
    statusVariant: NotificationFsm.getStatusVariant(fsmState),
    isLoading,
    isSubscribed: fsmState === 'ACTIVE',
    isSupported: fsmState !== 'UNSUPPORTED',
    enablePush,
    disablePush,
    refreshState,
  };
}
