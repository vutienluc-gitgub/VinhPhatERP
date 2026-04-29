import { memo, useCallback, useState } from 'react';

import { CHAT_LABELS, type ChatMessage } from '@/schema/chat.schema';

import { ChatImagePreview } from './ChatImagePreview';

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
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
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleRetry = useCallback(() => {
    if (onRetry) onRetry(message);
  }, [onRetry, message]);

  // System message
  if (message.message_type === 'system') {
    return (
      <div className="chat-system-msg">
        <span className="chat-system-msg-text">{message.content}</span>
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
      >
        <div
          className={`chat-bubble ${isMine ? 'chat-bubble--mine' : 'chat-bubble--theirs'} ${statusClass}`}
        >
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
          {message.content ? <div>{message.content}</div> : null}

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
            <span className="chat-bubble-time">
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
