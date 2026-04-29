import { useEffect, useRef, useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchUnreadCount } from '@/api/chat.api';
import { CHAT_LABELS, type ChatMessage } from '@/schema/chat.schema';
import { playNotificationSound } from '@/shared/lib/chat-sound';
import { supabase } from '@/services/supabase/client';

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

// ── Mark Room as Read ──

export function useMarkAsRead(roomId: string | undefined) {
  const queryClient = useQueryClient();

  return useCallback(() => {
    if (!roomId) return;
    // Optimistically set unread to 0
    queryClient.setQueryData(UNREAD_KEY(roomId), 0);
  }, [roomId, queryClient]);
}

// ── Global Chat Notifications Hook ──
// Listens to ALL chat_messages inserts for the current user's rooms.
// Shows toast + plays sound when a new message arrives and the chat is NOT open.

interface UseChatNotificationsOptions {
  /** Set of room IDs currently open in a drawer — skip notifications for these */
  openRoomIds?: Set<string>;
  /** Enable sound alerts (default: true) */
  soundEnabled?: boolean;
}

export function useChatNotifications(
  options: UseChatNotificationsOptions = {},
) {
  const { openRoomIds, soundEnabled = true } = options;
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const queryClient = useQueryClient();
  const [lastMessage, setLastMessage] = useState<ChatMessage | null>(null);

  useEffect(() => {
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

          // Skip if this room's drawer is currently open
          if (openRoomIds?.has(msg.room_id)) return;

          // Skip own messages (sender_id matches current user)
          const userId = supabase.auth.getUser().then((r) => r.data.user?.id);
          void userId.then((uid) => {
            if (msg.sender_id === uid) return;

            setLastMessage(msg);

            // Play sound
            if (soundEnabled) {
              playNotificationSound();
            }

            // Show toast
            toast(msg.content || CHAT_LABELS.NEW_IMAGE, {
              icon: '\u{1F4AC}',
              duration: 4000,
              position: 'top-right',
              style: {
                borderRadius: '10px',
                background: 'var(--surface-strong, #1a1a2e)',
                color: 'var(--text, #fff)',
                fontSize: '0.8125rem',
                maxWidth: '320px',
              },
            });

            // Invalidate unread count for this room
            void queryClient.invalidateQueries({
              queryKey: UNREAD_KEY(msg.room_id),
            });
          });
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [openRoomIds, soundEnabled, queryClient]);

  return { lastMessage };
}
