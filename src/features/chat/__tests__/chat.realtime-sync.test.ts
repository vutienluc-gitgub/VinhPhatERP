import { describe, it, expect } from 'vitest';

import type { ChatMessage, OptimisticChatMessage } from '@/schema/chat.schema';
import { extractChronologicalMessages } from '@/features/chat/chat.utils';

type InfiniteData = {
  pages: (ChatMessage | OptimisticChatMessage)[][];
  pageParams: unknown[];
};

function appendMessage(old: unknown, newMsg: ChatMessage): InfiniteData {
  const data = old as InfiniteData | undefined;
  if (!data || !Array.isArray(data.pages)) {
    return { pages: [[newMsg]], pageParams: [undefined] };
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
    const isOpt = '_optimistic' in existing && Boolean(existing._optimistic);
    if (!isOpt && existing.status !== 'pending' && existing.id === newMsg.id) {
      return data;
    }

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

describe('Chat Realtime & Receiver Message Exchange Engine', () => {
  it('correctly appends incoming realtime message for receiving user without duplicate', () => {
    const initialCache: InfiniteData = {
      pages: [
        [
          {
            id: 'm-1',
            client_id: 'c-1',
            tenant_id: 't-1',
            room_id: 'r-1',
            sender_id: 'user-sender',
            message_type: 'text',
            content: 'Tin nhắn 1',
            image_url: null,
            file_url: null,
            file_name: null,
            file_type: null,
            status: 'sent',
            created_at: '2026-08-30T10:00:00.000Z',
            deleted_at: null,
            is_pinned: false,
            pinned_at: null,
            pinned_by: null,
          },
        ],
      ],
      pageParams: [undefined],
    };

    // Receiver gets Realtime INSERT event from Sender
    const incomingRealtimeMsg: ChatMessage = {
      id: 'm-2',
      client_id: 'c-2',
      tenant_id: 't-1',
      room_id: 'r-1',
      sender_id: 'user-sender',
      message_type: 'text',
      content: 'Tin nhắn 2 từ người gửi',
      image_url: null,
      file_url: null,
      file_name: null,
      file_type: null,
      status: 'sent',
      created_at: '2026-08-30T10:01:00.000Z',
      deleted_at: null,
      is_pinned: false,
      pinned_at: null,
      pinned_by: null,
    };

    const updatedCache = appendMessage(initialCache, incomingRealtimeMsg);
    const chronological = extractChronologicalMessages(updatedCache.pages);

    expect(chronological.length).toBe(2);
    expect(chronological[0]?.id).toBe('m-1');
    expect(chronological[1]?.id).toBe('m-2');
    expect(chronological[1]?.content).toBe('Tin nhắn 2 từ người gửi');
  });

  it('correctly resolves latest message created_at timestamp for delta reconnection catch-up', () => {
    const messages: ChatMessage[] = [
      {
        id: 'm-1',
        client_id: 'c-1',
        tenant_id: 't-1',
        room_id: 'r-1',
        sender_id: 'user-1',
        message_type: 'text',
        content: 'Old message',
        image_url: null,
        file_url: null,
        file_name: null,
        file_type: null,
        status: 'sent',
        created_at: '2026-08-30T10:00:00.000Z',
        deleted_at: null,
        is_pinned: false,
        pinned_at: null,
        pinned_by: null,
      },
      {
        id: 'm-2',
        client_id: 'c-2',
        tenant_id: 't-1',
        room_id: 'r-1',
        sender_id: 'user-1',
        message_type: 'text',
        content: 'Newest message in cache',
        image_url: null,
        file_url: null,
        file_name: null,
        file_type: null,
        status: 'sent',
        created_at: '2026-08-30T10:05:00.000Z',
        deleted_at: null,
        is_pinned: false,
        pinned_at: null,
        pinned_by: null,
      },
    ];

    // Timeline messages are in chronological order (oldest to newest)
    const chronological = extractChronologicalMessages([messages]);
    const latestMsg = chronological[chronological.length - 1];

    expect(latestMsg?.id).toBe('m-2');
    expect(latestMsg?.created_at).toBe('2026-08-30T10:05:00.000Z');
  });
});
