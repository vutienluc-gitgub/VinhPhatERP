import { memo, useCallback, useState } from 'react';

import {
  CHAT_LABELS,
  type ChatMessage,
  type ChatMention,
} from '@/schema/chat.schema';
import { useAuth } from '@/shared/hooks/useAuth';
import { useTogglePin } from '@/application/chat';

import { ChatImagePreview } from './ChatImagePreview';

function formatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

function formatFullDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

function renderContent(content: string, mentions?: ChatMention[]) {
  if (!mentions || mentions.length === 0) return <div>{content}</div>;

  // Escape regex special chars in labels just in case
  const escapeRegExp = (str: string) =>
    str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const mentionLabels = mentions
    .map((m) => escapeRegExp(m.label))
    .sort((a, b) => b.length - a.length);

  if (mentionLabels.length === 0) return <div>{content}</div>;

  const regex = new RegExp(`(${mentionLabels.join('|')})`, 'g');
  const parts = content.split(regex);

  return (
    <div>
      {parts.map((part, i) => {
        const mention = mentions.find((m) => m.label === part);
        if (mention) {
          return (
            <span
              key={i}
              className={`chat-mention-inline chat-mention-inline--${mention.type}`}
            >
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}

interface ChatBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  isOptimistic?: boolean;
  onRetry?: (message: ChatMessage) => void;
}

export const ChatBubble = memo(function ChatBubble({
  message,
  isMine,
  isOptimistic,
  onRetry,
}: ChatBubbleProps) {
  const { profile } = useAuth();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const togglePinMutation = useTogglePin(message.room_id);

  const canPin = profile?.role === 'admin' || profile?.role === 'manager';

  const handleRetry = useCallback(() => {
    if (onRetry) onRetry(message);
  }, [onRetry, message]);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!canPin || isOptimistic) return;
    e.preventDefault();
    setShowContextMenu(!showContextMenu);
  };

  const handleTogglePin = () => {
    setShowContextMenu(false);
    togglePinMutation.mutate(message.id);
  };

  const handleCopyText = useCallback(() => {
    setShowContextMenu(false);
    if (message.content) {
      void navigator.clipboard.writeText(message.content);
    }
  }, [message.content]);

  // System message (journey updates)
  if (message.message_type === 'system') {
    return (
      <div className="chat-system-msg">
        <span className="chat-system-msg-text">{message.content}</span>
      </div>
    );
  }

  // ePOD important events (signature confirmation, delivery complete)
  if (message.message_type === 'system_epod') {
    return (
      <div className="chat-system-epod">
        <div className="chat-system-epod-content">{message.content}</div>
        <div className="chat-system-epod-time">
          {formatTime(message.created_at)}
        </div>
      </div>
    );
  }

  const isError = !isOptimistic && message.status === 'error';
  const statusClass = isOptimistic
    ? 'chat-bubble--pending'
    : isError
      ? 'chat-bubble--error'
      : '';

  return (
    <>
      <div
        className={`chat-bubble-row ${isMine ? 'chat-bubble-row--mine' : 'chat-bubble-row--theirs'}`}
        onContextMenu={handleContextMenu}
        style={{ position: 'relative' }}
      >
        <div
          className={`chat-bubble ${isMine ? 'chat-bubble--mine' : 'chat-bubble--theirs'} ${statusClass}`}
        >
          {/* Pin indicator */}
          {message.is_pinned ? (
            <div
              className="chat-bubble-pin-indicator"
              title={CHAT_LABELS.PINNED_MESSAGES}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="17" x2="12" y2="22"></line>
                <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.6V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3v4.6a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
              </svg>
            </div>
          ) : null}

          {/* Context Menu */}
          {showContextMenu && (
            <div
              className="chat-context-menu"
              onClick={(e) => e.stopPropagation()}
            >
              {message.content && (
                <button
                  className="chat-context-menu-item"
                  onClick={handleCopyText}
                >
                  {CHAT_LABELS.COPY_TEXT}
                </button>
              )}
              <button
                className="chat-context-menu-item"
                onClick={handleTogglePin}
                disabled={togglePinMutation.isPending}
              >
                {message.is_pinned
                  ? CHAT_LABELS.UNPIN_MESSAGE
                  : CHAT_LABELS.PIN_MESSAGE}
              </button>
            </div>
          )}

          {/* Image */}
          {message.message_type === 'image' && message.image_url ? (
            <img
              src={message.image_url}
              alt={CHAT_LABELS.IMAGE}
              className="chat-bubble-image"
              loading="lazy"
              onClick={() => setPreviewImage(message.image_url)}
            />
          ) : null}

          {/* Text content */}
          {message.content
            ? renderContent(message.content, message.mentions)
            : null}

          {/* Footer: time + status */}
          <div className="chat-bubble-footer">
            {isOptimistic ? (
              <span className="chat-bubble-status chat-bubble-status--pending">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="chat-status-spinner"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              </span>
            ) : null}
            <span
              className="chat-bubble-time"
              title={formatFullDateTime(message.created_at)}
            >
              {formatTime(message.created_at)}
            </span>
          </div>

          {/* Error: Retry */}
          {isError && onRetry ? (
            <button
              type="button"
              className="chat-retry-btn"
              onClick={handleRetry}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              {CHAT_LABELS.RETRY}
            </button>
          ) : null}
        </div>
      </div>

      {/* Lightbox */}
      {previewImage ? (
        <ChatImagePreview
          src={previewImage}
          onClose={() => setPreviewImage(null)}
        />
      ) : null}
    </>
  );
});
