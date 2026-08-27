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
  fetchPinnedMessages,
  getOrCreateChatRoom,
  sendChatMessage,
  softDeleteMessage,
  togglePinMessage,
  updateReadReceipt,
  addReaction,
  removeReaction,
  searchMessages,
} from '@/api/chat.api';
import type {
  ChatMessage,
  ChatMention,
  ChatRoom,
  OptimisticChatMessage,
} from '@/schema/chat.schema';
import {
  broadcastNewMessage,
  broadcastConnectionStatus,
  onBroadcastMessage,
} from '@/shared/lib/chat-broadcast';
import { useAuth } from '@/shared/hooks/useAuth';
import {
  enqueueMessage,
  getQueuedMessages,
  dequeueMessage,
} from '@/shared/lib/chat-offline-queue';
import {
  broadcastTypingStart,
  broadcastTypingStop,
  onTypingEvent,
} from '@/shared/lib/chat-typing';
import { chatAudio } from '@/shared/lib/chat-audio';
import { supabase } from '@/services/supabase/client';

// ── Query Keys ──

const CHAT_KEYS = {
  rooms: ['chat-rooms'] as const,
  room: (entityType: string, entityId: string) =>
    ['chat-rooms', entityType, entityId] as const,
  messages: (roomId: string) => ['chat-messages', roomId] as const,
  pinnedMessages: (roomId: string) => ['chat-pinned-messages', roomId] as const,
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
    // Realtime handles new messages — no polling needed.
    // Cache survives 30 min so close→reopen is instant.
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
  });
}

// ── Send Message (Optimistic Updates + Offline Queue) ──

export function useSendMessage(roomId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      clientId: string;
      content?: string;
      messageType?: 'text' | 'image' | 'system' | 'file';
      imageUrl?: string;
      fileUrl?: string;
      fileName?: string;
      fileType?: string;
      mentions?: ChatMention[];
    }) => {
      if (!roomId) throw new Error('Room ID is required');

      // Offline: queue message in IndexedDB
      if (!navigator.onLine) {
        await enqueueMessage({
          clientId: params.clientId,
          roomId,
          content: params.content || '',
          messageType: params.messageType ?? 'text',
          imageUrl: params.imageUrl,
          fileUrl: params.fileUrl,
          fileName: params.fileName,
          fileType: params.fileType,
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
          file_url: params.fileUrl ?? null,
          file_name: params.fileName ?? null,
          file_type: params.fileType ?? null,
          status: 'pending' as const,
          created_at: new Date().toISOString(),
          deleted_at: null,
          read_at: null,
          read_by: null,
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
          | 'system'
          | 'file',
        content: params.content || '',
        image_url: params.imageUrl ?? null,
        file_url: params.fileUrl ?? null,
        file_name: params.fileName ?? null,
        file_type: params.fileType ?? null,
        status: 'pending',
        created_at: new Date().toISOString(),
        deleted_at: null,
        is_pinned: false,
        pinned_at: null,
        pinned_by: null,
        mentions: params.mentions,
        read_at: null,
        read_by: null,
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
    // onSettled invalidation removed — the realtime INSERT handler
    // already appends the confirmed message via appendMessage() with
    // client_id dedup. No need for a redundant full-page refetch.
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

// ── Pin Messages ──

export function usePinnedMessages(roomId: string | undefined) {
  return useQuery({
    queryKey: CHAT_KEYS.pinnedMessages(roomId ?? ''),
    enabled: !!roomId,
    queryFn: () => fetchPinnedMessages(roomId!),
  });
}

export function useTogglePin(roomId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => togglePinMessage(messageId),
    onSuccess: () => {
      if (roomId) {
        void queryClient.invalidateQueries({
          queryKey: CHAT_KEYS.messages(roomId),
        });
        void queryClient.invalidateQueries({
          queryKey: CHAT_KEYS.pinnedMessages(roomId),
        });
      }
    },
  });
}

// ── Message Reactions ──

export function useAddReaction(roomId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      addReaction(messageId, emoji),
    onSuccess: () => {
      if (roomId) {
        void queryClient.invalidateQueries({
          queryKey: CHAT_KEYS.messages(roomId),
        });
      }
    },
  });
}

export function useRemoveReaction(roomId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      removeReaction(messageId, emoji),
    onSuccess: () => {
      if (roomId) {
        void queryClient.invalidateQueries({
          queryKey: CHAT_KEYS.messages(roomId),
        });
      }
    },
  });
}

// ── Search Messages ──

