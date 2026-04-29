import { useCallback, useRef } from 'react';

import type { ChatMessage, OptimisticChatMessage } from '@/schema/chat.schema';
import { CHAT_LABELS } from '@/schema/chat.schema';

import { ChatBubble } from './ChatBubble';

interface ChatMessageListProps {
  pages: ChatMessage[][] | undefined;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  isLoading: boolean;
}

export function ChatMessageList({
  pages,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  isLoading,
}: ChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleLoadMore = useCallback(() => {
    if (!isFetchingNextPage && hasNextPage) {
      const el = scrollRef.current;
      const prevHeight = el?.scrollHeight ?? 0;

      onLoadMore();

      // Scroll anchor: preserve position after prepending older messages
      requestAnimationFrame(() => {
        if (el) {
          const newHeight = el.scrollHeight;
          el.scrollTop = newHeight - prevHeight;
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

  const allMessages = pages?.flat() ?? [];

  if (allMessages.length === 0) {
    return (
      <div className="chat-message-list">
        <div className="chat-empty">{CHAT_LABELS.NO_MESSAGES}</div>
      </div>
    );
  }

  return (
    <div className="chat-message-list" ref={scrollRef}>
      {allMessages.map((msg) => (
        <ChatBubble
          key={msg.id}
          message={msg}
          isOptimistic={(msg as OptimisticChatMessage)._optimistic}
        />
      ))}
      {hasNextPage ? (
        <div className="chat-load-more">
          <button
            type="button"
            className="chat-load-more-btn"
            onClick={handleLoadMore}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? CHAT_LABELS.LOADING : 'Tai them tin nhan cu'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
