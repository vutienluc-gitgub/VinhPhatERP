import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from 'react';
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
import { useAuth } from '@/shared/hooks/useAuth';
import { deriveChatTimelineState } from '@/domain/chat';
import { extractChronologicalMessages } from '@/features/chat/chat.utils';

import { ChatContextBar } from './components/ChatContextBar';
import { ChatInputArea } from './components/ChatInputArea';
import { ChatMessageList } from './components/ChatMessageList';
import { PinnedMessagesBar } from './components/PinnedMessagesBar';
import { ChatHeaderV3 } from './components/ChatHeaderV3';

import './chat.css';

interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
  entityType?: string;
  entityId?: string;
  title?: string;
  subtitle?: string;
  roomId?: string;
  messageId?: string;
}

export const ChatDrawer = React.memo(function ChatDrawer({
  open,
  onClose,
  entityType,
  entityId,
  roomId: propRoomId,
  messageId: propMessageId,
  title,
  subtitle,
}: ChatDrawerProps) {
  const { user, loading: authLoading } = useAuth();
  const isAuthReady = !authLoading && Boolean(user);

  // Invariant 1: If canonical roomId is provided, NEVER re-resolve via entity/customerId
  const hasDirectRoomId = Boolean(propRoomId && propRoomId.trim() !== '');

  const { data: cachedRoom, isLoading: isFetchingCachedRoom } = useChatRoom(
    entityType ?? '',
    open && !hasDirectRoomId ? entityId : undefined,
  );
  const createRoomMutation = useGetOrCreateRoom();

  const resolvedRoomId =
    propRoomId || cachedRoom?.id || createRoomMutation.data;

  const isResolvingRoom =
    !hasDirectRoomId &&
    (isFetchingCachedRoom ||
      createRoomMutation.isPending ||
      (!resolvedRoomId && Boolean(entityType && entityId)));

  const {
    data,
    isLoading: messagesLoading,
    isError: messagesError,
    error: messagesErrObj,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useChatMessages(resolvedRoomId);

  const sendMutation = useSendMessage(resolvedRoomId);

  // Subscribe to realtime (with reconnection + multi-tab sync)
  const { connectionStatus } = useChatRealtime(
    open ? resolvedRoomId : undefined,
  );

  // Auto-flush offline queue when online
  const { pendingCount } = useChatOfflineSync(
    open ? resolvedRoomId : undefined,
  );

  /**
   * Track which entity key has been triggered to prevent duplicate room creation.
   */
  const triggeredEntityKeyRef = useRef<string | null>(null);

  useEffect(() => {
    // Invariant: Skip fallback room creation if canonical roomId is already given
    if (hasDirectRoomId || cachedRoom?.id || !entityType || !entityId) return;

    const entityKey = `${entityType}:${entityId}`;
    if (open && triggeredEntityKeyRef.current !== entityKey) {
      triggeredEntityKeyRef.current = entityKey;
      createRoomMutation.mutate({ entityType, entityId });
    }
    if (!open) {
      triggeredEntityKeyRef.current = null;
    }
  }, [open, entityType, entityId, hasDirectRoomId, cachedRoom?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mark room as read when drawer is open
  const markAsRead = useMarkAsRead(resolvedRoomId);
  useEffect(() => {
    if (open && resolvedRoomId) {
      markAsRead();
    }
  }, [open, resolvedRoomId, markAsRead, data]);

  // Register room globally so notifications are muted for this active room
  useEffect(() => {
    if (!open || !resolvedRoomId) return;
    registerOpenRoom(resolvedRoomId);
    return () => {
      unregisterOpenRoom(resolvedRoomId);
    };
  }, [open, resolvedRoomId]);

  // Derive deterministic ChatTimelineState
  const flattenedMessages = useMemo(
    () => extractChronologicalMessages(data?.pages),
    [data?.pages],
  );

  const timelineState = useMemo(() => {
    const hasError = Boolean(
      (resolvedRoomId && messagesError) ||
      (!resolvedRoomId && createRoomMutation.isError),
    );
    const activeError = resolvedRoomId
      ? messagesErrObj
      : createRoomMutation.error;

    return deriveChatTimelineState({
      isAuthReady,
      isResolvingRoom,
      roomId: resolvedRoomId,
      isLoadingMessages: messagesLoading,
      isError: hasError,
      error: activeError,
      messages: flattenedMessages,
      hasNextPage,
    });
  }, [
    isAuthReady,
    isResolvingRoom,
    resolvedRoomId,
    messagesLoading,
    createRoomMutation.isError,
    createRoomMutation.error,
    messagesError,
    messagesErrObj,
    flattenedMessages,
    hasNextPage,
  ]);

  // Deep link direct message jump / highlight
  useEffect(() => {
    if (propMessageId && timelineState.status === 'ready') {
      const el = document.querySelector(`[data-message-id="${propMessageId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('chat-message-highlight');
        const timeout = setTimeout(() => {
          el.classList.remove('chat-message-highlight');
        }, 2500);
        return () => clearTimeout(timeout);
      }
    }
    return undefined;
  }, [propMessageId, timelineState.status]);

  // Retry handler for error state
  const handleRetryRoom = useCallback(() => {
    if (entityType && entityId) {
      createRoomMutation.reset();
      triggeredEntityKeyRef.current = null;
      createRoomMutation.mutate({ entityType, entityId });
    }
  }, [createRoomMutation, entityType, entityId]);

  const handleSend = useCallback(
    (
      content: string,
      meta?: {
        mentions?: ChatMention[];
        replyToId?: string | null;
        replyToMessage?: ChatMessage | null;
      },
    ) => {
      if (!resolvedRoomId) return;
      sendMutation.mutate({
        clientId: crypto.randomUUID(),
        content,
        mentions: meta?.mentions,
        replyToId: meta?.replyToId,
        replyToMessage: meta?.replyToMessage
          ? {
              id: meta.replyToMessage.id,
              sender_name: meta.replyToMessage.sender_name ?? 'Người dùng',
              content: meta.replyToMessage.content,
              message_type: meta.replyToMessage.message_type,
            }
          : null,
      });
    },
    [resolvedRoomId, sendMutation],
  );

  const handleSendImage = useCallback(
    (url: string) => {
      if (!resolvedRoomId) return;
      sendMutation.mutate({
        clientId: crypto.randomUUID(),
        content: '',
        messageType: 'image',
        imageUrl: url,
      });
    },
    [resolvedRoomId, sendMutation],
  );

  const handleSendFile = useCallback(
    (url: string, fileName: string, fileType: string) => {
      if (!resolvedRoomId) return;
      sendMutation.mutate({
        clientId: crypto.randomUUID(),
        content: '',
        messageType: 'file',
        fileUrl: url,
        fileName,
        fileType,
      });
    },
    [resolvedRoomId, sendMutation],
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [replyingToMessage, setReplyingToMessage] =
    useState<ChatMessage | null>(null);
  const { data: searchResults } = useSearchMessages(
    resolvedRoomId,
    searchQuery,
  );
  const { typingUsers, startTyping, stopTyping } =
    useTypingIndicator(resolvedRoomId);
  const messageListRef = useRef<HTMLDivElement>(null);

  const handleSearchResultClick = useCallback((msgId: string) => {
    const messageElement = document.querySelector(
      `[data-message-id="${msgId}"]`,
    );
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      messageElement.classList.add('chat-message-highlight');
      setTimeout(() => {
        messageElement.classList.remove('chat-message-highlight');
      }, 2000);
    }
    setSearchQuery('');
  }, []);

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
      <div
        className="chat-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={title ?? CHAT_LABELS.TITLE}
      >
        {/* Modern Header V3 */}
        <ChatHeaderV3
          title={title}
          subtitle={subtitle}
          isOnline={connectionStatus === 'connected'}
          isTyping={typingUsers.length > 0}
          typingUsers={typingUsers}
          onClose={onClose}
          onToggleSearch={() => setSearchQuery(searchQuery ? '' : ' ')}
          isSearchActive={searchQuery !== ''}
        />

        {/* ERP Context Bar (When entity context is provided) */}
        {entityType && entityId && (
          <ChatContextBar entityType={entityType} entityId={entityId} />
        )}

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
        {resolvedRoomId ? <PinnedMessagesBar roomId={resolvedRoomId} /> : null}

        {/* Connection Status Banner */}
        {resolvedRoomId && connectionStatus === 'reconnecting' ? (
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

        {/* Room Creation Fallback Error */}
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

        {/* Normalized Messages Timeline */}
        {!createRoomMutation.isError ? (
          <div ref={messageListRef} className="chat-body-viewport">
            <ChatMessageList
              pages={data?.pages}
              timelineState={timelineState}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              onLoadMore={() => void fetchNextPage()}
              onQuoteReply={setReplyingToMessage}
              partnerName={title}
              entityType={entityType}
            />
          </div>
        ) : null}

        {/* Composer Input */}
        <ChatInputArea
          onSend={handleSend}
          onSendImage={handleSendImage}
          onSendFile={handleSendFile}
          roomId={resolvedRoomId}
          onTypingStart={startTyping}
          onTypingStop={stopTyping}
          replyingToMessage={replyingToMessage}
          onCancelReply={() => setReplyingToMessage(null)}
          disabled={
            !resolvedRoomId ||
            isResolvingRoom ||
            timelineState.status === 'error'
          }
        />
      </div>
    </>,
    mount,
  );
});
