import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  useChatMessages,
  useChatRealtime,
  useChatOfflineSync,
  useChatRoom,
  useGetOrCreateRoom,
  useSendMessage,
  useSearchMessages,
  useTypingIndicator,
  useMarkAsRead,
} from '@/application/chat';
import {
  registerOpenRoom,
  unregisterOpenRoom,
} from '@/application/chat/useChatNotifications';
import {
  CHAT_LABELS,
  type ChatMessage,
  type ChatMention,
} from '@/schema/chat.schema';
import { Icon } from '@/shared/components/Icon';

import { ChatContextBar } from './components/ChatContextBar';
import { ChatInputArea } from './components/ChatInputArea';
import { ChatMessageList } from './components/ChatMessageList';
import { PinnedMessagesBar } from './components/PinnedMessagesBar';
import { PresenceIndicator } from './components/PresenceIndicator';

import './chat.css';

interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
  entityType: string;
  entityId: string;
  title?: string;
  subtitle?: string;
  roomId?: string;
}

export const ChatDrawer = React.memo(function ChatDrawer({
  open,
  onClose,
  entityType,
  entityId,
  roomId: propRoomId,
  title,
  subtitle,
}: ChatDrawerProps) {
  const { data: cachedRoom } = useChatRoom(
    entityType,
    open ? entityId : undefined,
  );
  const createRoomMutation = useGetOrCreateRoom();

  // Get or create room on open, unless roomId is provided via props or memory cache
  const roomId = propRoomId ?? cachedRoom?.id ?? createRoomMutation.data;

  const {
    data,
    isLoading: messagesLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useChatMessages(roomId);

  const sendMutation = useSendMessage(roomId);

  // Subscribe to realtime (with reconnection + multi-tab sync)
  const { connectionStatus } = useChatRealtime(open ? roomId : undefined);

  // Auto-flush offline queue when online
  const { pendingCount } = useChatOfflineSync(open ? roomId : undefined);

  /**
   * Track which entity key has been triggered to prevent duplicate room
   * creation. The ref is immune to stale closures.
   */
  const triggeredEntityKeyRef = useRef<string | null>(null);

  useEffect(() => {
    // Skip mutation if we already have the roomId via props or cache
    if (propRoomId || cachedRoom?.id) return;

    const entityKey = `${entityType}:${entityId}`;
    if (open && triggeredEntityKeyRef.current !== entityKey) {
      triggeredEntityKeyRef.current = entityKey;
      createRoomMutation.mutate({ entityType, entityId });
    }
    if (!open) {
      triggeredEntityKeyRef.current = null;
    }
  }, [open, entityType, entityId, propRoomId, cachedRoom?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mark room as read when drawer is open
  const markAsRead = useMarkAsRead(roomId);
  useEffect(() => {
    if (open && roomId) {
      markAsRead();
    }
  }, [open, roomId, markAsRead, data]);

  // Register room globally so notifications are muted for this active room
  useEffect(() => {
    if (!open || !roomId) return;
    registerOpenRoom(roomId);
    return () => {
      unregisterOpenRoom(roomId);
    };
  }, [open, roomId]);

  // Retry handler for error state
  const handleRetryRoom = useCallback(() => {
    createRoomMutation.reset();
    triggeredEntityKeyRef.current = null;
    createRoomMutation.mutate({ entityType, entityId });
  }, [createRoomMutation, entityType, entityId]);

  const handleSend = useCallback(
    (content: string, mentions?: ChatMention[]) => {
      if (!roomId) return;
      sendMutation.mutate({
        clientId: crypto.randomUUID(),
        content,
        mentions,
      });
    },
    [roomId, sendMutation],
  );

  const handleSendImage = useCallback(
    (url: string) => {
      if (!roomId) return;
      sendMutation.mutate({
        clientId: crypto.randomUUID(),
        content: '',
        messageType: 'image',
        imageUrl: url,
      });
    },
    [roomId, sendMutation],
  );

  const handleSendFile = useCallback(
    (url: string, fileName: string, fileType: string) => {
      if (!roomId) return;
      sendMutation.mutate({
        clientId: crypto.randomUUID(),
        content: '',
        messageType: 'file',
        fileUrl: url,
        fileName,
        fileType,
      });
    },
    [roomId, sendMutation],
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [replyingToMessage, setReplyingToMessage] =
    useState<ChatMessage | null>(null);
  const { data: searchResults } = useSearchMessages(roomId, searchQuery);
  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(roomId);
  const messageListRef = useRef<HTMLDivElement>(null);

  const handleSearchResultClick = useCallback((messageId: string) => {
    // Scroll to message in the message list
    const messageElement = document.querySelector(
      `[data-message-id="${messageId}"]`,
    );
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight the message briefly
      messageElement.classList.add('chat-message-highlight');
      setTimeout(() => {
        messageElement.classList.remove('chat-message-highlight');
      }, 2000);
    }
    // Close search after clicking
    setSearchQuery('');
  }, []);

  if (!open) return null;

  const mount = document.getElementById('modal-root');
  if (!mount) return null;

  const isLoading = createRoomMutation.isPending || messagesLoading;

  return createPortal(
    <>
      <div
        className="chat-drawer-overlay"
        onClick={onClose}
        role="presentation"
      />
      <div
        className="chat-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={title ?? CHAT_LABELS.TITLE}
      >
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-title-section">
            <div className="chat-header-avatar">
              {(title ?? 'U')
                .split(' ')
                .slice(-2)
                .map((w) => w[0])
                .join('')
                .toUpperCase()}
            </div>
            <div className="chat-header-meta">
              <h3 className="chat-header-title">
                {title ?? CHAT_LABELS.TITLE}
              </h3>
              <PresenceIndicator
                presence={typingUsers.length > 0 ? 'typing' : 'online'}
                subtext={subtitle ? `${subtitle} • Online` : undefined}
              />
            </div>
          </div>
          <div className="chat-header-actions">
            <button
              type="button"
              className="chat-search-toggle-btn"
              onClick={() => setSearchQuery(searchQuery ? '' : ' ')}
              aria-label="Tìm kiếm"
              title="Tìm kiếm tin nhắn"
            >
              <Icon name="Search" size={18} />
            </button>
            <button
              type="button"
              className="chat-close-btn"
              onClick={onClose}
              aria-label={CHAT_LABELS.CLOSE}
              title="Đóng"
            >
              <Icon name="X" size={18} />
            </button>
          </div>
        </div>

        {/* ERP Context Bar (Phase 2) */}
        <ChatContextBar entityType={entityType} entityId={entityId} />

        {/* Search Input */}
        {searchQuery !== '' && (
          <div className="chat-search-bar">
            <input
              type="text"
              className="chat-search-input"
              placeholder="Tìm kiếm tin nhắn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <button
              type="button"
              className="chat-search-clear-btn"
              onClick={() => setSearchQuery('')}
              aria-label="Xóa"
            >
              <Icon name="X" size={14} />
            </button>
          </div>
        )}

        {/* Search Results */}
        {searchQuery.trim() && searchResults && searchResults.length > 0 ? (
          <div className="chat-search-results">
            <div className="chat-search-results-header">
              {searchResults.length} kết quả
            </div>
            {searchResults.map((msg) => (
              <div
                key={msg.id}
                className="chat-search-result-item"
                onClick={() => handleSearchResultClick(msg.id)}
              >
                <div className="chat-search-result-time">
                  {/* eslint-disable-next-line no-restricted-syntax */}
                  {new Date(msg.created_at).toLocaleString('vi-VN')}
                </div>
                <div className="chat-search-result-content">{msg.content}</div>
              </div>
            ))}
          </div>
        ) : null}

        {searchQuery.trim() && searchResults && searchResults.length === 0 ? (
          <div className="chat-search-empty">Không tìm thấy kết quả</div>
        ) : null}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="chat-typing-indicator">
            <span className="chat-typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </span>
            <span className="chat-typing-text">
              {typingUsers.map((u) => u.userName).join(', ')} đang nhập...
            </span>
          </div>
        )}

        {/* Pinned Messages */}
        {roomId ? <PinnedMessagesBar roomId={roomId} /> : null}

        {/* Connection Status Banner */}
        {roomId && connectionStatus === 'reconnecting' ? (
          <div className="chat-connection-banner chat-connection-banner--warning">
            {CHAT_LABELS.CONNECTION_LOST}
          </div>
        ) : null}

        {/* Offline Pending Banner */}
        {pendingCount > 0 ? (
          <div className="chat-connection-banner chat-connection-banner--info">
            {pendingCount} {CHAT_LABELS.OFFLINE_PENDING_MSG}
          </div>
        ) : null}

        {/* Room Creation Error — full error state with retry */}
        {createRoomMutation.isError ? (
          <div className="chat-message-list">
            <div className="chat-error-state">
              <p className="chat-error-msg">
                {(createRoomMutation.error as { message?: string } | null)
                  ?.message ?? CHAT_LABELS.SEND_ERROR}
              </p>
              <button
                type="button"
                className="chat-error-retry-btn"
                onClick={handleRetryRoom}
              >
                {CHAT_LABELS.RETRY}
              </button>
            </div>
          </div>
        ) : null}

        {/* Messages (only when room creation succeeded or is in progress) */}
        {!createRoomMutation.isError ? (
          <div ref={messageListRef} className="chat-body-viewport">
            <ChatMessageList
              pages={data?.pages}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              onLoadMore={() => void fetchNextPage()}
              isLoading={isLoading}
              onQuoteReply={setReplyingToMessage}
            />
          </div>
        ) : null}

        {/* Input */}
        <ChatInputArea
          onSend={handleSend}
          onSendImage={handleSendImage}
          onSendFile={handleSendFile}
          roomId={roomId}
          onTypingStart={startTyping}
          onTypingStop={stopTyping}
          replyingToMessage={replyingToMessage}
          onCancelReply={() => setReplyingToMessage(null)}
          disabled={
            !roomId ||
            createRoomMutation.isPending ||
            createRoomMutation.isError
          }
        />
      </div>
    </>,
    mount,
  );
});
