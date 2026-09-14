import React, { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { useSearchMessages, useTypingIndicator } from '@/application/chat';
import { CHAT_LABELS, type ChatMessage } from '@/schema/chat.schema';
import { scrollToAndHighlightMessage } from '@/features/chat/chat.utils';
import { useChatDrawerOrchestration } from '@/features/chat/hooks/useChatDrawerOrchestration';

import { ChatContextBar } from './components/ChatContextBar';
import { ChatDrawerBannerGroup } from './components/ChatDrawerBannerGroup';
import { ChatDrawerSearchPanel } from './components/ChatDrawerSearchPanel';
import { ChatHeaderV3 } from './components/ChatHeaderV3';
import { ChatInputArea } from './components/ChatInputArea';
import { ChatMessageList } from './components/ChatMessageList';
import { PinnedMessagesBar } from './components/PinnedMessagesBar';

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
  const {
    resolvedRoomId,
    isResolvingRoom,
    timelineState,
    data,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    connectionStatus,
    pendingCount,
    createRoomError,
    isCreateRoomError,
    handleRetryRoom,
    handleSend,
    handleSendImage,
    handleSendFile,
  } = useChatDrawerOrchestration({
    open,
    entityType,
    entityId,
    roomId: propRoomId,
    messageId: propMessageId,
  });

  const [isSearchOpen, setIsSearchOpen] = useState(false);
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

  const handleToggleSearch = useCallback(() => {
    setIsSearchOpen((prev) => {
      if (prev) {
        setSearchQuery('');
      }
      return !prev;
    });
  }, []);

  const handleCloseSearch = useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
  }, []);

  const handleSearchResultClick = useCallback(
    (msgId: string) => {
      scrollToAndHighlightMessage(msgId, 2000);
      handleCloseSearch();
    },
    [handleCloseSearch],
  );

  if (!open) return null;

  const mountNode = document.getElementById('modal-root');
  if (!mountNode) return null;

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
          onToggleSearch={handleToggleSearch}
          isSearchActive={isSearchOpen}
        />

        {/* ERP Context Bar (When entity context is provided) */}
        {entityType && entityId && (
          <ChatContextBar entityType={entityType} entityId={entityId} />
        )}

        {/* Search Panel */}
        <ChatDrawerSearchPanel
          isOpen={isSearchOpen}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onCloseSearch={handleCloseSearch}
          searchResults={searchResults}
          onSelectResult={handleSearchResultClick}
        />

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

        {/* Connection, Pending & Error Banners */}
        <ChatDrawerBannerGroup
          resolvedRoomId={resolvedRoomId}
          connectionStatus={connectionStatus}
          pendingCount={pendingCount}
          isCreateRoomError={isCreateRoomError}
          createRoomError={createRoomError}
          onRetryRoom={handleRetryRoom}
        />

        {/* Normalized Messages Timeline */}
        {!isCreateRoomError ? (
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
    mountNode,
  );
});
