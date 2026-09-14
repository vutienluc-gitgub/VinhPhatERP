import { describe, it, expect } from 'vitest';

import { resolveMessageSide } from '@/domain/chat';
import { buildMessageGroups } from '@/features/chat/chat.utils';
import type { ChatMessage } from '@/schema/chat.schema';

describe('BUG REPRODUCTION: Chat Message Identity & Alignment across Viewers', () => {
  it('reproduces failure: when Staff A views a message sent by Staff B on Admin Portal, it MUST align LEFT (currently fails because it returns right)', () => {
    // Staff A is viewer (internal perspective).
    // Message is from Staff B (party: internal, but isSelfSender: false).
    // The requirement: side MUST be 'left', isMine MUST be false.
    const side = resolveMessageSide('internal', 'internal', false);
    expect(side).toBe('left'); // WILL FAIL on current code because it returns 'right'
  });

  it('reproduces failure: buildMessageGroups for Staff A viewing Staff B message MUST have isMine=false and senderName!=Tôi', () => {
    const staffBMessage: ChatMessage = {
      id: 'msg-staff-b',
      client_id: 'client-staff-b',
      tenant_id: 'tenant-1',
      room_id: 'room-1',
      sender_id: 'user-staff-b',
      sender_name: 'Nguyễn Văn B',
      sender_role: 'staff',
      message_type: 'text',
      content: 'Báo giá đã được duyệt nhé',
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
    };

    // Viewer is Staff A (user-staff-a) on internal Admin Portal
    const groups = buildMessageGroups([staffBMessage], 'user-staff-a', {
      currentUserId: 'user-staff-a',
      currentUserRole: 'staff',
      partnerName: 'Vinh Phat',
    });

    const cluster = groups[0]?.clusters[0];

    // Under the architectural constraint:
    // Staff B's message seen by Staff A MUST NOT be isMine
    expect(cluster?.isMine).toBe(false); // WILL FAIL on current code because it evaluates to true
    expect(cluster?.side).toBe('left'); // WILL FAIL on current code because it returns 'right'
    expect(cluster?.senderName).toBe('Nguyễn Văn B'); // WILL FAIL on current code because it returns 'Tôi'
  });
});
