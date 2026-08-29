import { useEffect, useRef, useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchUnreadCount, updateReadReceipt } from '@/api/chat.api';
import type { ChatMessage } from '@/schema/chat.schema';
import { playNotificationSound } from '@/shared/lib/chat-sound';
import { supabase } from '@/services/supabase/client';
import { useAuth } from '@/shared/hooks/useAuth';
import {
  evaluateNotificationPolicy,
  registerActiveView,
  unregisterActiveView,
} from '@/features/notifications';

import { showChatToast } from './ChatToast';
import { useChatRoom } from './useChat';

// ── Unread Count Hook ──

const UNREAD_KEY = (roomId: string) => ['chat-unread', roomId] as const;

export function useUnreadCount(roomId: string | undefined) {
  return useQuery({
    queryKey: UNREAD_KEY(roomId ?? ''),
    enabled: !!roomId,
    queryFn: () => fetchUnreadCount(roomId!),
    refetchInterval: 30_000, // Poll every 30s as fallback
    staleTime: 10_000,
  });
}

// ── Portal Unread Hook (by entity ID) ──

export function usePortalChatUnread(
  entityId: string | undefined,
  entityType = 'customer',
): number {
  const { data: room } = useChatRoom(entityType, entityId);
  const { data: unread = 0 } = useUnreadCount(room?.id);

  return unread;
}

// ── Mark Room as Read ──

export function useMarkAsRead(roomId: string | undefined) {
  const queryClient = useQueryClient();

  return useCallback(() => {
    if (!roomId) return;
    // Optimistically set unread to 0
    queryClient.setQueryData(UNREAD_KEY(roomId), 0);
    void queryClient.invalidateQueries({ queryKey: ['chat-total-unread'] });
    // Update read receipt in DB
    void updateReadReceipt(roomId).catch((err) => {
      console.error('[Chat] Failed to update read receipt:', err);
    });
  }, [roomId, queryClient]);
}

// ── Room Registration Adapters (delegated to ActiveViewRegistry) ──

export function registerOpenRoom(roomId: string) {
  registerActiveView('chat_room', roomId);
}

export function unregisterOpenRoom(roomId: string) {
  unregisterActiveView('chat_room', roomId);
}

interface UseChatNotificationsOptions {
  /** Optional set of room IDs currently open in a drawer — skip notifications for these */
  openRoomIds?: Set<string>;
  /** Enable sound alerts (default: true) */
  soundEnabled?: boolean;
}

/**
 * useChatNotifications: Thin Application Layer hook that observes incoming Realtime chat messages
 * and dispatches notifications through the NotificationPolicy Engine.
 */
export function useChatNotifications(
  options: UseChatNotificationsOptions = {},
) {
  const { openRoomIds, soundEnabled = true } = options;
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [lastMessage, setLastMessage] = useState<ChatMessage | null>(null);

  useEffect(() => {
    // If specific openRoomIds provided in options, register them
    if (openRoomIds) {
      for (const rId of openRoomIds) {
        registerActiveView('chat_room', rId);
      }
    }

    const channel = supabase
      .channel('global-chat-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          const msg = payload.new as ChatMessage;

          // Skip system messages
          if (msg.message_type === 'system') return;

          // Evaluate Notification Policy
          const decision = evaluateNotificationPolicy(
            {
              domain: 'chat',
              entityType: 'chat_room',
              entityId: msg.room_id,
              senderId: msg.sender_id,
            },
            {
              currentUserId: user?.id ?? '',
              preferences: {
                soundEnabled,
                inAppEnabled: true,
              },
            },
          );

          if (
            !decision.shouldDeliverInApp &&
            !decision.shouldPlaySound &&
            !decision.shouldUpdateBadge
          ) {
            return;
          }

          setLastMessage(msg);

          // 1. Audio chime
          if (decision.shouldPlaySound) {
            playNotificationSound();
          }

          // 2. In-App Toast
          if (decision.shouldDeliverInApp) {
            void showChatToast(msg);
          }

          // 3. Server-authoritative badge / unread counter invalidation
          if (decision.shouldUpdateBadge) {
            void queryClient.invalidateQueries({
              queryKey: UNREAD_KEY(msg.room_id),
            });
            void queryClient.invalidateQueries({
              queryKey: ['chat-rooms'],
            });
            void queryClient.invalidateQueries({
              queryKey: ['chat-total-unread'],
            });
            void queryClient.invalidateQueries({
              queryKey: ['chat-messages', msg.room_id],
            });
          }
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (openRoomIds) {
        for (const rId of openRoomIds) {
          unregisterActiveView('chat_room', rId);
        }
      }
    };
  }, [openRoomIds, soundEnabled, queryClient, user?.id]);

  return { lastMessage };
}
