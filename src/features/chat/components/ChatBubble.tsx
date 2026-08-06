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
import { Icon } from '@/shared/components/Icon';

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

function renderTextWithMentions(content: string, mentions?: ChatMention[]) {
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

function renderContent(content: string, mentions?: ChatMention[]) {
  const quoteMatch = content.match(/^↩️ "(.*?)"\n([\s\S]*)$/);

  if (quoteMatch) {
    const [, quoteText, bodyText] = quoteMatch;
    return (
      <div className="chat-bubble-content-with-quote">
        <div className="chat-bubble-quote-snippet">
          <Icon name="CornerUpLeft" size={12} />
          <span className="chat-bubble-quote-text">{quoteText}</span>
        </div>
        <div className="chat-bubble-text-body">
          {renderTextWithMentions(bodyText ?? '', mentions)}
        </div>
      </div>
    );
  }

  return renderTextWithMentions(content, mentions);
}

interface ChatBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  isOptimistic?: boolean;
  onRetry?: (message: ChatMessage) => void;
  onQuoteReply?: (message: ChatMessage) => void;
}

export const ChatBubble = memo(function ChatBubble({
  message,
  isMine,
  isOptimistic,
  onRetry,
  onQuoteReply,
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
        {/* Hover Quick Action Bar */}
        {!isOptimistic && (
          <div className="chat-bubble-quick-actions">
            <button
              type="button"
              className="chat-quick-action-btn"
              onClick={() => handleAddReaction('👍')}
              title="Thích 👍"
            >
              👍
            </button>
            <button
              type="button"
              className="chat-quick-action-btn"
              onClick={() => handleAddReaction('❤️')}
              title="Yêu thích ❤️"
            >
              ❤️
            </button>
            {onQuoteReply && (
              <button
                type="button"
                className="chat-quick-action-btn"
                onClick={() => onQuoteReply(message)}
                title="Trả lời tin nhắn"
              >
                <Icon name="CornerUpLeft" size={12} />
              </button>
            )}
            <button
              type="button"
              className="chat-quick-action-btn"
              onClick={handleCopyText}
              title="Sao chép văn bản"
            >
              <Icon name="Copy" size={12} />
            </button>
          </div>
        )}

        <div
          className={`chat-bubble ${isMine ? 'chat-bubble--mine' : 'chat-bubble--theirs'} ${statusClass}`}
        >
          {/* Pin indicator */}
          {message.is_pinned ? (
            <div
              className="chat-bubble-pin-indicator"
              title={CHAT_LABELS.PINNED_MESSAGES}
            >
              <Icon name="Pin" size={12} />
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
                <Icon name="FileText" size={24} />
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
              <Icon name="RotateCcw" size={12} />
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
                <Icon name="Smile" size={14} />
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
