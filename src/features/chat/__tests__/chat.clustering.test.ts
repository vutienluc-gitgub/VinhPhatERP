import { describe, it, expect } from 'vitest';

import type { ChatMessage } from '@/schema/chat.schema';
import {
  buildMessageGroups,
  MESSAGE_CLUSTER_GAP_MS,
  MESSAGE_CLUSTER_MAX_DURATION_MS,
  formatFullAuditTime,
} from '@/features/chat/chat.utils';

function createMockMsg(
  id: string,
  createdAt: string,
  senderId = 'user-1',
  role = 'admin',
  content = 'Hello',
): ChatMessage {
  return {
    id,
    client_id: `client-${id}`,
    tenant_id: 'tenant-1',
    room_id: 'room-1',
    sender_id: senderId,
    sender_role: role,
    sender_name: 'Nguyen Van A',
    content,
    message_type: 'text',
    image_url: null,
    file_url: null,
    file_name: null,
    file_type: null,
    status: 'sent',
    created_at: createdAt,
    deleted_at: null,
    is_pinned: false,
    pinned_at: null,
    pinned_by: null,
  };
}

describe('Chat Message Clustering & Bounded Window Algorithm', () => {
  it('CASE 01: clusters consecutive messages under 5m from same sender and assigns correct positions', () => {
    const msgs: ChatMessage[] = [
      createMockMsg('1', '2026-09-02T10:00:00Z', 'user-1', 'admin', '31'),
      createMockMsg('2', '2026-09-02T10:01:00Z', 'user-1', 'admin', '32'),
      createMockMsg('3', '2026-09-02T10:02:00Z', 'user-1', 'admin', '33'),
    ];

    const groups = buildMessageGroups(msgs, 'user-1');
    expect(groups).toHaveLength(1);
    const clusters = groups[0]?.clusters ?? [];
    expect(clusters).toHaveLength(1);
    const clusterMsgs = clusters[0]?.messages ?? [];
    expect(clusterMsgs).toHaveLength(3);

    expect(clusterMsgs[0]?.position).toBe('first');
    expect(clusterMsgs[1]?.position).toBe('middle');
    expect(clusterMsgs[2]?.position).toBe('last');
  });

  it('CASE 02: clusters same-minute burst messages into single cluster with correct positions', () => {
    const msgs: ChatMessage[] = [
      createMockMsg('1', '2026-09-02T10:00:00Z', 'user-1', 'admin', 'A'),
      createMockMsg('2', '2026-09-02T10:00:30Z', 'user-1', 'admin', 'B'),
      createMockMsg('3', '2026-09-02T10:01:00Z', 'user-1', 'admin', 'C'),
    ];

    const groups = buildMessageGroups(msgs, 'user-1');
    const clusters = groups[0]?.clusters ?? [];
    expect(clusters).toHaveLength(1);
    const clusterMsgs = clusters[0]?.messages ?? [];
    expect(clusterMsgs).toHaveLength(3);
    expect(clusterMsgs[0]?.position).toBe('first');
    expect(clusterMsgs[1]?.position).toBe('middle');
    expect(clusterMsgs[2]?.position).toBe('last');
  });

  it('CASE 03: splits cluster when max duration exceeds 5m (Bounded Window vs Sliding Window)', () => {
    const msgs: ChatMessage[] = [
      createMockMsg('1', '2026-09-02T10:00:00Z', 'user-1', 'admin', 'A'),
      createMockMsg('2', '2026-09-02T10:04:00Z', 'user-1', 'admin', 'B'), // gap = 4m <= 5m, duration = 4m <= 5m -> same cluster
      createMockMsg('3', '2026-09-02T10:08:00Z', 'user-1', 'admin', 'C'), // gap = 4m <= 5m, BUT duration = 8m > 5m -> NEW cluster!
    ];

    const groups = buildMessageGroups(msgs, 'user-1');
    const clusters = groups[0]?.clusters ?? [];
    expect(clusters).toHaveLength(2);
    const cluster1Msgs = clusters[0]?.messages ?? [];
    const cluster2Msgs = clusters[1]?.messages ?? [];
    expect(cluster1Msgs).toHaveLength(2);
    expect(cluster2Msgs).toHaveLength(1);

    expect(cluster1Msgs[0]?.position).toBe('first');
    expect(cluster1Msgs[1]?.position).toBe('last');
    expect(cluster2Msgs[0]?.position).toBe('single');
  });

  it('Boundary Tests: 00:00:00 -> 00:04:59 (same), 00:00:00 -> 00:05:00 (same boundary), 00:00:00 -> 00:05:01 (split)', () => {
    // 1. Within 4m59s
    const msgsWithin = [
      createMockMsg('1', '2026-09-02T00:00:00.000Z'),
      createMockMsg('2', '2026-09-02T00:04:59.000Z'),
    ];
    expect(buildMessageGroups(msgsWithin, 'user-1')[0]?.clusters).toHaveLength(
      1,
    );

    // 2. Exact boundary 5m00s
    const msgsBoundary = [
      createMockMsg('1', '2026-09-02T00:00:00.000Z'),
      createMockMsg('2', '2026-09-02T00:05:00.000Z'),
    ];
    expect(
      buildMessageGroups(msgsBoundary, 'user-1')[0]?.clusters,
    ).toHaveLength(1);

    // 3. Exceeded by 1ms
    const msgsExceeded = [
      createMockMsg('1', '2026-09-02T00:00:00.000Z'),
      createMockMsg('2', '2026-09-02T00:05:00.001Z'),
    ];
    expect(
      buildMessageGroups(msgsExceeded, 'user-1')[0]?.clusters,
    ).toHaveLength(2);
  });

  it('CASE 04: different senders never join the same cluster', () => {
    const msgs: ChatMessage[] = [
      createMockMsg(
        '1',
        '2026-09-02T10:00:00Z',
        'user-1',
        'admin',
        'Hello from admin',
      ),
      createMockMsg(
        '2',
        '2026-09-02T10:01:00Z',
        'user-2',
        'customer',
        'Hello from customer',
      ),
    ];

    const groups = buildMessageGroups(msgs, 'user-1');
    const clusters = groups[0]?.clusters ?? [];
    expect(clusters).toHaveLength(2);
    expect(clusters[0]?.side).toBe('right');
    expect(clusters[1]?.side).toBe('left');
  });

  it('formatFullAuditTime formats ISO string into full Vietnamese date-time with seconds', () => {
    const formatted = formatFullAuditTime('2026-09-02T19:12:43.000Z');
    expect(formatted).toBeTruthy();
    expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it('Constants are set to exactly 5 minutes', () => {
    expect(MESSAGE_CLUSTER_GAP_MS).toBe(5 * 60 * 1000);
    expect(MESSAGE_CLUSTER_MAX_DURATION_MS).toBe(5 * 60 * 1000);
  });
});
