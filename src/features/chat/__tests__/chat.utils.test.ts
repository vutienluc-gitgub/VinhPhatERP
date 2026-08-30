import { describe, it, expect } from 'vitest';

import type { ChatMessage } from '@/schema/chat.schema';
import { buildMessageGroups } from '@/features/chat/chat.utils';

describe('chat.utils - buildMessageGroups', () => {
  it('groups messages by date correctly and clusters consecutive messages within 5 minutes', () => {
    const now = new Date();
    const time1 = new Date(now.getTime() - 60000).toISOString();
    const time2 = new Date(now.getTime() - 30000).toISOString();
    const time3 = new Date(now.getTime()).toISOString();

    const mockMessages: ChatMessage[] = [
      {
        id: 'msg-1',
        client_id: 'client-1',
        tenant_id: 'tenant-1',
        room_id: 'room-1',
        sender_id: 'user-1',
        message_type: 'text',
        content: 'Xin chào',
        image_url: null,
        file_url: null,
        file_name: null,
        file_type: null,
        status: 'sent',
        created_at: time1,
        deleted_at: null,
        is_pinned: false,
        pinned_at: null,
        pinned_by: null,
      },
      {
        id: 'msg-2',
        client_id: 'client-2',
        tenant_id: 'tenant-1',
        room_id: 'room-1',
        sender_id: 'user-1',
        message_type: 'text',
        content: 'Tôi muốn hỏi báo giá',
        image_url: null,
        file_url: null,
        file_name: null,
        file_type: null,
        status: 'sent',
        created_at: time2,
        deleted_at: null,
        is_pinned: false,
        pinned_at: null,
        pinned_by: null,
      },
      {
        id: 'msg-3',
        client_id: 'client-3',
        tenant_id: 'tenant-1',
        room_id: 'room-1',
        sender_id: 'user-2',
        message_type: 'text',
        content: 'Dạ chào anh',
        image_url: null,
        file_url: null,
        file_name: null,
        file_type: null,
        status: 'sent',
        created_at: time3,
        deleted_at: null,
        is_pinned: false,
        pinned_at: null,
        pinned_by: null,
      },
    ];

    const groups = buildMessageGroups(mockMessages, 'user-2');
    expect(groups.length).toBe(1);
    const firstGroup = groups[0];
    expect(firstGroup?.label).toBe('Hôm nay');
    expect(firstGroup?.clusters.length).toBe(2);
    // Cluster 1 from user-1 (theirs)
    const cluster1 = firstGroup?.clusters[0];
    expect(cluster1?.isMine).toBe(false);
    expect(cluster1?.messages.length).toBe(2);
    // Cluster 2 from user-2 (mine)
    const cluster2 = firstGroup?.clusters[1];
    expect(cluster2?.isMine).toBe(true);
    expect(cluster2?.messages.length).toBe(1);
  });

  it('correctly handles optimistic pending messages as mine with sending status', () => {
    const now = new Date().toISOString();
    const mockMessages: ChatMessage[] = [
      {
        id: 'opt-client-1',
        client_id: 'opt-client-1',
        tenant_id: 'tenant-1',
        room_id: 'room-1',
        sender_id: 'user-2',
        message_type: 'text',
        content: 'Dạ em đã nhận được thông tin ạ',
        image_url: null,
        file_url: null,
        file_name: null,
        file_type: null,
        status: 'pending',
        created_at: now,
        deleted_at: null,
        is_pinned: false,
        pinned_at: null,
        pinned_by: null,
      },
    ];

    const groups = buildMessageGroups(mockMessages, 'user-2');
    expect(groups.length).toBe(1);
    const cluster = groups[0]?.clusters[0];
    expect(cluster?.isMine).toBe(true);
    expect(cluster?.messages[0]?.status).toBe('sending');
  });
});

describe('chat.schema - getQuickRepliesByRole', () => {
  it('returns customer-oriented quick replies for customer role', async () => {
    const { getQuickRepliesByRole, CUSTOMER_QUICK_REPLIES } =
      await import('@/schema/chat.schema');
    const replies = getQuickRepliesByRole('customer');
    expect(replies).toEqual(CUSTOMER_QUICK_REPLIES);
    expect(replies[0]).toBe('Kiểm tra tiến độ đơn hàng giúp tôi');
  });

  it('returns driver-oriented quick replies for driver role', async () => {
    const { getQuickRepliesByRole, DRIVER_QUICK_REPLIES } =
      await import('@/schema/chat.schema');
    const replies = getQuickRepliesByRole('driver');
    expect(replies).toEqual(DRIVER_QUICK_REPLIES);
    expect(replies[0]).toBe('Tôi đã nhận hàng và đang bắt đầu giao');
  });

  it('returns staff CSKH quick replies for internal staff/admin/manager role', async () => {
    const { getQuickRepliesByRole, STAFF_QUICK_REPLIES } =
      await import('@/schema/chat.schema');
    expect(getQuickRepliesByRole('admin')).toEqual(STAFF_QUICK_REPLIES);
    expect(getQuickRepliesByRole('staff')).toEqual(STAFF_QUICK_REPLIES);
    expect(getQuickRepliesByRole(null)).toEqual(STAFF_QUICK_REPLIES);
  });
});

describe('chat.utils - extractChronologicalMessages', () => {
  it('unwraps array of pages (newest-first per page) to chronological list (oldest-first)', async () => {
    const { extractChronologicalMessages } =
      await import('@/features/chat/chat.utils');
    const page1 = [
      { id: 'm2', created_at: '2026-08-30T10:02:00Z' } as ChatMessage,
      { id: 'm1', created_at: '2026-08-30T10:01:00Z' } as ChatMessage,
    ];
    const page2 = [
      { id: 'm4', created_at: '2026-08-30T10:04:00Z' } as ChatMessage,
      { id: 'm3', created_at: '2026-08-30T10:03:00Z' } as ChatMessage,
    ];

    // pages is [page2 (newer), page1 (older)]
    const result = extractChronologicalMessages([page2, page1]);
    expect(result.map((m) => m.id)).toEqual(['m1', 'm2', 'm3', 'm4']);
  });

  it('safely handles envelope objects and malformed pages without throwing', async () => {
    const { extractChronologicalMessages } =
      await import('@/features/chat/chat.utils');
    expect(extractChronologicalMessages(null)).toEqual([]);
    expect(extractChronologicalMessages(undefined)).toEqual([]);
    expect(extractChronologicalMessages({})).toEqual([]);
    expect(extractChronologicalMessages({ pages: [{ id: 'm1' }] })).toEqual([
      { id: 'm1' },
    ]);
  });
});
