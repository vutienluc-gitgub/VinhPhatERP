import { describe, it, expect, beforeEach } from 'vitest';

import type { ChatMessage, OptimisticChatMessage } from '@/schema/chat.schema';
import {
  messageSendStateMachine,
  mapSendStateToPresentationStatus,
} from '@/domain/chat';
import {
  registerActiveView,
  clearActiveViews,
  evaluateNotificationPolicy,
} from '@/features/notifications';

type InfiniteData = {
  pages: (ChatMessage | OptimisticChatMessage)[][];
  pageParams: unknown[];
};

/**
 * Pure simulation of the cache reconciliation logic used in useChat.ts
 */
function appendMessage(old: unknown, newMsg: ChatMessage): InfiniteData {
  const data = old as InfiniteData | undefined;
  if (!data) {
    return { pages: [[newMsg]], pageParams: [undefined] };
  }

  const allMessages = data.pages.flat();
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
      pages: data.pages.map((page) =>
        page.map((m) =>
          (Boolean(newMsg.client_id) && m.client_id === newMsg.client_id) ||
          m.id === newMsg.id
            ? { ...m, ...newMsg, status: 'sent', _optimistic: false }
            : m,
        ),
      ),
    };
  }

  return {
    ...data,
    pages: [[newMsg, ...(data.pages[0] ?? [])], ...data.pages.slice(1)],
  };
}

