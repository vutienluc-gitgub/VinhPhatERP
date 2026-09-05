import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';

import { fetchMyChatRooms, type MyChatRoomSummary } from '@/api/chat.api';
import { Icon } from '@/shared/components/Icon';
import { CHAT_INBOX_LABELS, CHAT_LABELS } from '@/schema/chat.schema';

import { ChatDrawer } from './ChatDrawer';
import './chat.css';

function formatRelative(iso: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return CHAT_INBOX_LABELS.JUST_NOW;
  if (mins < 60) return `${mins} ${CHAT_INBOX_LABELS.MINS_AGO}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ${CHAT_INBOX_LABELS.HOURS_AGO}`;
  const days = Math.floor(hours / 24);
  return `${days} ${CHAT_INBOX_LABELS.DAYS_AGO}`;
}

function cleanPreviewText(text: string | null, type?: string | null): string {
  if (!text) return CHAT_INBOX_LABELS.NO_MESSAGES_YET;
  if (type === 'image') return CHAT_LABELS.IMAGE;
  return text.trim();
}

function RoomAvatar({
  entityType,
  entityName,
}: {
  entityType: string;
  entityName: string;
}) {
  if (entityType === 'shipment') {
    return (
      <div
        className="chat-inbox-avatar"
        style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        }}
      >
        <Icon name="Truck" size={18} />
      </div>
    );
  }

  if (entityType === 'order') {
    return (
      <div
        className="chat-inbox-avatar"
        style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        }}
      >
        <Icon name="Package" size={18} />
      </div>
    );
  }

  if (entityType === 'supplier') {
    return (
      <div
        className="chat-inbox-avatar"
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        }}
      >
        <Icon name="Building2" size={18} />
      </div>
    );
  }

  // Customer or default: initials
  const initials = entityName
    ? entityName
        .split(' ')
        .slice(-2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
    : 'KH';

  return (
    <div
      className="chat-inbox-avatar"
      style={{
        background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
      }}
    >
      {initials}
    </div>
  );
}

