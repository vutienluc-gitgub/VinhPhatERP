import type { ChatMessage } from '@/schema/chat.schema';
import {
  resolveParticipantParty,
  resolveMessageSide,
  type ChatParticipantParty,
  type ChatMessageSide,
} from '@/domain/chat';
import type {
  ChatMessageViewModel,
  ChatRoomContext,
  DateMessageGroup,
  MessageCluster,
  MessagePosition,
  MessageStatus,
} from '@/features/chat/chat.types';

function formatDateLabel(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isSameDay = (a: Date, b: Date) =>
      a.getDate() === b.getDate() &&
      a.getMonth() === b.getMonth() &&
      a.getFullYear() === b.getFullYear();

    if (isSameDay(date, today)) return 'Hôm nay';
    if (isSameDay(date, yesterday)) return 'Hôm qua';

    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    return 'Hôm nay';
  }
}

export function formatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

export function isEmojiOnly(content?: string | null): boolean {
  if (!content) return false;
  const trimmed = content.trim();
  if (!trimmed) return false;
  // Matches 1-3 emojis without standard alphanumeric text
  const emojiRegex =
    /^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|\s)+$/u;
  if (!emojiRegex.test(trimmed)) return false;
  const codePoints = Array.from(trimmed).filter((c) => c.trim().length > 0);
  return codePoints.length >= 1 && codePoints.length <= 4;
}

export function deriveMessageStatus(
  msg: ChatMessage,
  isMine: boolean,
): MessageStatus {
  if (msg.status === 'error') return 'failed';
  if (msg.status === 'pending') return 'sending';
  if (isMine && msg.read_at) return 'read';
  return 'sent';
}

function extractInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  const pLen = parts.length;
  if (pLen >= 2) {
    const p1 = parts[pLen - 2];
    const p2 = parts[pLen - 1];
    if (p1 && p2 && p1[0] && p2[0]) {
      return (p1[0] + p2[0]).toUpperCase();
    }
  } else if (pLen === 1) {
    const p0 = parts[0];
    if (p0) {
      return p0.length >= 2
        ? p0.substring(0, 2).toUpperCase()
        : p0.toUpperCase();
    }
  }
  return 'VP';
}

/**
 * Single Source of Truth for resolving sender name and initials.
 * Avoids uncontrolled 'U' or generic 'Người dùng' fallbacks.
 */
export function resolveSenderIdentity(
  senderNameRaw?: string | null,
  isMine?: boolean,
  context?: {
    partnerName?: string;
    isCustomerPortal?: boolean;
    senderRole?: string | null;
  },
): { name: string; initials: string } {
  if (isMine) {
    return { name: 'Bạn', initials: 'ME' };
  }

  // 1. If explicit sender name exists and isn't generic placeholder
  let cleanName = senderNameRaw?.trim();

  // 2. If cleanName is missing or generic, resolve based on portal context & role
  if (!cleanName || cleanName === 'Người dùng' || cleanName === 'Thành viên') {
    if (context?.isCustomerPortal) {
      // In customer portal, inbound messages from admin/factory
      cleanName = 'Xưởng Vĩnh Phát';
    } else if (context?.partnerName) {
      // In admin portal, inbound messages from customer/partner
      cleanName = context.partnerName.trim();
    } else if (
      context?.senderRole === 'admin' ||
      context?.senderRole === 'manager'
    ) {
      cleanName = 'Xưởng Vĩnh Phát';
    } else {
      cleanName = 'Khách hàng';
    }
  }

  const initials = extractInitials(cleanName);

  return { name: cleanName, initials };
}

/**
 * Transforms raw messages into structured DateMessageGroups and MessageClusters
 * with intelligent Admin vs Customer side alignment and derived ChatMessageViewModel.
 */
