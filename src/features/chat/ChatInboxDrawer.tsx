import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchCustomerChatRooms,
  type CustomerChatRoomSummary,
} from '@/api/chat.api';
import { useUnreadCount } from '@/application/chat';

import { ChatDrawer } from './ChatDrawer';

function formatRelative(iso: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'vừa xong';
  if (mins < 60) return `${mins} phút`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ`;
  const days = Math.floor(hours / 24);
  return `${days} ngày`;
}

function RoomRow({
  room,
  onClick,
}: {
  room: CustomerChatRoomSummary;
  onClick: () => void;
}) {
  const { data: unread = 0 } = useUnreadCount(room.roomId);
  const initials = room.customerName
    .split(' ')
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <button type="button" className="chat-inbox-row" onClick={onClick}>
      <div className="chat-inbox-avatar">{initials}</div>
      <div className="chat-inbox-body">
        <div className="chat-inbox-row-header">
          <span className="chat-inbox-name">{room.customerName}</span>
          <span className="chat-inbox-time">
            {formatRelative(room.lastMessageAt)}
          </span>
        </div>
        <div className="chat-inbox-row-footer">
          <span className="chat-inbox-preview">
            {room.lastMessage ?? 'Chưa có tin nhắn'}
          </span>
          {unread > 0 && (
            <span className="chat-inbox-badge">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

interface ChatInboxDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function ChatInboxDrawer({ open, onClose }: ChatInboxDrawerProps) {
  const [activeRoom, setActiveRoom] = useState<CustomerChatRoomSummary | null>(
    null,
  );
  const queryClient = useQueryClient();

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['chat-inbox-rooms'],
    queryFn: fetchCustomerChatRooms,
    enabled: open,
    staleTime: 15_000,
    refetchInterval: open ? 30_000 : false,
  });

  function handleOpen(room: CustomerChatRoomSummary) {
    setActiveRoom(room);
  }

  function handleCloseChat() {
    setActiveRoom(null);
    void queryClient.invalidateQueries({ queryKey: ['chat-inbox-rooms'] });
  }

  // When a room is active, render ChatDrawer completely standalone
  // (inbox panel is NOT rendered to avoid any z-index / pointer-events conflict)
  if (activeRoom) {
    return (
      <ChatDrawer
        open={true}
        onClose={handleCloseChat}
        roomId={activeRoom.roomId}
        entityType="customer"
        entityId={activeRoom.customerId}
        title={activeRoom.customerName}
        subtitle={activeRoom.customerCode}
      />
    );
  }

  if (!open) return null;

  const mount = document.getElementById('modal-root');
  if (!mount) return null;

  return createPortal(
    <>
      <div
        className="chat-drawer-overlay"
        onClick={onClose}
        role="presentation"
      />
      <div className="chat-inbox-panel" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="chat-inbox-header">
          <div>
            <h3 className="chat-inbox-title">Hộp thư khách hàng</h3>
            <p className="chat-inbox-subtitle">
              {rooms.length} cuộc trò chuyện
            </p>
          </div>
          <button
            type="button"
            className="chat-close-btn"
            onClick={onClose}
            aria-label="Đóng"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Room list */}
        <div className="chat-inbox-list">
          {isLoading && <div className="chat-inbox-empty">Đang tải...</div>}
          {!isLoading && rooms.length === 0 && (
            <div className="chat-inbox-empty">
              Chưa có cuộc trò chuyện nào.
              <br />
              Vào Khách hàng → Nhắn tin để bắt đầu.
            </div>
          )}
          {rooms.map((room) => (
            <RoomRow
              key={room.roomId}
              room={room}
              onClick={() => handleOpen(room)}
            />
          ))}
        </div>
      </div>
    </>,
    mount,
  );
}
