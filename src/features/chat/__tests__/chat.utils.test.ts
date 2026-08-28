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
});