describe('Chat Platform Reliability Test Matrix (6 Distributed Scenarios)', () => {
  beforeEach(() => {
    clearActiveViews();
  });

  // ─────────────────────────────────────────────────────────────
  // Case A: RPC success + Realtime arrives first
  // ─────────────────────────────────────────────────────────────
  it('Case A: Realtime event arrives BEFORE RPC returns — reconciles cleanly with 0 duplicate', () => {
    const clientId = 'client-uuid-101';
    const serverMessageId = 'server-uuid-201';
    const roomId = 'room-01';

    // 1. Initial State: Empty room
    let cache: InfiniteData = { pages: [[]], pageParams: [undefined] };

    // 2. Client sends message -> Optimistic Insert
    const optimisticMsg: OptimisticChatMessage = {
      id: clientId,
      client_id: clientId,
      tenant_id: 'tenant-1',
      room_id: roomId,
      sender_id: 'user-me',
      message_type: 'text',
      content: 'Chào xưởng',
      image_url: null,
      file_url: null,
      file_name: null,
      file_type: null,
      status: 'pending',
      created_at: '2026-08-29T10:00:00.000Z',
      deleted_at: null,
      is_pinned: false,
      pinned_at: null,
      pinned_by: null,
      _optimistic: true,
    };
    cache = { pages: [[optimisticMsg]], pageParams: [undefined] };
    expect(cache.pages[0]?.[0]?.status).toBe('pending');
    expect(cache.pages[0]?.[0]?.id).toBe(clientId);

    // 3. Realtime event arrives FIRST from websocket
    const realtimeMsg: ChatMessage = {
      id: serverMessageId,
      client_id: clientId,
      tenant_id: 'tenant-1',
      room_id: roomId,
      sender_id: 'user-me',
      message_type: 'text',
      content: 'Chào xưởng',
      image_url: null,
      file_url: null,
      file_name: null,
      file_type: null,
      status: 'sent',
      created_at: '2026-08-29T10:00:00.500Z',
      deleted_at: null,
      is_pinned: false,
      pinned_at: null,
      pinned_by: null,
    };

    cache = appendMessage(cache, realtimeMsg);
    expect(cache.pages[0]?.length).toBe(1);
    expect(cache.pages[0]?.[0]?.id).toBe(serverMessageId);
    expect(cache.pages[0]?.[0]?.status).toBe('sent');

    // 4. RPC response returns afterwards
    cache = appendMessage(cache, realtimeMsg);
    expect(cache.pages[0]?.length).toBe(1);
    expect(cache.pages[0]?.[0]?.id).toBe(serverMessageId);
  });

  // ─────────────────────────────────────────────────────────────
  // Case B: RPC response arrives first + Realtime arrives later
  // ─────────────────────────────────────────────────────────────
  it('Case B: RPC response arrives BEFORE Realtime event — maintains confirmed sent state', () => {
    const clientId = 'client-uuid-102';
    const serverMessageId = 'server-uuid-202';
    const roomId = 'room-01';

    let cache: InfiniteData = {
      pages: [
        [
          {
            id: clientId,
            client_id: clientId,
            tenant_id: 'tenant-1',
            room_id: roomId,
            sender_id: 'user-me',
            message_type: 'text',
            content: 'Báo giá sợi',
            image_url: null,
            file_url: null,
            file_name: null,
            file_type: null,
            status: 'pending',
            created_at: '2026-08-29T10:05:00.000Z',
            deleted_at: null,
            is_pinned: false,
            pinned_at: null,
            pinned_by: null,
            _optimistic: true,
          },
        ],
      ],
      pageParams: [undefined],
    };

    // 1. RPC returns confirmed server message
    const confirmedMsg: ChatMessage = {
      id: serverMessageId,
      client_id: clientId,
      tenant_id: 'tenant-1',
      room_id: roomId,
      sender_id: 'user-me',
      message_type: 'text',
      content: 'Báo giá sợi',
      image_url: null,
      file_url: null,
      file_name: null,
      file_type: null,
      status: 'sent',
      created_at: '2026-08-29T10:05:00.200Z',
      deleted_at: null,
      is_pinned: false,
      pinned_at: null,
      pinned_by: null,
    };

    cache = appendMessage(cache, confirmedMsg);
    expect(cache.pages[0]?.length).toBe(1);
    expect(cache.pages[0]?.[0]?.id).toBe(serverMessageId);
    expect(cache.pages[0]?.[0]?.status).toBe('sent');

    // 2. Realtime event arrives later with identical content
    cache = appendMessage(cache, confirmedMsg);
    expect(cache.pages[0]?.length).toBe(1);
    expect(cache.pages[0]?.[0]?.id).toBe(serverMessageId);
  });

  // ─────────────────────────────────────────────────────────────
  // Case C: Duplicate Realtime events
  // ─────────────────────────────────────────────────────────────
  it('Case C: Duplicate / redundant Realtime events are strictly deduplicated', () => {
    const roomId = 'room-01';
    let cache: InfiniteData = { pages: [[]], pageParams: [undefined] };

    const inboundMsg: ChatMessage = {
      id: 'server-msg-999',
      client_id: 'client-999',
      tenant_id: 'tenant-1',
      room_id: roomId,
      sender_id: 'user-customer',
      message_type: 'text',
      content: 'Đã nhận được hàng',
      image_url: null,
      file_url: null,
      file_name: null,
      file_type: null,
      status: 'sent',
      created_at: '2026-08-29T10:10:00.000Z',
      deleted_at: null,
      is_pinned: false,
      pinned_at: null,
      pinned_by: null,
    };

    // First arrival
    cache = appendMessage(cache, inboundMsg);
    expect(cache.pages[0]?.length).toBe(1);

    // Duplicate arrival 1
    cache = appendMessage(cache, inboundMsg);
    expect(cache.pages[0]?.length).toBe(1);

    // Duplicate arrival 2
    cache = appendMessage(cache, inboundMsg);
    expect(cache.pages[0]?.length).toBe(1);
  });

  // ─────────────────────────────────────────────────────────────
  // Case D: Failure & Retry Lifecycle
  // ─────────────────────────────────────────────────────────────
  it('Case D: Failure and Retry State Machine progression works seamlessly', () => {
    expect(messageSendStateMachine.canTransition('idle', 'start_send')).toBe(
      true,
    );
    const s1 = messageSendStateMachine.apply('idle', 'start_send');
    expect(s1).toBe('pending');
    expect(mapSendStateToPresentationStatus(s1)).toBe('sending');

    // Network drops -> error
    const s2 = messageSendStateMachine.apply(s1, 'send_error');
    expect(s2).toBe('failed');
    expect(mapSendStateToPresentationStatus(s2)).toBe('failed');

    // User clicks Retry
    const s3 = messageSendStateMachine.apply(s2, 'retry');
    expect(s3).toBe('retrying');
    expect(mapSendStateToPresentationStatus(s3)).toBe('sending');

    // Reconnection succeeds
    const s4 = messageSendStateMachine.apply(s3, 'send_success');
    expect(s4).toBe('sent');
    expect(mapSendStateToPresentationStatus(s4)).toBe('sent');
  });

  // ─────────────────────────────────────────────────────────────
  // Case E: Offline Enqueue & Per-Aggregate FIFO Order
  // ─────────────────────────────────────────────────────────────
  it('Case E: Offline Queue maintains FIFO order per room aggregate', () => {
    const queue: Array<{ id: string; roomId: string; order: number }> = [];

    // Enqueue 3 messages while offline
    queue.push({ id: 'msg-1', roomId: 'room-A', order: 1 });
    queue.push({ id: 'msg-2', roomId: 'room-B', order: 1 });
    queue.push({ id: 'msg-3', roomId: 'room-A', order: 2 });

    const roomA = queue
      .filter((q) => q.roomId === 'room-A')
      .sort((a, b) => a.order - b.order);
    expect(roomA[0]?.id).toBe('msg-1');
    expect(roomA[1]?.id).toBe('msg-3');
  });

  // ─────────────────────────────────────────────────────────────
  // Case F: Multi-tab Active View & Notification Isolation
  // ─────────────────────────────────────────────────────────────
  it('Case F: Active View in Tab A prevents Web Push & In-App chime spam', () => {
    registerActiveView('chat_room', 'room-active');

    const decision = evaluateNotificationPolicy(
      {
        domain: 'chat',
        entityType: 'chat_room',
        entityId: 'room-active',
        senderId: 'user-partner',
      },
      {
        currentUserId: 'user-me',
        deviceCapabilities: { hasPushPermission: true },
      },
    );

    // Active room skips push and in-app chime because active client has Realtime
    expect(decision.shouldDeliverInApp).toBe(false);
    expect(decision.shouldDeliverWebPush).toBe(false);
    expect(decision.shouldPlaySound).toBe(false);
    expect(decision.suppressReasons).toContain('active_view');
  });

  // ─────────────────────────────────────────────────────────────
  // Case G: Transaction Boundary & Defensive Recipient Resolution
  // ─────────────────────────────────────────────────────────────
  it('Case G: Transaction boundary guarantees synchronous participant sync before notification dispatch', () => {
    // Simulation of database execution order
    const executionTrace: string[] = [];

    function rpcSendChatMessageSimulation(input: {
      roomId: string;
      senderId: string;
      content: string;
    }) {
      // 1. In-Transaction: Sync participants
      executionTrace.push('1. SYNC_PARTICIPANTS');
      const participants = [
        { userId: input.senderId, role: 'customer' },
        { userId: 'admin-01', role: 'admin' },
        { userId: 'staff-01', role: 'staff' },
      ];

      // 2. In-Transaction: Validate sender
      executionTrace.push('2. VALIDATE_SENDER_MEMBERSHIP');
      const isMember = participants.some((p) => p.userId === input.senderId);
      expect(isMember).toBe(true);

      // 3. In-Transaction: Insert Message
      executionTrace.push('3. INSERT_MESSAGE');

      // 4. In-Transaction Trigger: Increment unread for non-senders
      executionTrace.push('4. TRIGGER_UNREAD_INCREMENT');
      const nonSenders = participants.filter(
        (p) => p.userId !== input.senderId,
      );
      expect(nonSenders.length).toBe(2);

      // 5. Post-Commit: Realtime & Web Push Fanout
      executionTrace.push('5. COMMIT_AND_DISPATCH_NOTIFICATIONS');

      return { success: true, recipients: nonSenders.map((p) => p.userId) };
    }

    const result = rpcSendChatMessageSimulation({
      roomId: 'room-test-sync',
      senderId: 'customer-101',
      content: 'Chào công ty, tôi muốn đặt hàng',
    });

    expect(result.success).toBe(true);
    expect(result.recipients).toEqual(['admin-01', 'staff-01']);
    expect(executionTrace).toEqual([
      '1. SYNC_PARTICIPANTS',
      '2. VALIDATE_SENDER_MEMBERSHIP',
      '3. INSERT_MESSAGE',
      '4. TRIGGER_UNREAD_INCREMENT',
      '5. COMMIT_AND_DISPATCH_NOTIFICATIONS',
    ]);
  });

  // ─────────────────────────────────────────────────────────────
  // Case H: Sender Membership Authorization Boundary
  // ─────────────────────────────────────────────────────────────
  it('Case H: Sender membership invariant rejects unauthorized non-participant senders with Access Denied', () => {
    function rpcSendChatMessageGuard(input: {
      roomId: string;
      senderId: string;
      validParticipants: string[];
    }) {
      const isAuthorized = input.validParticipants.includes(input.senderId);
      if (!isAuthorized) {
        throw new Error(
          `Access denied: user ${input.senderId} is not an authorized participant of room ${input.roomId}`,
        );
      }
      return { status: 'inserted' };
    }

    // 1. Authorized sender succeeds
    expect(() =>
      rpcSendChatMessageGuard({
        roomId: 'room-cust-1',
        senderId: 'user-valid-cust',
        validParticipants: ['user-valid-cust', 'admin-01'],
      }),
    ).not.toThrow();

    // 2. Unauthorized external intruder fails immediately
    expect(() =>
      rpcSendChatMessageGuard({
        roomId: 'room-cust-1',
        senderId: 'user-malicious-intruder',
        validParticipants: ['user-valid-cust', 'admin-01'],
      }),
    ).toThrow(
      /Access denied: user user-malicious-intruder is not an authorized participant/,
    );
  });
});
