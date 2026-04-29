import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  fetchChatMessages,
  fetchChatRoomByEntity,
  getOrCreateChatRoom,
  sendChatMessage,
  softDeleteMessage,
  updateReadReceipt,
} from '@/api/chat.api';
import type {
  ChatMessage,
  ChatRoom,
  OptimisticChatMessage,
} from '@/schema/chat.schema';
import {
  broadcastNewMessage,
  broadcastConnectionStatus,
  onBroadcastMessage,
} from '@/shared/lib/chat-broadcast';
import {
  enqueueMessage,
  getQueuedMessages,
  dequeueMessage,
} from '@/shared/lib/chat-offline-queue';
import { supabase } from '@/services/supabase/client';

// ── Query Keys ──

const CHAT_KEYS = {
  rooms: ['chat-rooms'] as const,
  room: (entityType: string, entityId: string) =>
    ['chat-rooms', entityType, entityId] as const,
  messages: (roomId: string) => ['chat-messages', roomId] as const,
};

// ── Connection Status Type ──

export type ChatConnectionStatus =
  | 'connected'
  | 'disconnected'
  | 'reconnecting';

// ── Helpers ──

type InfiniteData = { pages: ChatMessage[][]; pageParams: unknown[] };

function appendMessage(old: unknown, newMsg: ChatMessage): unknown {
  const data = old as InfiniteData | undefined;
  if (!data) return data;

  const allMessages = data.pages.flat();
  const exists = allMessages.some(
    (m) => m.id === newMsg.id || m.client_id === newMsg.client_id,
  );
  if (exists) return data;

  return {
    ...data,
    pages: [[newMsg, ...(data.pages[0] ?? [])], ...data.pages.slice(1)],
  };
}

// ── Room Hooks ──

export function useChatRoom(entityType: string, entityId: string | undefined) {
  return useQuery<ChatRoom | null>({
    queryKey: CHAT_KEYS.room(entityType, entityId ?? ''),
    enabled: !!entityId,
    queryFn: () => fetchChatRoomByEntity(entityType, entityId!),
  });
}

export function useGetOrCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
    }: {
      entityType: string;
      entityId: string;
    }) => getOrCreateChatRoom(entityType, entityId),
    onSuccess: (_roomId, { entityType, entityId }) => {
      void queryClient.invalidateQueries({
        queryKey: CHAT_KEYS.room(entityType, entityId),
      });
    },
  });
}

// ── Messages Hook (Infinite Scroll) ──

export function useChatMessages(roomId: string | undefined) {
  return useInfiniteQuery({
    queryKey: CHAT_KEYS.messages(roomId ?? ''),
    enabled: !!roomId,
    queryFn: ({ pageParam }) =>
      fetchChatMessages(roomId!, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length === 0) return undefined;
      const last = lastPage[lastPage.length - 1];
      return last ? last.created_at : undefined;
    },
  });
}

// ── Send Message (Optimistic Updates + Offline Queue) ──

export function useSendMessage(roomId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      clientId: string;
      content: string;
      messageType?: string;
      imageUrl?: string;
    }) => {
      if (!roomId) throw new Error('Room ID is required');

      // Offline: queue message in IndexedDB
      if (!navigator.onLine) {
        await enqueueMessage({
          clientId: params.clientId,
          roomId,
          content: params.content,
          messageType: params.messageType ?? 'text',
          imageUrl: params.imageUrl,
          queuedAt: Date.now(),
        });
        // Return a synthetic response so optimistic UI stays
        return {
          id: params.clientId,
          client_id: params.clientId,
          tenant_id: '',
          room_id: roomId,
          sender_id: null,
          message_type: params.messageType ?? 'text',
          content: params.content,
          image_url: params.imageUrl ?? null,
          status: 'pending' as const,
          created_at: new Date().toISOString(),
          deleted_at: null,
        };
      }

      return sendChatMessage({ roomId, ...params });
    },
    onMutate: async (params) => {
      if (!roomId) return;

      const queryKey = CHAT_KEYS.messages(roomId);
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData(queryKey);

      const optimisticMsg: OptimisticChatMessage = {
        id: params.clientId,
        client_id: params.clientId,
        tenant_id: '',
        room_id: roomId,
        sender_id: null,
        message_type: (params.messageType ?? 'text') as
          | 'text'
          | 'image'
          | 'system',
        content: params.content,
        image_url: params.imageUrl ?? null,
        status: 'pending',
        created_at: new Date().toISOString(),
        deleted_at: null,
        _optimistic: true,
      };

      queryClient.setQueryData(queryKey, (old: unknown) => {
        const data = old as InfiniteData | undefined;
        if (!data) return data;
        return {
          ...data,
          pages: [
            [optimisticMsg, ...(data.pages[0] ?? [])],
            ...data.pages.slice(1),
          ],
        };
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous && roomId) {
        queryClient.setQueryData(CHAT_KEYS.messages(roomId), context.previous);
      }
    },
    onSettled: () => {
      if (roomId) {
        void queryClient.invalidateQueries({
          queryKey: CHAT_KEYS.messages(roomId),
        });
      }
    },
  });
}

