import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { ChatMessage } from '@/schema/chat.schema';
import { CHAT_LABELS } from '@/schema/chat.schema';
import { buildMessageGroups } from '@/features/chat/chat.utils';
import { useAuth } from '@/shared/hooks/useAuth';

import { MessageCluster } from './MessageCluster';

function DateDivider({ label }: { label: string }) {
  return (
    <div className="chat-date-divider">
      <span className="chat-date-label">{label}</span>
    </div>
  );
}

interface ChatMessageListProps {
  pages: ChatMessage[][] | undefined;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  isLoading: boolean;
  onRetry?: (message: ChatMessage) => void;
}

export const ChatMessageList = React.memo(function ChatMessageList({
  pages,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  isLoading,
  onRetry,
}: ChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const [isNearBottom, setIsNearBottom] = useState(true);
  const [unreadNewCount, setUnreadNewCount] = useState(0);
  const lastMessageCountRef = useRef(0);

  // Convert pages (which come with newest-first per page) to a single chronological list (oldest-first)
  const chronologicalMessages = useMemo(() => {
    if (!pages || pages.length === 0) return [];
    // Reverse page list, then reverse each page array to get chronological order [oldest ... newest]
    return [...pages].reverse().flatMap((page) => [...page].reverse());
  }, [pages]);

  const messageGroups = useMemo(
    () => buildMessageGroups(chronologicalMessages, user?.id),
    [chronologicalMessages, user?.id],
  );

  // Scroll handler to detect position
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const threshold = 120; // px from bottom
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceFromBottom < threshold;

    setIsNearBottom(nearBottom);

    // Clear new message counter if user scrolled to bottom
    if (nearBottom) {
      setUnreadNewCount(0);
    }
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    });
    setUnreadNewCount(0);
  }, []);

  // Handle incoming new messages & auto-scroll
  useEffect(() => {
    const currentCount = chronologicalMessages.length;
    const prevCount = lastMessageCountRef.current;

    if (currentCount > prevCount && prevCount > 0) {
      const newestMsg = chronologicalMessages[chronologicalMessages.length - 1];
      const isMine = newestMsg?.sender_id === user?.id;

      if (isMine || isNearBottom) {
        // Automatically scroll down if user sent it or is near bottom
        scrollToBottom(true);
      } else {
        // Otherwise increment "New Messages" badge
        setUnreadNewCount((prev) => prev + (currentCount - prevCount));
      }
    }

    lastMessageCountRef.current = currentCount;
  }, [chronologicalMessages, isNearBottom, user?.id, scrollToBottom]);

  // Initial load scroll to bottom
  useEffect(() => {
    if (!isLoading && chronologicalMessages.length > 0) {
      scrollToBottom(false);
    }
  }, [isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll anchor when fetching older messages
  const handleLoadMore = useCallback(() => {
    if (!isFetchingNextPage && hasNextPage) {
      const el = scrollRef.current;
      const prevScrollHeight = el?.scrollHeight ?? 0;

      onLoadMore();

      // Preserve scroll offset after DOM updates
      requestAnimationFrame(() => {
        if (el) {
          const newScrollHeight = el.scrollHeight;
          el.scrollTop = newScrollHeight - prevScrollHeight;
        }
      });
    }
  }, [isFetchingNextPage, hasNextPage, onLoadMore]);

  if (isLoading) {
    return (
      <div className="chat-message-list">
        <div className="chat-empty">{CHAT_LABELS.LOADING}</div>
      </div>
    );
  }

  if (chronologicalMessages.length === 0) {
    return (
      <div className="chat-message-list">
        <div className="chat-empty-state">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="chat-empty-icon"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <p className="chat-empty-text">{CHAT_LABELS.NO_MESSAGES}</p>
          <p className="chat-empty-hint">Bắt đầu cuộc trò chuyện ngay!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-message-list-viewport">
      <div
        className="chat-message-list"
        ref={scrollRef}
        onScroll={handleScroll}
      >
        {/* Load older messages button at the TOP */}
        {hasNextPage && (
          <div className="chat-load-more">
            <button
              type="button"
              className="chat-load-more-btn"
              onClick={handleLoadMore}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? (
                'Đang tải tin nhắn cũ...'
              ) : (
                <>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 5v14M5 12l7-7 7 7" />
                  </svg>
                  <span>Tải thêm tin nhắn cũ</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Message Groups & Clusters in natural chronological order */}
        <div className="chat-messages-container">
          {messageGroups.map((group) => (
            <React.Fragment key={group.date}>
              <DateDivider label={group.label} />
              {group.clusters.map((cluster) => (
                <MessageCluster
                  key={cluster.id}
                  cluster={cluster}
                  onRetry={onRetry}
                />
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Floating Action Button (FAB): New Messages / Scroll to Bottom */}
      {(!isNearBottom || unreadNewCount > 0) && (
        <button
          type="button"
          className="chat-scroll-bottom-fab"
          onClick={() => scrollToBottom(true)}
          aria-label="Cuộn xuống dưới cùng"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
          {unreadNewCount > 0 && (
            <span className="chat-scroll-bottom-badge">
              {unreadNewCount} tin nhắn mới
            </span>
          )}
        </button>
      )}
    </div>
  );
});
