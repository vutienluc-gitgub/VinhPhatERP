import { useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { supabase } from '@/services/supabase/client';
import { useAuth } from '@/features/auth/AuthProvider';
import { NotificationRepository } from '@/domains/notification/repositories/notification-repository';
import type { AppNotification } from '@/domains/notification/models/types';

export interface UseNotificationsResult {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refetch: () => Promise<unknown>;
}

export function useNotifications(limit = 20): UseNotificationsResult {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  // 1. Fetch user notifications feed
  const {
    data: notifications = [],
    isLoading: isLoadingList,
    refetch,
  } = useQuery({
    queryKey: ['app-notifications', userId, limit],
    queryFn: async () => {
      if (!userId) return [];
      return NotificationRepository.fetchUserNotifications(userId, limit);
    },
    enabled: Boolean(userId),
    staleTime: 30_000,
  });

  // 2. Fetch unread count (single source of truth)
  const { data: unreadCount = 0, isLoading: isLoadingCount } = useQuery({
    queryKey: ['app-notifications-unread-count', userId],
    queryFn: async () => {
      if (!userId) return 0;
      return NotificationRepository.fetchUnreadCount(userId);
    },
    enabled: Boolean(userId),
    staleTime: 30_000,
  });

  // 3. Setup Supabase Realtime channel
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`user_notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // Invalidate both notifications list and unread count
          queryClient.invalidateQueries({
            queryKey: ['app-notifications', userId],
          });
          queryClient.invalidateQueries({
            queryKey: ['app-notifications-unread-count', userId],
          });

          // Show in-app toast for new incoming notification
          if (payload.eventType === 'INSERT') {
            const newNotif = payload.new as AppNotification;
            toast.success(newNotif.title || 'Thông báo mới', {
              duration: 4000,
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  // 4. Mark single notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await NotificationRepository.markAsRead(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['app-notifications', userId],
      });
      queryClient.invalidateQueries({
        queryKey: ['app-notifications-unread-count', userId],
      });
    },
  });

  // 5. Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await NotificationRepository.markAllAsRead(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['app-notifications', userId],
      });
      queryClient.invalidateQueries({
        queryKey: ['app-notifications-unread-count', userId],
      });
    },
  });

  const markAsRead = useMemo(
    () => async (notificationId: string) => {
      await markAsReadMutation.mutateAsync(notificationId);
    },
    [markAsReadMutation],
  );

  const markAllAsRead = useMemo(
    () => async () => {
      await markAllAsReadMutation.mutateAsync();
    },
    [markAllAsReadMutation],
  );

  return {
    notifications,
    unreadCount,
    isLoading: isLoadingList || isLoadingCount,
    markAsRead,
    markAllAsRead,
    refetch,
  };
}