function RoomRow({
  room,
  onClick,
}: {
  room: MyChatRoomSummary;
  onClick: () => void;
}) {
  const unread = room.unreadCount;
  const isImage = room.lastMessageType === 'image';
  const preview = cleanPreviewText(room.lastMessage, room.lastMessageType);

  return (
    <button type="button" className="chat-inbox-row" onClick={onClick}>
      <RoomAvatar
        entityType={room.entityType}
        entityName={room.entityName || ''}
      />
      <div className="chat-inbox-body">
        <div className="chat-inbox-row-header">
          <span
            className={`chat-inbox-name ${unread > 0 ? 'font-semibold text-foreground' : ''}`}
          >
            {room.entityName}
          </span>
          <span className="chat-inbox-time">
            {formatRelative(room.lastMessageAt)}
          </span>
        </div>
        <div className="chat-inbox-row-footer">
          <span
            className={`chat-inbox-preview ${unread > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
          >
            {isImage ? (
              <span className="inline-flex items-center gap-1">
                <Icon name="Image" size={13} className="text-primary" />
                <span>{CHAT_LABELS.IMAGE}</span>
              </span>
            ) : (
              preview
            )}
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

type FilterTab = 'all' | 'customer' | 'shipment' | 'unread';

interface ChatInboxDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function ChatInboxDrawer({ open, onClose }: ChatInboxDrawerProps) {
  const [activeRoom, setActiveRoom] = useState<MyChatRoomSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const queryClient = useQueryClient();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ['chat-inbox-rooms'],
      queryFn: ({ pageParam }) =>
        fetchMyChatRooms({
          limit: 20,
          cursorUpdatedAt: pageParam?.cursorUpdatedAt ?? null,
          cursorRoomId: pageParam?.cursorRoomId ?? null,
        }),
      initialPageParam: null as {
        cursorUpdatedAt: string;
        cursorRoomId: string;
      } | null,
      getNextPageParam: (lastPage) => {
        if (!lastPage || lastPage.length < 20) return undefined;
        const lastItem = lastPage[lastPage.length - 1];
        if (!lastItem) return undefined;
        return {
          cursorUpdatedAt: lastItem.updatedAt,
          cursorRoomId: lastItem.roomId,
        };
      },
      enabled: open,
      staleTime: 15_000,
      refetchInterval: open ? 30_000 : false,
    });

  const rooms = useMemo(() => {
    return data?.pages.flatMap((page) => page) ?? [];
  }, [data]);

  const filteredRooms = useMemo(() => {
    let result = rooms;

    // 1. Filter tab
    if (activeFilter === 'customer') {
      result = result.filter((r) => r.entityType === 'customer');
    } else if (activeFilter === 'shipment') {
      result = result.filter((r) => r.entityType === 'shipment');
    } else if (activeFilter === 'unread') {
      result = result.filter((r) => r.unreadCount > 0);
    }

    // 2. Search query
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (r) =>
          r.entityName?.toLowerCase().includes(q) ||
          r.entityCode?.toLowerCase().includes(q) ||
          r.lastMessage?.toLowerCase().includes(q),
      );
    }

    return result;
  }, [rooms, activeFilter, searchQuery]);

  function handleOpen(room: MyChatRoomSummary) {
    setActiveRoom(room);
  }

  function handleCloseChat() {
    setActiveRoom(null);
    void queryClient.invalidateQueries({ queryKey: ['chat-inbox-rooms'] });
  }

  // When a room is active, render ChatDrawer completely standalone
  if (activeRoom) {
    return (
      <ChatDrawer
        open={true}
        onClose={handleCloseChat}
        roomId={activeRoom.roomId}
        entityType={activeRoom.entityType}
        entityId={activeRoom.entityId}
        title={activeRoom.entityName}
        subtitle={activeRoom.entityCode}
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
            <h3 className="chat-inbox-title">{CHAT_INBOX_LABELS.TITLE}</h3>
            <p className="chat-inbox-subtitle">
              {rooms.length} {CHAT_INBOX_LABELS.CONVERSATIONS_SUFFIX}
            </p>
          </div>
          <button
            type="button"
            className="chat-close-btn"
            onClick={onClose}
            aria-label={CHAT_LABELS.CLOSE}
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-3 pt-2 pb-1">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-secondary border border-border rounded-lg">
            <Icon
              name="Search"
              size={15}
              className="text-muted-foreground shrink-0"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={CHAT_INBOX_LABELS.SEARCH_PLACEHOLDER}
              className="w-full bg-transparent border-none outline-none text-xs text-foreground placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-muted-foreground hover:text-foreground p-0.5 border-none bg-transparent cursor-pointer"
              >
                <Icon name="X" size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-2.5 py-1 text-[0.7rem] font-medium rounded-full border transition-colors cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-primary text-white border-primary'
                : 'bg-surface-secondary text-muted-foreground border-border hover:text-foreground'
            }`}
          >
            {CHAT_INBOX_LABELS.FILTER_ALL} ({rooms.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('customer')}
            className={`px-2.5 py-1 text-[0.7rem] font-medium rounded-full border transition-colors cursor-pointer ${
              activeFilter === 'customer'
                ? 'bg-primary text-white border-primary'
                : 'bg-surface-secondary text-muted-foreground border-border hover:text-foreground'
            }`}
          >
            {CHAT_INBOX_LABELS.FILTER_CUSTOMER}
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('shipment')}
            className={`px-2.5 py-1 text-[0.7rem] font-medium rounded-full border transition-colors cursor-pointer ${
              activeFilter === 'shipment'
                ? 'bg-primary text-white border-primary'
                : 'bg-surface-secondary text-muted-foreground border-border hover:text-foreground'
            }`}
          >
            {CHAT_INBOX_LABELS.FILTER_SHIPMENT}
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('unread')}
            className={`px-2.5 py-1 text-[0.7rem] font-medium rounded-full border transition-colors cursor-pointer ${
              activeFilter === 'unread'
                ? 'bg-primary text-white border-primary'
                : 'bg-surface-secondary text-muted-foreground border-border hover:text-foreground'
            }`}
          >
            {CHAT_INBOX_LABELS.FILTER_UNREAD}
          </button>
        </div>

        {/* Room list */}
        <div className="chat-inbox-list">
          {isLoading && (
            <div className="chat-inbox-empty">{CHAT_LABELS.LOADING}</div>
          )}
          {!isLoading && filteredRooms.length === 0 && (
            <div className="chat-inbox-empty">
              {searchQuery
                ? CHAT_INBOX_LABELS.NOT_FOUND
                : CHAT_INBOX_LABELS.EMPTY_ROOMS}
            </div>
          )}
          {filteredRooms.map((room) => (
            <RoomRow
              key={room.roomId}
              room={room}
              onClick={() => handleOpen(room)}
            />
          ))}
          {hasNextPage && (
            <div className="p-3 text-center">
              <button
                type="button"
                onClick={() => void fetchNextPage()}
                disabled={isFetchingNextPage}
                className="px-4 py-1.5 text-xs font-medium text-primary bg-surface-secondary border border-border rounded-lg hover:bg-surface transition-colors cursor-pointer disabled:opacity-50"
              >
                {isFetchingNextPage
                  ? CHAT_INBOX_LABELS.LOADING_MORE
                  : CHAT_INBOX_LABELS.LOAD_MORE}
              </button>
            </div>
          )}
        </div>
      </div>
    </>,
    mount,
  );
}
