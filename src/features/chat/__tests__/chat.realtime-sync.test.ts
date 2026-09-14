import { describe, it, expect } from 'vitest';

import type { ChatMessage, OptimisticChatMessage } from '@/schema/chat.schema';
import {
  extractChronologicalMessages,
  buildMessageGroups,
} from '@/features/chat/chat.utils';

type InfiniteData = {
  pages: (ChatMessage | OptimisticChatMessage)[][];
  pageParams: unknown[];
};

/**
 * Single Source of Truth helper for cache reconciliation in useChat.ts
 */
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

describe('Two-Party Message Exchange & Realtime Synchronization Engine', () => {
  const SENDER_ID = 'usr-sender-101';
  const RECEIVER_ID = 'usr-receiver-202';
  const ROOM_ID = 'room-test-999';

  it('Scenario 1: Sender sends message -> Optimistic insert -> Server confirmation -> Receiver Realtime receipt (0 duplicates)', () => {
    // 1. Sender Cache State
    let senderCache: InfiniteData = { pages: [[]], pageParams: [undefined] };
    const clientId = 'client-msg-001';

    // Sender optimistic insert
    const optimisticMsg: OptimisticChatMessage = {
      id: clientId,
      client_id: clientId,
      tenant_id: 'tenant-vp',
      room_id: ROOM_ID,
      sender_id: SENDER_ID,
      sender_name: 'Nguyễn Văn Gửi',
      sender_role: 'staff',
      message_type: 'text',
      content: 'Chào đối tác, đơn hàng #12345 đã sẵn sàng',
      image_url: null,
      file_url: null,
      file_name: null,
      file_type: null,
      status: 'pending',
      created_at: '2026-09-14T10:00:00.000Z',
      deleted_at: null,
      is_pinned: false,
      pinned_at: null,
      pinned_by: null,
      _optimistic: true,
    };

    senderCache = { pages: [[optimisticMsg]], pageParams: [undefined] };
    expect(senderCache.pages[0]?.[0]?.status).toBe('pending');
    expect(senderCache.pages[0]?.[0]?.id).toBe(clientId);

    // 2. Server confirmed message returned by RPC
    const confirmedMsg: ChatMessage = {
      ...optimisticMsg,
      id: 'srv-msg-001', // Real database UUID
      status: 'sent',
    };

    senderCache = appendMessage(senderCache, confirmedMsg);
    const senderTimeline = extractChronologicalMessages(senderCache.pages);

    expect(senderTimeline.length).toBe(1);
    expect(senderTimeline[0]?.id).toBe('srv-msg-001');
    expect(senderTimeline[0]?.status).toBe('sent');

    // 3. Receiver Cache State (Receives Realtime Broadcast from Supabase)
    let receiverCache: InfiniteData = { pages: [[]], pageParams: [undefined] };
    receiverCache = appendMessage(receiverCache, confirmedMsg);

    const receiverTimeline = extractChronologicalMessages(receiverCache.pages);

    expect(receiverTimeline.length).toBe(1);
    expect(receiverTimeline[0]?.id).toBe('srv-msg-001');
    expect(receiverTimeline[0]?.content).toBe(
      'Chào đối tác, đơn hàng #12345 đã sẵn sàng',
    );

    // 4. Verify Presentation Alignment for Receiver
    const receiverGroups = buildMessageGroups(receiverTimeline, RECEIVER_ID, {
      currentUserId: RECEIVER_ID,
      currentUserRole: 'customer',
      partnerName: 'Vĩnh Phát ERP',
    });

    expect(receiverGroups.length).toBe(1);
    const receiverCluster = receiverGroups[0]?.clusters[0];
    expect(receiverCluster?.isMine).toBe(false);
    expect(receiverCluster?.side).toBe('left'); // Incoming message appears on left for receiver
  });

  it('Scenario 2: Full Bidirectional Dialogue Exchange (Sender <-> Receiver)', () => {
    let roomCache: InfiniteData = { pages: [[]], pageParams: [undefined] };

    const msg1FromSender: ChatMessage = {
      id: 'srv-msg-1',
      client_id: 'cli-1',
      tenant_id: 't-1',
      room_id: ROOM_ID,
      sender_id: SENDER_ID,
      sender_name: 'Nhân viên Vinh Phát',
      sender_role: 'staff',
      message_type: 'text',
      content: 'Chào anh, bên em vừa cập nhật tiến độ dệt',
      image_url: null,
      file_url: null,
      file_name: null,
      file_type: null,
      status: 'sent',
      created_at: '2026-09-14T10:01:00.000Z',
      deleted_at: null,
      is_pinned: false,
      pinned_at: null,
      pinned_by: null,
    };

    const msg2FromReceiver: ChatMessage = {
      id: 'srv-msg-2',
      client_id: 'cli-2',
      tenant_id: 't-1',
      room_id: ROOM_ID,
      sender_id: RECEIVER_ID,
      sender_name: 'Khách hàng Khải Hoàn',
      sender_role: 'customer',
      message_type: 'text',
      content: 'Cảm ơn em, khoảng bao giờ giao vải mộc vậy?',
      image_url: null,
      file_url: null,
      file_name: null,
      file_type: null,
      status: 'sent',
      created_at: '2026-09-14T10:02:00.000Z',
      deleted_at: null,
      is_pinned: false,
      pinned_at: null,
      pinned_by: null,
    };

    roomCache = appendMessage(roomCache, msg1FromSender);
    roomCache = appendMessage(roomCache, msg2FromReceiver);

    const timeline = extractChronologicalMessages(roomCache.pages);
    expect(timeline.length).toBe(2);
    expect(timeline[0]?.id).toBe('srv-msg-1');
    expect(timeline[1]?.id).toBe('srv-msg-2');

    // Sender's view (SENDER_ID)
    const senderGroups = buildMessageGroups(timeline, SENDER_ID, {
      currentUserId: SENDER_ID,
      currentUserRole: 'staff',
    });
    expect(senderGroups[0]?.clusters[0]?.isMine).toBe(true);
    expect(senderGroups[0]?.clusters[0]?.side).toBe('right');
    expect(senderGroups[0]?.clusters[1]?.isMine).toBe(false);
    expect(senderGroups[0]?.clusters[1]?.side).toBe('left');

    // Receiver's view (RECEIVER_ID)
    const receiverGroups = buildMessageGroups(timeline, RECEIVER_ID, {
      currentUserId: RECEIVER_ID,
      currentUserRole: 'customer',
    });
    expect(receiverGroups[0]?.clusters[0]?.isMine).toBe(false);
    expect(receiverGroups[0]?.clusters[0]?.side).toBe('left');
    expect(receiverGroups[0]?.clusters[1]?.isMine).toBe(true);
    expect(receiverGroups[0]?.clusters[1]?.side).toBe('right');
  });

  it('Scenario 3: Accidental duplicate broadcast delivery (Idempotent Append Guard)', () => {
    let cache: InfiniteData = { pages: [[]], pageParams: [undefined] };

    const msg: ChatMessage = {
      id: 'srv-msg-dup',
      client_id: 'cli-dup',
      tenant_id: 't-1',
      room_id: ROOM_ID,
      sender_id: SENDER_ID,
      message_type: 'text',
      content: 'Tin nhắn trùng lặp',
      image_url: null,
      file_url: null,
      file_name: null,
      file_type: null,
      status: 'sent',
      created_at: '2026-09-14T10:05:00.000Z',
      deleted_at: null,
      is_pinned: false,
      pinned_at: null,
      pinned_by: null,
    };

    cache = appendMessage(cache, msg);
    // Duplicate broadcast payload received
    cache = appendMessage(cache, msg);
    cache = appendMessage(cache, msg);

    const chronological = extractChronologicalMessages(cache.pages);
    expect(chronological.length).toBe(1);
    expect(chronological[0]?.id).toBe('srv-msg-dup');
  });

  it('Scenario 4: Reconnection Catch-Up Delta Timestamp Resolution', () => {
    const page1: ChatMessage[] = [
      {
        id: 'msg-old',
        client_id: 'c-old',
        tenant_id: 't-1',
        room_id: ROOM_ID,
        sender_id: SENDER_ID,
        message_type: 'text',
        content: 'Tin nhắn 10:00',
        image_url: null,
        file_url: null,
        file_name: null,
        file_type: null,
        status: 'sent',
        created_at: '2026-09-14T10:00:00.000Z',
        deleted_at: null,
        is_pinned: false,
        pinned_at: null,
        pinned_by: null,
      },
      {
        id: 'msg-latest',
        client_id: 'c-latest',
        tenant_id: 't-1',
        room_id: ROOM_ID,
        sender_id: SENDER_ID,
        message_type: 'text',
        content: 'Tin nhắn 10:10',
        image_url: null,
        file_url: null,
        file_name: null,
        file_type: null,
        status: 'sent',
        created_at: '2026-09-14T10:10:00.000Z',
        deleted_at: null,
        is_pinned: false,
        pinned_at: null,
        pinned_by: null,
      },
    ];

    const chronological = extractChronologicalMessages([page1]);
    const latestMsg = chronological[chronological.length - 1];

    expect(latestMsg?.id).toBe('msg-latest');
    expect(latestMsg?.created_at).toBe('2026-09-14T10:10:00.000Z');
  });
});
