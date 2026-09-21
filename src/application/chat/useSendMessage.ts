import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { sendChatMessage } from '@/api/chat.api';
import {
  CHAT_LABELS,
  type ChatMessage,
  type ChatMention,
  type OptimisticChatMessage,
} from '@/schema/chat.schema';
import { useAuth } from '@/shared/hooks/useAuth';
import { enqueueMessage } from '@/shared/lib/chat-offline-queue';

import { CHAT_KEYS, type InfiniteData } from './useChat';

export function appendMessage(old: unknown, newMsg: ChatMessage): unknown {
  const data = old as InfiniteData | undefined;
  if (!data || !Array.isArray(data.pages)) {
    return {
      pages: [[newMsg]],
      pageParams: [undefined],
    };
  }

  const normalizedPages = data.pages.map((p) =>
    Array.isArray(p)
      ? p
      : p &&
          typeof p === 'object' &&
          'messages' in p &&
          Array.isArray((p as { messages: unknown }).messages)
        ? (p as { messages: ChatMessage[] }).messages
        : [],
  );

  const allMessages = normalizedPages.flat();
  const existing = allMessages.find(
    (m) =>
      (Boolean(newMsg.client_id) && m.client_id === newMsg.client_id) ||
      m.id === newMsg.id,
  );

  if (existing) {
    // If message is already confirmed and identical, keep data
    const isOpt = '_optimistic' in existing && Boolean(existing._optimistic);
    if (!isOpt && existing.status !== 'pending' && existing.id === newMsg.id) {
      return data;
    }

    // Replace optimistic / pending message with the confirmed real message
    return {
      ...data,
      pages: normalizedPages.map((page) =>
        page.map((m) =>
          (Boolean(newMsg.client_id) && m.client_id === newMsg.client_id) ||
          m.id === newMsg.id
            ? { ...m, ...newMsg, status: 'sent', _optimistic: false }
            : m,
        ),
      ),
    };
  }

  const firstPage = normalizedPages[0] ?? [];

  return {
    ...data,
    pages: [[newMsg, ...firstPage], ...normalizedPages.slice(1)],
  };
}

export function useSendMessage(roomId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

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
      replyToId?: string | null;
      replyToMessage?: ChatMessage['reply_to_message'];
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
          sender_id: user?.id ?? null,
          message_type: params.messageType ?? 'text',
          content: params.content,
          image_url: params.imageUrl ?? null,
          file_url: params.fileUrl ?? null,
          file_name: params.fileName ?? null,
          file_type: params.fileType ?? null,
          reply_to_id: params.replyToId ?? null,
          reply_to_message: params.replyToMessage ?? null,
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
        sender_id: user?.id ?? null,
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
        reply_to_id: params.replyToId ?? null,
        reply_to_message: params.replyToMessage ?? null,
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
        if (!data || !Array.isArray(data.pages)) {
          return {
            pages: [[optimisticMsg as ChatMessage]],
            pageParams: [undefined],
          };
        }
        const normalizedPages = data.pages.map((p) =>
          Array.isArray(p)
            ? p
            : p &&
                typeof p === 'object' &&
                'messages' in p &&
                Array.isArray((p as { messages: unknown }).messages)
              ? (p as { messages: ChatMessage[] }).messages
              : [],
        );
        const firstPage = normalizedPages[0] ?? [];
        const existingIdx = firstPage.findIndex(
          (m) =>
            (Boolean(params.clientId) && m.client_id === params.clientId) ||
            m.id === params.clientId,
        );

        const updatedFirstPage =
          existingIdx !== -1
            ? firstPage.map((m, idx) =>
                idx === existingIdx ? (optimisticMsg as ChatMessage) : m,
              )
            : [optimisticMsg as ChatMessage, ...firstPage];

        return {
          ...data,
          pages: [updatedFirstPage, ...normalizedPages.slice(1)],
        };
      });

      return { previous };
    },
    onSuccess: (confirmedMsg) => {
      if (!roomId || !confirmedMsg) return;
      queryClient.setQueryData(CHAT_KEYS.messages(roomId), (old: unknown) =>
        appendMessage(old, confirmedMsg as ChatMessage),
      );
    },
    onError: (err, variables) => {
      console.error('[Chat] Failed to send message:', err);
      toast.error(CHAT_LABELS.SEND_ERROR);
      if (roomId) {
        queryClient.setQueryData(CHAT_KEYS.messages(roomId), (old: unknown) => {
          const data = old as InfiniteData | undefined;
          const failedMsg: ChatMessage = {
            id: variables.clientId,
            client_id: variables.clientId,
            tenant_id: '',
            room_id: roomId,
            sender_id: user?.id ?? null,
            message_type: (variables.messageType ?? 'text') as
              | 'text'
              | 'image'
              | 'system'
              | 'file',
            content: variables.content || '',
            image_url: variables.imageUrl ?? null,
            file_url: variables.fileUrl ?? null,
            file_name: variables.fileName ?? null,
            file_type: variables.fileType ?? null,
            reply_to_id: variables.replyToId ?? null,
            reply_to_message: variables.replyToMessage ?? null,
            status: 'failed',
            created_at: new Date().toISOString(),
            deleted_at: null,
            is_pinned: false,
            pinned_at: null,
            pinned_by: null,
            mentions: variables.mentions,
            read_at: null,
            read_by: null,
          };

          if (!data || !Array.isArray(data.pages)) {
            return {
              pages: [[failedMsg]],
              pageParams: [undefined],
            };
          }
          return {
            ...data,
            pages: data.pages.map((page) =>
              Array.isArray(page)
                ? page.map((m) =>
                    m.client_id === variables.clientId
                      ? { ...m, status: 'failed' as const, _optimistic: false }
                      : m,
                  )
                : [],
            ),
          };
        });
      }
    },
  });
}