// ── Delete Message ──

export function useDeleteMessage(roomId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: softDeleteMessage,
    onSuccess: () => {
      if (roomId) {
        void queryClient.invalidateQueries({
          queryKey: CHAT_KEYS.messages(roomId),
        });
      }
    },
  });
}

// ── Update Read Receipt ──

export function useUpdateReadReceipt() {
  return useMutation({
    mutationFn: ({
      roomId,
      lastMessageId,
    }: {
      roomId: string;
      lastMessageId: string;
    }) => updateReadReceipt(roomId, lastMessageId),
  });
}

// ── Realtime Subscription (with Reconnection + Multi-tab Broadcast) ──

const MAX_RECONNECT_ATTEMPTS = 5;

export function useChatRealtime(roomId: string | undefined) {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const [connectionStatus, setConnectionStatus] =
    useState<ChatConnectionStatus>('connected');

  const subscribe = useCallback(() => {
    if (!roomId) return;

    // Cleanup previous channel if exists
    if (channelRef.current) {
      void supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;

          // Update local cache (with dedup)
          queryClient.setQueryData(CHAT_KEYS.messages(roomId), (old: unknown) =>
            appendMessage(old, newMsg),
          );

          // Relay to other tabs via BroadcastChannel
          broadcastNewMessage(roomId, newMsg);
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          retryCountRef.current = 0;
          setConnectionStatus('connected');
          broadcastConnectionStatus(roomId, 'connected');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          // Exceeded max retries — stop attempting
          if (retryCountRef.current >= MAX_RECONNECT_ATTEMPTS) {
            setConnectionStatus('disconnected');
            broadcastConnectionStatus(roomId, 'disconnected');
            return;
          }

          retryCountRef.current += 1;
          setConnectionStatus('reconnecting');
          broadcastConnectionStatus(roomId, 'reconnecting');

          // Auto-reconnect with exponential backoff
          const delay = Math.min(3000 * retryCountRef.current, 15000);
          retryTimerRef.current = setTimeout(() => {
            // Re-fetch to catch missed messages
            void queryClient.invalidateQueries({
              queryKey: CHAT_KEYS.messages(roomId),
            });

            // Re-subscribe
            subscribe();
          }, delay);
        }
      });

    channelRef.current = channel;
  }, [roomId, queryClient]);

  const unsubscribe = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (channelRef.current) {
      void supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    retryCountRef.current = 0;
  }, []);

  // Subscribe on mount, unsubscribe on unmount
  useEffect(() => {
    subscribe();
    return () => {
      unsubscribe();
    };
  }, [subscribe, unsubscribe]);

  // Listen for messages from other tabs (BroadcastChannel)
  useEffect(() => {
    if (!roomId) return;

    const cleanup = onBroadcastMessage((payload) => {
      if (payload.roomId !== roomId) return;

      if (payload.type === 'new_message') {
        queryClient.setQueryData(CHAT_KEYS.messages(roomId), (old: unknown) =>
          appendMessage(old, payload.data as ChatMessage),
        );
      }

      if (payload.type === 'connection_status') {
        setConnectionStatus(payload.data as ChatConnectionStatus);
      }
    });

    return cleanup;
  }, [roomId, queryClient]);

  return { connectionStatus };
}

// ── Offline Queue Flush Hook ──

/**
 * Auto-flushes queued offline messages when network comes back online.
 * Should be used in the ChatDrawer or a global provider.
 */
export function useChatOfflineSync(roomId: string | undefined) {
  const [isFlushing, setIsFlushing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const flushQueue = useCallback(async () => {
    if (!roomId || isFlushing) return;

    const queued = await getQueuedMessages();
    const roomMessages = queued.filter((m) => m.roomId === roomId);
    if (roomMessages.length === 0) return;

    setIsFlushing(true);
    setPendingCount(roomMessages.length);

    for (const msg of roomMessages) {
      try {
        await sendChatMessage({
          roomId: msg.roomId,
          clientId: msg.clientId,
          content: msg.content,
          messageType: msg.messageType,
          imageUrl: msg.imageUrl,
        });
        await dequeueMessage(msg.clientId);
        setPendingCount((c) => Math.max(0, c - 1));
      } catch {
        // Keep in queue for next retry
        break;
      }
    }

    setIsFlushing(false);
  }, [roomId, isFlushing]);

  // Auto-flush when coming online
  useEffect(() => {
    const handleOnline = () => {
      void flushQueue();
    };

    window.addEventListener('online', handleOnline);

    // Also try flushing on mount (in case we start online with queued msgs)
    if (navigator.onLine) {
      void flushQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [flushQueue]);

  return { isFlushing, pendingCount };
}