export function useSearchMessages(roomId: string | undefined, query: string) {
  return useQuery({
    queryKey: ['chat-search', roomId, query],
    queryFn: () => searchMessages({ roomId: roomId!, query }),
    enabled: !!roomId && query.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ── Typing Indicator ──

const TYPING_EXPIRY_MS = 3000; // 3 seconds

export function useTypingIndicator(roomId: string | undefined) {
  const [typingUsers, setTypingUsers] = useState<
    Array<{ userId: string; userName: string; timestamp: number }>
  >([]);
  const { profile, user } = useAuth();

  // Track typing timestamps for expiry
  const typingTimestampsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = onTypingEvent((message) => {
      if (message.roomId !== roomId) return;
      if (message.userId === user?.id) return; // Ignore own typing events

      if (message.type === 'typing_start') {
        typingTimestampsRef.current.set(message.userId, message.timestamp);
        setTypingUsers((prev) => {
          const exists = prev.find((u) => u.userId === message.userId);
          if (exists) return prev;
          return [
            ...prev,
            {
              userId: message.userId,
              userName: message.userName,
              timestamp: message.timestamp,
            },
          ];
        });
      } else if (message.type === 'typing_stop') {
        typingTimestampsRef.current.delete(message.userId);
        setTypingUsers((prev) =>
          prev.filter((u) => u.userId !== message.userId),
        );
      }
    });

    return unsubscribe;
  }, [roomId, user?.id]);

  // Cleanup expired typing states
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const expiredUserIds: string[] = [];

      for (const [userId, timestamp] of typingTimestampsRef.current.entries()) {
        if (now - timestamp > TYPING_EXPIRY_MS) {
          expiredUserIds.push(userId);
        }
      }

      if (expiredUserIds.length > 0) {
        for (const userId of expiredUserIds) {
          typingTimestampsRef.current.delete(userId);
        }
        setTypingUsers((prev) =>
          prev.filter((u) => !expiredUserIds.includes(u.userId)),
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const startTyping = useCallback(() => {
    if (!roomId || !profile) return;
    broadcastTypingStart({
      roomId,
      userId: profile.id,
      userName: profile.full_name || 'Unknown',
    });
  }, [roomId, profile]);

  const stopTyping = useCallback(() => {
    if (!roomId || !profile) return;
    broadcastTypingStop({
      roomId,
      userId: profile.id,
      userName: profile.full_name || 'Unknown',
    });
  }, [roomId, profile]);

  return { typingUsers, startTyping, stopTyping };
}

// ── Realtime Subscription (with Reconnection + Multi-tab Broadcast) ──

export function useChatRealtime(roomId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
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
      channelRef.current = null;
    }

    const channel = supabase.channel(`room:${roomId}`);
    channelRef.current = channel;

    channel
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

          // Subtle audio cue for incoming messages from other participants
          if (newMsg.sender_id && newMsg.sender_id !== user?.id) {
            chatAudio.playReceivedSound();
          }

          // Update local cache (with dedup)
          queryClient.setQueryData(CHAT_KEYS.messages(roomId), (old: unknown) =>
            appendMessage(old, newMsg),
          );

          // Relay to other tabs via BroadcastChannel
          broadcastNewMessage(roomId, newMsg);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          // Invalidate messages on update (like pinned changes or soft deletes)
          void queryClient.invalidateQueries({
            queryKey: CHAT_KEYS.messages(roomId),
          });
          void queryClient.invalidateQueries({
            queryKey: CHAT_KEYS.pinnedMessages(roomId),
          });
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_message_reactions',
        },
        () => {
          // Invalidate messages when reactions are added/removed in realtime
          void queryClient.invalidateQueries({
            queryKey: CHAT_KEYS.messages(roomId),
          });
        },
      )
      .subscribe((status) => {
        // Prevent zombie callbacks from removed channels
        if (channelRef.current !== channel) return;

        if (status === 'SUBSCRIBED') {
          // If we recovered from a disconnect, fetch any missed messages
          if (retryCountRef.current > 0) {
            void queryClient.invalidateQueries({
              queryKey: CHAT_KEYS.messages(roomId),
            });
          }
          retryCountRef.current = 0;
          setConnectionStatus('connected');
          broadcastConnectionStatus(roomId, 'connected');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          retryCountRef.current += 1;
          setConnectionStatus('reconnecting');
          broadcastConnectionStatus(roomId, 'reconnecting');
          // Supabase Realtime client will automatically attempt to reconnect.
          // We do not need a manual setTimeout here, which prevents duplicate channel bugs.
        }
      });
  }, [roomId, queryClient, user?.id]);

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
  /**
   * Ref is the authoritative flushing guard — immune to stale closures
   * captured by the `online` event listener.
   * useState is kept only for UI rendering (e.g. showing a spinner).
   */
  const isFlushingRef = useRef(false);
  const [isFlushing, setIsFlushing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const setFlushing = useCallback((val: boolean) => {
    isFlushingRef.current = val;
    setIsFlushing(val);
  }, []);

  const flushQueue = useCallback(async () => {
    if (!roomId || isFlushingRef.current) return;

    setFlushing(true);

    try {
      const queued = await getQueuedMessages();
      const roomMessages = queued.filter((m) => m.roomId === roomId);
      if (roomMessages.length === 0) return;

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
    } finally {
      setFlushing(false);
    }
  }, [roomId, setFlushing]);

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
