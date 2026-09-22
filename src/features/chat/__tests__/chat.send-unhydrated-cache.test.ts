import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';

import { useSendMessage } from '@/application/chat/useChat';
import * as chatApi from '@/api/chat.api';

// Mock dependencies
vi.mock('@/api/chat.api', () => ({
  sendChatMessage: vi.fn(),
  fetchChatMessages: vi.fn(),
  fetchChatRoomByEntity: vi.fn(),
  getOrCreateChatRoom: vi.fn(),
  softDeleteMessage: vi.fn(),
  updateReadReceipt: vi.fn(),
  CHAT_MESSAGES_PAGE_SIZE: 50,
}));

vi.mock('@/shared/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-123' },
    profile: { id: 'test-user-123', role: 'admin' },
    loading: false,
  }),
}));

describe('Chat Message Sending on Unhydrated/Empty Cache (Bug Reproduction)', () => {
  let queryClient: QueryClient;
  const roomId = 'room-test-123';
  const queryKey = ['chat-messages', roomId] as const;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  function wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  }

  it('MUST retain optimistic message in cache even when initial messages cache is undefined', async () => {
    // 1. Arrange: Ensure cache for roomId is currently undefined (e.g. fresh drawer open)
    expect(queryClient.getQueryData(queryKey)).toBeUndefined();

    // Mock sendChatMessage to never resolve immediately so we can inspect optimistic state
    vi.mocked(chatApi.sendChatMessage).mockImplementation(
      () => new Promise(() => {}),
    );

    const { result } = renderHook(() => useSendMessage(roomId), { wrapper });

    // 2. Act: Send message "Alo"
    const clientId = 'client-uuid-alo-1';
    act(() => {
      result.current.mutate({
        clientId,
        content: 'Alo',
      });
    });

    // 3. Assert: The optimistic message MUST exist in queryClient cache!
    await waitFor(() => {
      const cacheData = queryClient.getQueryData<{
        pages: Array<Array<{ content: string; client_id: string }>>;
      }>(queryKey);
      expect(cacheData).toBeDefined();
      expect(cacheData?.pages).toBeDefined();
      expect(cacheData?.pages[0]?.[0]?.content).toBe('Alo');
    });
  });

  it('MUST retain confirmed message in cache on success even when cache was previously undefined', async () => {
    expect(queryClient.getQueryData(queryKey)).toBeUndefined();

    const confirmedMsg = {
      id: 'server-id-alo-1',
      client_id: 'client-uuid-alo-2',
      tenant_id: 'tenant-1',
      room_id: roomId,
      sender_id: 'test-user-123',
      message_type: 'text' as const,
      content: 'Alo',
      status: 'sent' as const,
      created_at: new Date().toISOString(),
      deleted_at: null,
      is_pinned: false,
      pinned_at: null,
      pinned_by: null,
      mentions: [],
      image_url: null,
      file_url: null,
      file_name: null,
      file_type: null,
    };

    vi.mocked(chatApi.sendChatMessage).mockResolvedValue(confirmedMsg);

    const { result } = renderHook(() => useSendMessage(roomId), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        clientId: 'client-uuid-alo-2',
        content: 'Alo',
      });
    });

    const cacheData = queryClient.getQueryData<{
      pages: Array<Array<{ content: string }>>;
    }>(queryKey);

    // Current bug: appendMessage returns undefined if old data is undefined
    expect(cacheData).toBeDefined();
    expect(cacheData?.pages[0]?.[0]?.content).toBe('Alo');
  });

  it('MUST retain failed message with status failed on error even when cache was previously undefined', async () => {
    expect(queryClient.getQueryData(queryKey)).toBeUndefined();

    vi.mocked(chatApi.sendChatMessage).mockRejectedValue(
      new Error('Network failure'),
    );

    const { result } = renderHook(() => useSendMessage(roomId), { wrapper });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          clientId: 'client-uuid-alo-3',
          content: 'Alo',
        });
      } catch {
        // Expected mutation failure
      }
    });

    const cacheData = queryClient.getQueryData<{
      pages: Array<Array<{ content: string; status: string }>>;
    }>(queryKey);

    expect(cacheData).toBeDefined();
    expect(cacheData?.pages[0]?.[0]?.content).toBe('Alo');
    expect(cacheData?.pages[0]?.[0]?.status).toBe('failed');
  });
});
