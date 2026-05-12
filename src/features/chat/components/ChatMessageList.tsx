import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { ChatMessage } from '@/schema/chat.schema';
import { CHAT_LABELS, isOptimisticMessage } from '@/schema/chat.schema';
import { useAuth } from '@/shared/hooks/useAuth';

import { ChatBubble } from './ChatBubble';

interface MessageGroup {
  date: string;
  label: string;
  messages: ChatMessage[];
}

function formatDateLabel(isoDate: string): string {
  const date = new Date(isoDate);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  if (isSameDay(date, today)) return 'Hôm nay';
  if (isSameDay(date, yesterday)) return 'Hôm qua';

  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

function groupMessagesByDate(messages: ChatMessage[]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  let currentGroup: MessageGroup | null = null;

  for (const msg of messages) {
    const dateLabel = formatDateLabel(msg.created_at);
    const dateKey = msg.created_at.split('T')[0] ?? '';

    if (!currentGroup || currentGroup.date !== dateKey) {
      currentGroup = {
        date: dateKey,
        label: dateLabel,
        messages: [],
      };
      groups.push(currentGroup);
    }
    if (currentGroup) {
      currentGroup.messages.push(msg);
    }
  }

  return groups;
}

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
}

export const ChatMessageList = React.memo(function ChatMessageList({
  pages,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  isLoading,
}: ChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [isNearBottom, setIsNearBottom] = useState(true);
  const lastMessageCountRef = useRef(0);

  // Track scroll position to detect if user is near bottom
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 100; // pixels from bottom
    const isBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    setIsNearBottom(isBottom);
  }, []);

  // Auto-scroll to bottom when new messages arrive (if user is already near bottom)
  useEffect(() => {
    const allMessages = pages?.flat() ?? [];
    const currentCount = allMessages.length;
    const el = scrollRef.current;

    if (el && currentCount > lastMessageCountRef.current && isNearBottom) {
      // New message arrived and user is near bottom, scroll down
      el.scrollTop = 0; // Because flex-direction: column-reverse
    }

    lastMessageCountRef.current = currentCount;
  }, [pages, isNearBottom]);

  // Scroll to bottom on initial load
  useEffect(() => {
    const el = scrollRef.current;
    if (el && !isLoading && pages) {
      el.scrollTop = 0;
    }
  }, [isLoading, pages]);

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

  const allMessages = useMemo(() => pages?.flat() ?? [], [pages]);
  const messageGroups = useMemo(
    () => groupMessagesByDate(allMessages),
    [allMessages],
  );

  if (isLoading) {
    return (
      <div className="chat-message-list">
        <div className="chat-empty">{CHAT_LABELS.LOADING}</div>
      </div>
    );
  }

  if (allMessages.length === 0) {
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
    <div className="chat-message-list" ref={scrollRef} onScroll={handleScroll}>
      {messageGroups.map((group) => (
        <React.Fragment key={group.date}>
          <DateDivider label={group.label} />
          {group.messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              message={msg}
              isMine={msg.sender_id === user?.id}
              isOptimistic={isOptimisticMessage(msg)}
            />
          ))}
        </React.Fragment>
      ))}
      {hasNextPage ? (
        <div className="chat-load-more">
          <button
            type="button"
            className="chat-load-more-btn"
            onClick={handleLoadMore}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? CHAT_LABELS.LOADING : CHAT_LABELS.LOAD_MORE}
          </button>
        </div>
      ) : null}
    </div>
  );
});
