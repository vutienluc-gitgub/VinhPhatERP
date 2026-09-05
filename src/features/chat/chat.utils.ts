import type { ChatMessage } from '@/schema/chat.schema';
import {
  resolveParticipantParty,
  resolveMessageSide,
  type ChatParticipantParty,
  type ChatMessageSide,
  type ChatTimelineState,
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

export function formatFullAuditTime(iso: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(d);
  } catch {
    return iso;
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
  options?: {
    partnerName?: string;
    isCustomerPortal?: boolean;
    senderRole?: string | null;
  },
): { name: string; initials: string } {
  if (isMine) {
    return { name: 'Tôi', initials: 'ME' };
  }

  const raw = senderNameRaw?.trim();
  if (raw && raw !== 'Người dùng' && raw !== 'User' && raw !== 'U') {
    return {
      name: raw,
      initials: extractInitials(raw),
    };
  }

  const role = options?.senderRole;
  if (role === 'customer' && options?.partnerName) {
    return {
      name: options.partnerName,
      initials: extractInitials(options.partnerName),
    };
  }

  if (role === 'customer') {
    return { name: 'Khách hàng', initials: 'KH' };
  }
  if (role === 'driver') {
    return { name: 'Tài xế giao hàng', initials: 'TX' };
  }
  if (role === 'admin' || role === 'manager' || role === 'staff') {
    return { name: 'Nhân viên Vinh Phát', initials: 'VP' };
  }

  if (options?.isCustomerPortal) {
    return { name: 'Vinh Phát ERP', initials: 'VP' };
  }

  return { name: 'Thành viên', initials: 'TV' };
}

export const MESSAGE_CLUSTER_GAP_MS = 5 * 60 * 1000; // 5 minutes max gap between messages
export const MESSAGE_CLUSTER_MAX_DURATION_MS = 5 * 60 * 1000; // 5 minutes max total duration from first message

/**
 * Transforms raw messages into structured DateMessageGroups and MessageClusters
 * with intelligent Admin vs Customer side alignment and derived ChatMessageViewModel.
 */
// Cache for immutable past date groups (bounded to 100 date groups)
const pastDateGroupCache = new Map<string, DateMessageGroup>();

function clusterSingleDate(
  dateKey: string,
  dateLabel: string,
  messages: ChatMessage[],
  currentUserId?: string,
  context?: ChatRoomContext,
): DateMessageGroup {
  const isCustomerPortal = context?.currentUserRole === 'customer';
  const group: DateMessageGroup = {
    date: dateKey,
    label: dateLabel,
    clusters: [],
  };

  let currentRawCluster: {
    id: string;
    senderId: string | null;
    senderNameRaw?: string | null;
    senderRole?: string | null;
    party: ChatParticipantParty;
    side: ChatMessageSide;
    isMine: boolean;
    startTime: number;
    lastTime: number;
    rawMessages: ChatMessage[];
  } | null = null;

  const flushCluster = () => {
    if (!currentRawCluster) return;

    const {
      rawMessages,
      senderId,
      senderNameRaw,
      senderRole,
      party,
      side,
      isMine,
      lastTime,
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
      timestamp: new Date(lastTime).toISOString(),
      messages: viewModels,
    };

    group.clusters.push(cluster);
    currentRawCluster = null;
  };

  for (const msg of messages) {
    const isDirectSender = Boolean(
      (currentUserId && msg.sender_id === currentUserId) ||
      (!msg.sender_id && msg.status === 'pending'),
    );

    const party = resolveParticipantParty(msg.sender_role);
    const perspective = isCustomerPortal ? 'external' : 'internal';
    const side = resolveMessageSide(party, perspective, isDirectSender);
    const isMine = side === 'right';

    const msgTime = new Date(msg.created_at).getTime();

    // System message boundary
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
      group.clusters.push(systemCluster);
      continue;
    }

    // Cluster grouping
    const canCluster =
      currentRawCluster &&
      currentRawCluster.senderId === msg.sender_id &&
      currentRawCluster.side === side &&
      msgTime - currentRawCluster.lastTime <= MESSAGE_CLUSTER_GAP_MS &&
      msgTime - currentRawCluster.startTime <= MESSAGE_CLUSTER_MAX_DURATION_MS;

    if (canCluster && currentRawCluster) {
      currentRawCluster.rawMessages.push(msg);
      currentRawCluster.lastTime = msgTime;
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
        startTime: msgTime,
        lastTime: msgTime,
        rawMessages: [msg],
      };
    }
  }

  flushCluster();
  return group;
}

/**
 * Transforms raw messages into structured DateMessageGroups and MessageClusters
 * with intelligent Admin vs Customer side alignment, derived ChatMessageViewModel,
 * and incremental caching for immutable past date groups.
 */