export function buildMessageGroups(
  chronologicalMessages: ChatMessage[],
  currentUserId?: string,
  context?: ChatRoomContext,
): DateMessageGroup[] {
  const groups: DateMessageGroup[] = [];

  let currentGroup: DateMessageGroup | null = null;
  let currentRawCluster: {
    id: string;
    senderId: string | null;
    senderNameRaw?: string | null;
    senderRole?: string | null;
    party: ChatParticipantParty;
    side: ChatMessageSide;
    isMine: boolean;
    timestamp: string;
    rawMessages: ChatMessage[];
  } | null = null;

  const CLUSTER_TIME_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes configurable threshold
  const isCustomerPortal = context?.currentUserRole === 'customer';

  const flushCluster = () => {
    if (!currentRawCluster || !currentGroup) return;

    const {
      rawMessages,
      senderId,
      senderNameRaw,
      senderRole,
      party,
      side,
      isMine,
      timestamp,
      id,
    } = currentRawCluster;
    const count = rawMessages.length;
    const identity = resolveSenderIdentity(senderNameRaw, isMine, {
      partnerName: context?.partnerName,
      isCustomerPortal,
      senderRole,
    });

    const viewModels: ChatMessageViewModel[] = rawMessages.map((msg, index) => {
      let position: MessagePosition = 'single';
      if (count > 1) {
        if (index === 0) position = 'first';
        else if (index === count - 1) position = 'last';
        else position = 'middle';
      }

      return {
        message: msg,
        position,
        senderId,
        senderName: identity.name,
        senderInitials: identity.initials,
        party,
        side,
        isMine,
        timeFormatted: formatTime(msg.created_at),
        status: deriveMessageStatus(msg, isMine),
        isEmojiOnly: isEmojiOnly(msg.content),
      };
    });

    const cluster: MessageCluster = {
      id,
      senderId,
      senderName: identity.name,
      senderInitials: identity.initials,
      party,
      side,
      isMine,
      timestamp,
      messages: viewModels,
    };

    currentGroup.clusters.push(cluster);
    currentRawCluster = null;
  };

  for (const msg of chronologicalMessages) {
    const dateLabel = formatDateLabel(msg.created_at);
    const dateKey = msg.created_at.split('T')[0] ?? '';

    const isDirectSender = Boolean(
      (currentUserId && msg.sender_id === currentUserId) ||
      (!msg.sender_id && msg.status === 'pending'),
    );

    const party = resolveParticipantParty(msg.sender_role);
    const perspective = isCustomerPortal ? 'external' : 'internal';
    const side = resolveMessageSide(party, perspective, isDirectSender);
    const isMine = side === 'right';

    const msgTime = new Date(msg.created_at).getTime();

    // 1. Date Group boundary
    if (!currentGroup || currentGroup.date !== dateKey) {
      flushCluster();
      currentGroup = {
        date: dateKey,
        label: dateLabel,
        clusters: [],
      };
      groups.push(currentGroup);
    }

    // 2. System message boundary
    if (msg.message_type === 'system' || msg.message_type === 'system_epod') {
      flushCluster();
      const systemCluster: MessageCluster = {
        id: `sys-${msg.id}`,
        senderId: null,
        senderName: 'Hệ thống',
        senderInitials: 'HT',
        party: 'internal',
        side: 'left',
        isMine: false,
        timestamp: msg.created_at,
        messages: [
          {
            message: msg,
            position: 'single',
            senderId: null,
            senderName: 'Hệ thống',
            senderInitials: 'HT',
            party: 'internal',
            side: 'left',
            isMine: false,
            timeFormatted: formatTime(msg.created_at),
            status: 'sent',
          },
        ],
      };
      currentGroup.clusters.push(systemCluster);
      continue;
    }

    // 3. Cluster grouping (same sender AND same alignment side)
    const canCluster =
      currentRawCluster &&
      currentRawCluster.senderId === msg.sender_id &&
      currentRawCluster.side === side &&
      msgTime - new Date(currentRawCluster.timestamp).getTime() <=
        CLUSTER_TIME_THRESHOLD_MS;

    if (canCluster && currentRawCluster) {
      currentRawCluster.rawMessages.push(msg);
      currentRawCluster.timestamp = msg.created_at;
      if (!currentRawCluster.senderNameRaw && msg.sender_name) {
        currentRawCluster.senderNameRaw = msg.sender_name;
      }
      if (!currentRawCluster.senderRole && msg.sender_role) {
        currentRawCluster.senderRole = msg.sender_role;
      }
    } else {
      flushCluster();
      currentRawCluster = {
        id: `cluster-${msg.id}`,
        senderId: msg.sender_id,
        senderNameRaw: msg.sender_name,
        senderRole: msg.sender_role,
        party,
        side,
        isMine,
        timestamp: msg.created_at,
        rawMessages: [msg],
      };
    }
  }

  flushCluster();

  return groups;
}
