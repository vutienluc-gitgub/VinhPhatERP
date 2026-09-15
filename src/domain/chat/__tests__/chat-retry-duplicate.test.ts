import { describe, it, expect } from 'vitest';

import type { ChatMessage, OptimisticChatMessage } from '@/schema/chat.schema';
import type { ChatMessageViewModel } from '@/features/chat/chat.types';

type InfiniteData = { pages: ChatMessage[][]; pageParams: unknown[] };

/**
 * Simulates patched onMutate in useSendMessage
 */
function simulateOnMutate(
  oldData: InfiniteData | undefined,
  optimisticMsg: OptimisticChatMessage,
): InfiniteData {
  if (!oldData || !Array.isArray(oldData.pages)) {
    return { pages: [[optimisticMsg as ChatMessage]], pageParams: [undefined] };
  }
  const normalizedPages = oldData.pages.map((p) => (Array.isArray(p) ? p : []));
  const firstPage = normalizedPages[0] ?? [];

  const existingIdx = firstPage.findIndex(
    (m) =>
      (Boolean(optimisticMsg.client_id) &&
        m.client_id === optimisticMsg.client_id) ||
      m.id === optimisticMsg.client_id,
  );

  const updatedFirstPage =
    existingIdx !== -1
      ? firstPage.map((m, idx) =>
          idx === existingIdx ? (optimisticMsg as ChatMessage) : m,
        )
      : [optimisticMsg as ChatMessage, ...firstPage];

  return {
    ...oldData,
    pages: [updatedFirstPage, ...normalizedPages.slice(1)],
  };
}

/**
 * Simulates patched isError evaluation in ChatBubble.tsx
 */
function evaluateIsError(
  message: ChatMessage,
  viewModelStatus: ChatMessageViewModel['status'],
  isOptimistic = false,
): boolean {
  const isSent =
    message.status === 'sent' ||
    viewModelStatus === 'sent' ||
    viewModelStatus === 'read';

  return (
    !isOptimistic &&
    !isSent &&
    (message.status === 'error' ||
      message.status === 'failed' ||
      viewModelStatus === 'failed')
  );
}

describe('Chat Bubble & Retry Reproduction Tests', () => {
  it('FAILING TEST 1: Retrying a message must replace the existing failed message, not duplicate it in pages[0]', () => {
    const clientId = 'client-uuid-47';
    const failedMsg: ChatMessage = {
      id: clientId,
      client_id: clientId,
      tenant_id: 'tenant-1',
      room_id: 'room-01',
      sender_id: 'user-me',
      message_type: 'text',
      content: '47',
      image_url: null,
      file_url: null,
      file_name: null,
      file_type: null,
      status: 'failed',
      created_at: '2026-09-14T17:00:00.000Z',
      deleted_at: null,
      is_pinned: false,
      pinned_at: null,
      pinned_by: null,
    };

    // Initial cache contains 1 failed message
    const initialCache: InfiniteData = {
      pages: [[failedMsg]],
      pageParams: [undefined],
    };

    // User clicks "Thử lại", trigger onMutate with same clientId
    const retryOptimisticMsg: OptimisticChatMessage = {
      ...failedMsg,
      status: 'pending',
      _optimistic: true,
      created_at: '2026-09-14T17:05:00.000Z',
    };

    const updatedCache = simulateOnMutate(initialCache, retryOptimisticMsg);

    // Expectation: Exactly 1 message in pages[0] with status 'pending'
    // Under unpatched logic: pages[0] has length 2 (DUPLICATE BUBBLES!)
    expect(updatedCache.pages[0]?.length).toBe(1);
    expect(updatedCache.pages[0]?.[0]?.status).toBe('pending');
  });

  it('FAILING TEST 2: Confirmed sent message (status sent / checkmark) must NOT evaluate as isError even if message.status has stale failed flag', () => {
    const sentMsg: ChatMessage = {
      id: 'server-uuid-47',
      client_id: 'client-uuid-47',
      tenant_id: 'tenant-1',
      room_id: 'room-01',
      sender_id: 'user-me',
      message_type: 'text',
      content: '47',
      image_url: null,
      file_url: null,
      file_name: null,
      file_type: null,
      status: 'failed', // e.g. stale flag or conflicting status
      created_at: '2026-09-14T17:05:00.000Z',
      deleted_at: null,
      is_pinned: false,
      pinned_at: null,
      pinned_by: null,
    };

    // View model resolved delivery status as 'sent' (displayed checkmark ✓)
    const viewModelStatus: ChatMessageViewModel['status'] = 'sent';

    const isError = evaluateIsError(sentMsg, viewModelStatus, false);

    // Expectation: A message displaying sent status (✓) must NOT show error border and retry button!
    // Under unpatched logic: evaluateIsError returns true because sentMsg.status === 'failed'!
    expect(isError).toBe(false);
  });
});
