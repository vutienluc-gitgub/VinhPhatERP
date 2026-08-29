import { describe, it, expect } from 'vitest';

import { deriveChatTimelineState, type ChatTimelineState } from '@/domain/chat';
import type { ChatMessage } from '@/schema/chat.schema';

describe('Chat Domain - deriveChatTimelineState (Normalized State Machine)', () => {
  const dummyMessage: ChatMessage = {
    id: 'msg-1',
    client_id: 'client-1',
    tenant_id: 'tenant-1',
    room_id: 'room-1',
    sender_id: 'user-1',
    sender_name: 'Monz brand',
    sender_role: 'customer',
    message_type: 'text',
    content: 'Xin chào',
    status: 'sent',
    image_url: null,
    file_url: null,
    file_name: null,
    file_type: null,
    reply_to_id: null,
    reply_to_message: null,
    is_pinned: false,
    pinned_at: null,
    pinned_by: null,
    mentions: [],
    reactions: [],
    created_at: '2026-08-30T00:00:00Z',
    deleted_at: null,
  };

  it('returns initializing when auth is not ready', () => {
    const state: ChatTimelineState = deriveChatTimelineState({
      isAuthReady: false,
      isResolvingRoom: false,
      roomId: 'room-1',
      isLoadingMessages: false,
      isError: false,
      error: null,
      messages: [],
    });

    expect(state).toEqual({ status: 'initializing' });
  });

  it('returns resolving-room when roomId is undefined or room resolution is pending', () => {
    const state: ChatTimelineState = deriveChatTimelineState({
      isAuthReady: true,
      isResolvingRoom: true,
      roomId: undefined,
      isLoadingMessages: false,
      isError: false,
      error: null,
      messages: [],
    });

    expect(state).toEqual({ status: 'resolving-room' });
  });

  it('returns loading when messages query is in flight (prevents premature Empty State)', () => {
    const state: ChatTimelineState = deriveChatTimelineState({
      isAuthReady: true,
      isResolvingRoom: false,
      roomId: 'room-1',
      isLoadingMessages: true,
      isError: false,
      error: null,
      messages: [], // messages is empty during loading, but MUST NOT be 'empty'
    });

    expect(state).toEqual({ status: 'loading' });
  });

  it('returns error with FORBIDDEN code on access denied/RLS exception', () => {
    const state: ChatTimelineState = deriveChatTimelineState({
      isAuthReady: true,
      isResolvingRoom: false,
      roomId: 'room-1',
      isLoadingMessages: false,
      isError: true,
      error: new Error('Access denied to room room-1'),
      messages: [],
    });

    expect(state.status).toBe('error');
    if (state.status === 'error') {
      expect(state.code).toBe('FORBIDDEN');
    }
  });

  it('returns error with NOT_FOUND code when room does not exist', () => {
    const state: ChatTimelineState = deriveChatTimelineState({
      isAuthReady: true,
      isResolvingRoom: false,
      roomId: 'room-1',
      isLoadingMessages: false,
      isError: true,
      error: new Error('Chat room not found'),
      messages: [],
    });

    expect(state.status).toBe('error');
    if (state.status === 'error') {
      expect(state.code).toBe('NOT_FOUND');
    }
  });

  it('returns empty ONLY when query completed successfully with 0 messages', () => {
    const state: ChatTimelineState = deriveChatTimelineState({
      isAuthReady: true,
      isResolvingRoom: false,
      roomId: 'room-1',
      isLoadingMessages: false,
      isError: false,
      error: null,
      messages: [],
    });

    expect(state).toEqual({ status: 'empty' });
  });

  it('returns ready with messages when query resolved non-empty list', () => {
    const state: ChatTimelineState = deriveChatTimelineState({
      isAuthReady: true,
      isResolvingRoom: false,
      roomId: 'room-1',
      isLoadingMessages: false,
      isError: false,
      error: null,
      messages: [dummyMessage],
      hasNextPage: false,
    });

    expect(state).toEqual({
      status: 'ready',
      messages: [dummyMessage],
      hasNextPage: false,
    });
  });
});
