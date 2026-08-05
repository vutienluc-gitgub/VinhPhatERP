import { memo, useCallback, useState } from 'react';

import {
  CHAT_LABELS,
  type ChatMessage,
  type ChatMention,
} from '@/schema/chat.schema';
import { useAuth } from '@/shared/hooks/useAuth';
import {
  useTogglePin,
  useAddReaction,
  useRemoveReaction,
} from '@/application/chat';

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
  const { profile, user } = useAuth();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const togglePinMutation = useTogglePin(message.room_id);
  const addReactionMutation = useAddReaction(message.room_id);
  const removeReactionMutation = useRemoveReaction(message.room_id);

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

  const handleAddReaction = useCallback(
    (emoji: string) => {
      addReactionMutation.mutate({ messageId: message.id, emoji });
      setShowEmojiPicker(false);
    },
    [addReactionMutation, message.id],
  );

  const handleRemoveReaction = useCallback(
    (emoji: string) => {
      removeReactionMutation.mutate({ messageId: message.id, emoji });
    },
    [removeReactionMutation, message.id],
  );

  const handleToggleReaction = useCallback(
    (emoji: string) => {
      const existingReaction = message.reactions?.find(
        (r) => r.emoji === emoji && r.user_id === user?.id,
      );
      if (existingReaction) {
        handleRemoveReaction(emoji);
      } else {
        handleAddReaction(emoji);
      }
    },
    [message.reactions, user?.id, handleAddReaction, handleRemoveReaction],
  );

  const groupedReactions = useCallback(() => {
    if (!message.reactions) return [];
    const grouped = new Map<
      string,
      { emoji: string; count: number; user_ids: string[] }
    >();
    for (const r of message.reactions) {
      const existing = grouped.get(r.emoji);
      if (existing) {
        existing.count++;
        existing.user_ids.push(r.user_id);
      } else {
        grouped.set(r.emoji, {
          emoji: r.emoji,
          count: 1,
          user_ids: [r.user_id],
        });
      }
    }
    return Array.from(grouped.values());
  }, [message.reactions]);

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
        data-message-id={message.id}
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

          {/* File */}
          {message.message_type === 'file' && message.file_url ? (
            <a
              href={message.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="chat-bubble-file"
            >
              <div className="chat-bubble-file-icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div className="chat-bubble-file-info">
                <span className="chat-bubble-file-name">
                  {message.file_name || 'File'}
                </span>
                <span className="chat-bubble-file-type">
                  {message.file_type || 'File'}
                </span>
              </div>
            </a>
          ) : null}

          {/* Text content */}
          {message.content
            ? renderContent(message.content, message.mentions)
            : null}

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

          {/* Reactions */}
          {groupedReactions().length > 0 && (
            <div className="chat-reactions">
              {groupedReactions().map((r) => {
                const hasReacted = r.user_ids.includes(user?.id ?? '');
                return (
                  <button
                    key={r.emoji}
                    type="button"
                    className={`chat-reaction-btn ${hasReacted ? 'chat-reaction-btn--active' : ''}`}
                    onClick={() => handleToggleReaction(r.emoji)}
                    title={`${r.count} người đã react`}
                  >
                    <span className="chat-reaction-emoji">{r.emoji}</span>
                    <span className="chat-reaction-count">{r.count}</span>
                  </button>
                );
              })}
              <button
                type="button"
                className="chat-reaction-add-btn"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                title="Thêm reaction"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" />
                  <line x1="15" y1="9" x2="15.01" y2="9" />
                </svg>
              </button>
            </div>
          )}

          {/* Reaction Emoji Picker */}
          {showEmojiPicker && (
            <div className="chat-reaction-emoji-picker">
              {['👍', '👎', '❤️', '😂', '🔥', '🎉', '🙏', '🤝'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="chat-reaction-emoji-btn"
                  onClick={() => handleAddReaction(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
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
