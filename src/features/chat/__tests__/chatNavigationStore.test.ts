import { describe, it, expect, beforeEach } from 'vitest';

import { chatNavigationStore } from '@/features/chat/controllers/chatNavigationStore';

describe('Chat Navigation Controller Store (Singleton Intent Manager)', () => {
  beforeEach(() => {
    chatNavigationStore.closeChat();
  });

  it('initializes in closed state with null activeIntent', () => {
    const state = chatNavigationStore.getState();
    expect(state.isOpen).toBe(false);
    expect(state.activeIntent).toBeNull();
  });

  it('opens chat room with canonical ChatNavigationIntent', () => {
    chatNavigationStore.openChat({
      roomId: 'room-abc-123',
      messageId: 'msg-456',
      source: 'notification',
    });

    const state = chatNavigationStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.activeIntent).toEqual({
      roomId: 'room-abc-123',
      messageId: 'msg-456',
      source: 'notification',
    });
  });

  it('opens chat by room ID shorthand', () => {
    chatNavigationStore.openChatByRoomId('room-xyz-789', 'msg-1', 'inbox');

    const state = chatNavigationStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.activeIntent?.roomId).toBe('room-xyz-789');
    expect(state.activeIntent?.messageId).toBe('msg-1');
    expect(state.activeIntent?.source).toBe('inbox');
  });

  it('opens chat by entity fallback', () => {
    chatNavigationStore.openChatByEntity(
      'customer',
      'cust-10',
      'Monz brand',
      'KH-010',
    );

    const state = chatNavigationStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.activeIntent?.roomId).toBe('');
    expect(state.activeIntent?.entityType).toBe('customer');
    expect(state.activeIntent?.entityId).toBe('cust-10');
    expect(state.activeIntent?.title).toBe('Monz brand');
    expect(state.activeIntent?.subtitle).toBe('KH-010');
  });

  it('parses deep link URL search params correctly into ChatNavigationIntent', () => {
    const params = new URLSearchParams(
      '?chatOpen=1&roomId=room-deep-1&messageId=msg-deep-2',
    );
    const intent = chatNavigationStore.parseChatNavigationFromUrl(params);

    expect(intent).toEqual({
      roomId: 'room-deep-1',
      messageId: 'msg-deep-2',
      entityType: undefined,
      entityId: undefined,
      source: 'notification',
    });
  });

  it('returns null when URL does not have chatOpen=1', () => {
    const params = new URLSearchParams('?page=orders');
    const intent = chatNavigationStore.parseChatNavigationFromUrl(params);

    expect(intent).toBeNull();
  });

  it('notifies subscribers on state changes', () => {
    let callCount = 0;
    const unsubscribe = chatNavigationStore.subscribe(() => {
      callCount++;
    });

    chatNavigationStore.openChatByRoomId('room-1');
    expect(callCount).toBe(1);

    chatNavigationStore.closeChat();
    expect(callCount).toBe(2);

    unsubscribe();
    chatNavigationStore.openChatByRoomId('room-2');
    expect(callCount).toBe(2); // no more calls after unsubscribe
  });
});
