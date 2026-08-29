import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

import { CHAT_LABELS, type ChatMessage } from '@/schema/chat.schema';
import { useAuth } from '@/shared/hooks/useAuth';
import { Icon } from '@/shared/components/Icon';
import { buildMessageGroups } from '@/features/chat/chat.utils';
import type { MessageCluster as MessageClusterType } from '@/features/chat/chat.types';

import { MessageCluster } from './MessageCluster';

function DateDivider({ label }: { label: string }) {
  return (
    <div className="chat-date-divider">
      <span className="chat-date-label">{label}</span>
    </div>
  );
}

type RenderItem =
  | { type: 'date'; key: string; label: string }
  | { type: 'cluster'; key: string; cluster: MessageClusterType };

interface ChatMessageListProps {
  pages: ChatMessage[][] | undefined;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  isLoading: boolean;
  onRetry?: (message: ChatMessage) => void;
  onQuoteReply?: (message: ChatMessage) => void;
  partnerName?: string;
  entityType?: string;
}

export const ChatMessageList = React.memo(function ChatMessageList({
  pages,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  isLoading,
  onRetry,
  onQuoteReply,
  partnerName,
  entityType,
}: ChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user, profile } = useAuth();

  const [isNearBottom, setIsNearBottom] = useState(true);
  const [unreadNewCount, setUnreadNewCount] = useState(0);
  const lastMessageCountRef = useRef(0);

  // Convert pages (which come with newest-first per page) to a single chronological list (oldest-first)
  const chronologicalMessages = useMemo(() => {
    if (!pages || pages.length === 0) return [];
    return [...pages].reverse().flatMap((page) => [...page].reverse());
  }, [pages]);

  const messageGroups = useMemo(
    () =>
      buildMessageGroups(chronologicalMessages, user?.id, {
        currentUserId: user?.id,
        currentUserRole: profile?.role,
        partnerName,
        entityType,
      }),
    [chronologicalMessages, user?.id, profile?.role, partnerName, entityType],
  );

  // Flatten groups into renderable items for virtualization when message history is long
  const flatItems: RenderItem[] = useMemo(() => {
    const items: RenderItem[] = [];
    for (const group of messageGroups) {
      items.push({
        type: 'date',
        key: `date-${group.date}`,
        label: group.label,
      });
      for (const cluster of group.clusters) {
        items.push({ type: 'cluster', key: cluster.id, cluster });
      }
    }
    return items;
  }, [messageGroups]);

  const isVirtualized = flatItems.length > 30;

  const rowVirtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 72,
    overscan: 6,
    enabled: isVirtualized,
  });

  // Scroll handler to detect position
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const threshold = 120; // px from bottom
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceFromBottom < threshold;

    setIsNearBottom(nearBottom);

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
      const isMine = Boolean(
        (user?.id && newestMsg?.sender_id === user?.id) ||
        (!newestMsg?.sender_id && newestMsg?.status === 'pending') ||
        (profile?.role !== 'customer' &&
          (newestMsg?.sender_role === 'admin' ||
            newestMsg?.sender_role === 'manager' ||
            newestMsg?.sender_role === 'staff')),
      );

      if (isMine || isNearBottom) {
        scrollToBottom(true);
      } else {
        setUnreadNewCount((prev) => prev + (currentCount - prevCount));
      }
    }

    lastMessageCountRef.current = currentCount;
  }, [
    chronologicalMessages,
    isNearBottom,
    user?.id,
    profile?.role,
    scrollToBottom,
  ]);

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
      const prevScrollTop = el?.scrollTop ?? 0;

      onLoadMore();

      requestAnimationFrame(() => {
        if (el) {
          const newScrollHeight = el.scrollHeight;
          el.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
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
          <Icon
            name="MessageSquare"
            size={48}
            strokeWidth={1.5}
            className="chat-empty-icon"
          />
          <p className="chat-empty-text">{CHAT_LABELS.NO_MESSAGES}</p>
          <p className="chat-empty-hint">
            {CHAT_LABELS.START_CONVERSATION_HINT}
          </p>
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
                CHAT_LABELS.LOADING_OLDER_MESSAGES
              ) : (
                <>
                  <Icon name="ArrowUp" size={12} strokeWidth={2} />
                  <span>{CHAT_LABELS.LOAD_OLDER_MESSAGES}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Virtualized or Direct render */}
        {isVirtualized ? (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              const item = flatItems[virtualItem.index];
              if (!item) return null;
              return (
                <div
                  key={item.key}
                  ref={rowVirtualizer.measureElement}
                  data-index={virtualItem.index}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  {item.type === 'date' ? (
                    <DateDivider label={item.label} />
                  ) : (
                    <MessageCluster
                      cluster={item.cluster}
                      onRetry={onRetry}
                      onQuoteReply={onQuoteReply}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="chat-messages-container">
            {messageGroups.map((group) => (
              <React.Fragment key={group.date}>
                <DateDivider label={group.label} />
                {group.clusters.map((cluster) => (
                  <MessageCluster
                    key={cluster.id}
                    cluster={cluster}
                    onRetry={onRetry}
                    onQuoteReply={onQuoteReply}
                  />
                ))}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button (FAB): New Messages / Scroll to Bottom */}
      {(!isNearBottom || unreadNewCount > 0) && (
        <button
          type="button"
          className="chat-scroll-bottom-fab"
          onClick={() => scrollToBottom(true)}
          aria-label={CHAT_LABELS.SCROLL_TO_BOTTOM}
        >
          <Icon name="ChevronDown" size={16} />
          {unreadNewCount > 0 && (
            <span className="chat-scroll-bottom-badge">
              {unreadNewCount} {CHAT_LABELS.NEW_MESSAGES_COUNT_SUFFIX}
            </span>
          )}
        </button>
      )}
    </div>
  );
});
