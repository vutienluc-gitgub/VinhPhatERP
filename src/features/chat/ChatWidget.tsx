import { useEffect, useMemo, useState } from 'react';

import { useChatRoom, useUnreadCount, useMarkAsRead } from '@/application/chat';
import { ChatDrawer } from '@/features/chat/ChatDrawer';
import { CHAT_LABELS } from '@/schema/chat.schema';

interface ChatWidgetProps {
  entityType: string;
  entityId: string;
  title?: string;
  subtitle?: string;
}

/**
 * Floating chat button (bottom-right corner).
 * Auto-fetches unread count via useUnreadCount.
 * Click to toggle the ChatDrawer.
 */
export function ChatWidget({
  entityType,
  entityId,
  title,
  subtitle,
}: ChatWidgetProps) {
  const [open, setOpen] = useState(false);

  // Fetch room to get roomId for unread count
  const { data: room } = useChatRoom(entityType, entityId);
  const roomId = room?.id;

  // Unread count
  const { data: unreadCount = 0 } = useUnreadCount(roomId);
  const markAsRead = useMarkAsRead(roomId);

  // Mark as read when opening
  useEffect(() => {
    if (open && roomId) {
      markAsRead();
    }
  }, [open, roomId, markAsRead]);

  // Expose open room ID for global notification filtering
  const openRoomIds = useMemo(
    () => (open && roomId ? new Set([roomId]) : new Set<string>()),
    [open, roomId],
  );
  // Note: openRoomIds can be passed to useChatNotifications in a parent layout
  void openRoomIds;

  return (
    <>
      {/* Floating Action Button */}
      <button
        type="button"
        className="chat-widget-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? CHAT_LABELS.CLOSE_CHAT : CHAT_LABELS.OPEN_CHAT}
      >
        {open ? (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}

        {/* Unread badge */}
        {!open && unreadCount > 0 ? (
          <span className="chat-widget-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      {/* Drawer */}
      <ChatDrawer
        open={open}
        onClose={() => setOpen(false)}
        entityType={entityType}
        entityId={entityId}
        title={title}
        subtitle={subtitle}
      />
    </>
  );
}