export function buildMessageGroups(
  chronologicalMessages: ChatMessage[],
  currentUserId?: string,
  context?: ChatRoomContext,
): DateMessageGroup[] {
  if (!chronologicalMessages || chronologicalMessages.length === 0) {
    return [];
  }

  // 1. Group messages by dateKey (preserving chronological order)
  const dateBuckets = new Map<
    string,
    { dateLabel: string; msgs: ChatMessage[] }
  >();
  for (const msg of chronologicalMessages) {
    const dateKey = msg.created_at.split('T')[0] ?? '';
    let bucket = dateBuckets.get(dateKey);
    if (!bucket) {
      bucket = {
        dateLabel: formatDateLabel(msg.created_at),
        msgs: [],
      };
      dateBuckets.set(dateKey, bucket);
    }
    bucket.msgs.push(msg);
  }

  const dateKeys = Array.from(dateBuckets.keys());
  const lastDateKey = dateKeys[dateKeys.length - 1];
  const groups: DateMessageGroup[] = [];

  // 2. Process each date group (cache past dates, re-compute active latest date)
  for (const dateKey of dateKeys) {
    const bucket = dateBuckets.get(dateKey);
    if (!bucket) continue;

    const isPastDate = dateKey !== lastDateKey;
    if (isPastDate) {
      const firstMsg = bucket.msgs[0];
      const lastMsg = bucket.msgs[bucket.msgs.length - 1];
      const cacheKey = `${dateKey}:${currentUserId ?? ''}:${context?.currentUserRole ?? ''}:${context?.partnerName ?? ''}:${firstMsg?.id ?? ''}:${lastMsg?.id ?? ''}:${bucket.msgs.length}`;

      const cached = pastDateGroupCache.get(cacheKey);
      if (cached) {
        groups.push(cached);
        continue;
      }

      const computed = clusterSingleDate(
        dateKey,
        bucket.dateLabel,
        bucket.msgs,
        currentUserId,
        context,
      );

      if (pastDateGroupCache.size > 200) {
        pastDateGroupCache.clear();
      }
      pastDateGroupCache.set(cacheKey, computed);
      groups.push(computed);
    } else {
      // Latest active date: compute dynamically
      groups.push(
        clusterSingleDate(
          dateKey,
          bucket.dateLabel,
          bucket.msgs,
          currentUserId,
          context,
        ),
      );
    }
  }

  return groups;
}

/**
 * Extract and normalize raw paginated messages or timelineState into a chronological list (oldest-first).
 */
export function extractChronologicalMessages(
  pages: unknown,
  timelineState?: ChatTimelineState,
): ChatMessage[] {
  if (timelineState && timelineState.status === 'ready') {
    return timelineState.messages;
  }

  const rawPages: unknown = Array.isArray(pages)
    ? pages
    : pages &&
        typeof pages === 'object' &&
        'pages' in pages &&
        Array.isArray((pages as { pages: unknown }).pages)
      ? (pages as { pages: unknown[] }).pages
      : [];

  if (!Array.isArray(rawPages) || rawPages.length === 0) return [];

  const unrolled = [...rawPages].reverse().flatMap((page) => {
    if (Array.isArray(page)) {
      return page;
    }
    if (
      page &&
      typeof page === 'object' &&
      'messages' in page &&
      Array.isArray((page as { messages: unknown }).messages)
    ) {
      return (page as { messages: ChatMessage[] }).messages;
    }
    if (page && typeof page === 'object' && 'id' in page) {
      return [page as unknown as ChatMessage];
    }
    return [];
  });

  return unrolled.sort((a, b) => {
    const timeA = new Date(a.created_at || 0).getTime();
    const timeB = new Date(b.created_at || 0).getTime();
    return timeA - timeB;
  });
}

/**
 * Entity Display Resolver (GOV-002)
 * Pure domain resolver to ensure every supported entity_type resolves correctly
 * without unexpected fallback.
 */
export function resolveEntityDisplayMetadata(
  entityType: string,
  record?: {
    name?: string | null;
    code?: string | null;
    shipment_number?: string | null;
    order_number?: string | null;
    work_order_number?: string | null;
    receipt_number?: string | null;
    roll_number?: string | null;
  } | null,
): { displayName: string; displayCode: string } {
  if (!record) {
    return {
      displayName: `Phòng ${entityType}`,
      displayCode: '',
    };
  }

  switch (entityType) {
    case 'customer':
      return {
        displayName: record.name || 'Khách hàng',
        displayCode: record.code || '',
      };
    case 'shipment':
      return {
        displayName: `Lô hàng ${record.shipment_number || ''}`.trim(),
        displayCode: record.shipment_number || '',
      };
    case 'order':
      return {
        displayName: `Đơn hàng ${record.order_number || ''}`.trim(),
        displayCode: record.order_number || '',
      };
    case 'work_order':
      return {
        displayName: `Lệnh SX ${record.work_order_number || ''}`.trim(),
        displayCode: record.work_order_number || '',
      };
    case 'yarn_receipt':
      return {
        displayName: `Phiếu nhập sợi ${record.receipt_number || ''}`.trim(),
        displayCode: record.receipt_number || '',
      };
    case 'raw_fabric':
      return {
        displayName: `Cuộn mộc ${record.roll_number || ''}`.trim(),
        displayCode: record.roll_number || '',
      };
    default:
      return {
        displayName: `Phòng ${entityType}`,
        displayCode: '',
      };
  }
}
