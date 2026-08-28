import { useEffect, useRef, useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchUnreadCount, updateReadReceipt } from '@/api/chat.api';
import type { ChatMessage } from '@/schema/chat.schema';
import { playNotificationSound } from '@/shared/lib/chat-sound';
import { supabase } from '@/services/supabase/client';
import { useAuth } from '@/shared/hooks/useAuth';

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

// ── Global Chat Notifications Hook ──
// Listens to ALL chat_messages inserts for the current user's rooms.
// Shows toast + plays sound when a new message arrives and the chat is NOT open.

export const globalOpenRooms = new Set<string>();

export function registerOpenRoom(roomId: string) {
  globalOpenRooms.add(roomId);
}

export function unregisterOpenRoom(roomId: string) {
  globalOpenRooms.delete(roomId);
}

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
  const { user } = useAuth();
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
          if (openRoomIds?.has(msg.room_id) || globalOpenRooms.has(msg.room_id))
            return;

          // Skip own messages (sender_id matches current user)
          const currentUserId = user?.id;
          if (currentUserId && msg.sender_id === currentUserId) return;

          setLastMessage(msg);

          // Play sound
          if (soundEnabled) {
            playNotificationSound();
          }

          // Show rich grouped toast
          void showChatToast(msg);

          // Invalidate unread count and rooms
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
  }, [openRoomIds, soundEnabled, queryClient, user?.id]);

  return { lastMessage };
}
