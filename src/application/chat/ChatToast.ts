import { createElement } from 'react';
import toast from 'react-hot-toast';

import { Icon } from '@/shared/components/Icon';
import { type ChatMessage } from '@/schema/chat.schema';
import { CHAT_TOAST_LABELS } from '@/shared/constants/notifications';
import { supabase } from '@/services/supabase/client';
import { chatNavigationStore } from '@/features/chat/controllers/chatNavigationStore';

const GROUPING_WINDOW_MS = 3000;
const TOAST_DURATION_MS = 5000;
const MAX_BODY_LENGTH = 80;

// ── Pending message buffer for smart grouping ──

interface PendingMessage {
  senderName: string;
  content: string;
  roomId: string;
  messageType: string;
}

const pendingMessages = new Map<string, PendingMessage[]>();
const pendingTimers = new Map<string, ReturnType<typeof setTimeout>>();
const userProfileCache = new Map<string, string>();

// ── Helpers ──

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0] ?? '';
  const last = parts[parts.length - 1] ?? '';
  if (parts.length === 1) return first.charAt(0).toUpperCase();
  return (first.charAt(0) + last.charAt(0)).toUpperCase();
}

function formatBody(msg: ChatMessage): string {
  if (msg.message_type === 'image') return CHAT_TOAST_LABELS.NEW_IMAGE;
  if (msg.message_type === 'file') return CHAT_TOAST_LABELS.NEW_FILE;
  const raw = msg.content || '';
  return raw.length > MAX_BODY_LENGTH
    ? `${raw.substring(0, MAX_BODY_LENGTH)}...`
    : raw;
}

async function resolveSenderName(senderId: string | null): Promise<string> {
  if (!senderId) return CHAT_TOAST_LABELS.SENDER_DEFAULT;
  const cached = userProfileCache.get(senderId);
  if (cached) return cached;

  try {
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', senderId)
      .maybeSingle();

    const name = data?.full_name || CHAT_TOAST_LABELS.SENDER_UNKNOWN;
    userProfileCache.set(senderId, name);
    return name;
  } catch {
    return CHAT_TOAST_LABELS.SENDER_UNKNOWN;
  }
}

// ── Rich Toast Renderer ──

function renderRichToast(
  senderName: string,
  body: string,
  count: number,
  roomId: string,
  toastId: string,
) {
  const initials = getInitials(senderName);
  const displayBody =
    count > 1 ? `${count} ${CHAT_TOAST_LABELS.GROUP_SUFFIX}` : body;

  return createElement(
    'div',
    {
      className: 'chat-toast-rich',
      onClick: () => {
        toast.dismiss(toastId);
        chatNavigationStore.openChatByRoomId(roomId, undefined, 'notification');
      },
      role: 'button',
      tabIndex: 0,
      'aria-label': `${senderName}: ${displayBody}`,
    },
    // Avatar
    createElement('div', { className: 'chat-toast-avatar' }, initials),
    // Text content
    createElement(
      'div',
      { className: 'chat-toast-content' },
      createElement('div', { className: 'chat-toast-sender' }, senderName),
      createElement('div', { className: 'chat-toast-body' }, displayBody),
    ),
    // Chevron
    createElement(Icon, {
      name: 'ChevronRight',
      size: 16,
      className: 'chat-toast-chevron',
    }),
  );
}

function flushGroup(groupKey: string): void {
  const messages = pendingMessages.get(groupKey);
  if (!messages || messages.length === 0) return;

  const first = messages[0];
  if (!first) return;
  const count = messages.length;
  const toastId = `chat-${groupKey}`;

  // Dismiss previous toast for this conversation to prevent stacking
  toast.dismiss(toastId);

  toast.custom(
    (t) =>
      renderRichToast(
        first.senderName,
        first.content,
        count,
        first.roomId,
        t.id,
      ),
    {
      id: toastId,
      duration: TOAST_DURATION_MS,
    },
  );

  // Clear buffer
  pendingMessages.delete(groupKey);
  pendingTimers.delete(groupKey);
}

// ── Public API ──

/**
 * Shows a rich, interactive chat toast with smart grouping.
 * Multiple messages from the same sender within GROUPING_WINDOW_MS
 * are batched into a single toast showing the count.
 */
export async function showChatToast(msg: ChatMessage): Promise<void> {
  const senderName =
    msg.sender_name || (await resolveSenderName(msg.sender_id));
  const body = formatBody(msg);
  const roomId = msg.room_id;
  const groupKey = `${roomId}::${msg.sender_id ?? 'unknown'}`;

  // Buffer the message
  if (!pendingMessages.has(groupKey)) {
    pendingMessages.set(groupKey, []);
  }
  pendingMessages.get(groupKey)!.push({
    senderName,
    content: body,
    roomId,
    messageType: msg.message_type,
  });

  // Clear existing timer for this group
  const existingTimer = pendingTimers.get(groupKey);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  // If this is the first message in the group, show immediately
  const messages = pendingMessages.get(groupKey)!;
  if (messages.length === 1) {
    flushGroup(groupKey);
    return;
  }

  // Otherwise debounce: wait for more messages or flush after window
  pendingTimers.set(
    groupKey,
    setTimeout(() => flushGroup(groupKey), GROUPING_WINDOW_MS),
  );
}
