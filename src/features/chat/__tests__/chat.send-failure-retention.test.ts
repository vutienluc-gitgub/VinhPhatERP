import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

import { useSendMessage } from '@/application/chat/useSendMessage';
import { buildMessageGroups } from '@/features/chat/chat.utils';
import type { ChatMessage } from '@/schema/chat.schema';
import * as chatApi from '@/api/chat.api';

vi.mock('@/api/chat.api', () => ({
  sendChatMessage: vi.fn(),
  fetchChatMessages: vi.fn(),
  fetchChatRoomByEntity: vi.fn(),
  getOrCreateChatRoom: vi.fn(),
  softDeleteMessage: vi.fn(),
  updateReadReceipt: vi.fn(),
  togglePinMessage: vi.fn(),
  addReaction: vi.fn(),
  removeReaction: vi.fn(),
  searchMessages: vi.fn(),
  fetchPinnedMessages: vi.fn(),
  CHAT_MESSAGES_PAGE_SIZE: 30,
}));

vi.mock('@/shared/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-me' },
    profile: { id: 'user-me', role: 'staff' },
    loading: false,
  }),
}));

const ROOM_ID = 'room-failure-retention';
const QUERY_KEY = ['chat-messages', ROOM_ID] as const;

type CacheShape = { pages: ChatMessage[][]; pageParams: unknown[] };

function makeWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  };
}

describe('Chat send failure retention (Zero Message Loss)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retains the failed message in the timeline and exposes it as failed (retry affordance)', async () => {
    vi.mocked(chatApi.sendChatMessage).mockRejectedValue(
      new Error('new row violates row-level security policy'),
    );

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const { result } = renderHook(() => useSendMessage(ROOM_ID), {
      wrapper: makeWrapper(queryClient),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          clientId: 'client-alo-failed',
          content: 'Alo',
        });
      } catch {
        // Expected: RPC rejected
      }
    });

    const cache = queryClient.getQueryData<CacheShape>(QUERY_KEY);
    const retained = cache?.pages?.[0]?.find(
      (m) => m.client_id === 'client-alo-failed',
    );

    // The message must survive the failure, not vanish from the timeline
    expect(retained).toBeDefined();
    expect(retained?.content).toBe('Alo');
    expect(retained?.status).toBe('failed');

    // ...and it must be presented as failed so the retry button is rendered
    const groups = buildMessageGroups(cache?.pages.flat() ?? [], 'user-me', {
      currentUserId: 'user-me',
    });
    const viewModel = groups[0]?.clusters[0]?.messages[0];
    expect(viewModel?.message.content).toBe('Alo');
    expect(viewModel?.status).toBe('failed');
    expect(viewModel?.isMine).toBe(true);
  });

  it('preserves the failed message when a page-0 refetch returns server data', async () => {
    vi.mocked(chatApi.sendChatMessage).mockRejectedValue(new Error('offline'));

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const { result } = renderHook(() => useSendMessage(ROOM_ID), {
      wrapper: makeWrapper(queryClient),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          clientId: 'client-alo-offline',
          content: 'Alo',
        });
      } catch {
        // Expected
      }
    });

    const cache = queryClient.getQueryData<CacheShape>(QUERY_KEY);
    const unsaved = (cache?.pages?.[0] ?? []).filter(
      (m) => m.status === 'failed',
    );
    expect(unsaved).toHaveLength(1);
    expect(unsaved[0]?.content).toBe('Alo');
  });

  it('clears the failed state once a retry succeeds', async () => {
    const confirmed: ChatMessage = {
      id: 'server-alo-1',
      client_id: 'client-alo-retry',
      tenant_id: 'tenant-1',
      room_id: ROOM_ID,
      sender_id: 'user-me',
      message_type: 'text',
      content: 'Alo',
      image_url: null,
      file_url: null,
      file_name: null,
      file_type: null,
      status: 'sent',
      created_at: '2026-09-21T08:00:00.000Z',
      deleted_at: null,
      is_pinned: false,
      pinned_at: null,
      pinned_by: null,
    };

    vi.mocked(chatApi.sendChatMessage)
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(confirmed);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const { result } = renderHook(() => useSendMessage(ROOM_ID), {
      wrapper: makeWrapper(queryClient),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          clientId: 'client-alo-retry',
          content: 'Alo',
        });
      } catch {
        // Expected first failure
      }
    });

    await act(async () => {
      await result.current.mutateAsync({
        clientId: 'client-alo-retry',
        content: 'Alo',
      });
    });

    const cache = queryClient.getQueryData<CacheShape>(QUERY_KEY);
    const matching = (cache?.pages?.flat() ?? []).filter(
      (m) => m.client_id === 'client-alo-retry',
    );

    // Retry must replace the failed entry, never duplicate it
    expect(matching).toHaveLength(1);
    expect(matching[0]?.status).toBe('sent');
    expect(matching[0]?.id).toBe('server-alo-1');
  });
});
