import { memo, useCallback, useState, type MouseEvent } from 'react';

import { CHAT_LABELS, type ChatMessage } from '@/schema/chat.schema';
import { useAuth } from '@/shared/hooks/useAuth';
import {
  useTogglePin,
  useAddReaction,
  useRemoveReaction,
} from '@/application/chat';
import { Icon } from '@/shared/components/Icon';
import { getChatThumbnailUrl } from '@/shared/lib/chat-storage';

import { ChatImagePreview } from './ChatImagePreview';
import { ChatMentionContent } from './ChatMentionContent';
import { ChatQuickActions } from './ChatQuickActions';
import { ChatReactions } from './ChatReactions';

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

  const handleContextMenu = (e: MouseEvent) => {
    if (!canPin || isOptimistic) return;
    e.preventDefault();
    setShowContextMenu((prev) => !prev);
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
          <ChatQuickActions
            message={message}
            onAddReaction={handleAddReaction}
            onQuoteReply={onQuoteReply}
            onCopyText={handleCopyText}
          />
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
              src={getChatThumbnailUrl(message.image_url, 400, 400)}
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

          {/* Text content with Mention / Quote parsing */}
          {message.content ? (
            <ChatMentionContent
              content={message.content}
              mentions={message.mentions}
            />
          ) : null}

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

          {/* Reactions & Emoji Picker */}
          <ChatReactions
            reactions={message.reactions}
            currentUserId={user?.id}
            showEmojiPicker={showEmojiPicker}
            onToggleEmojiPicker={() => setShowEmojiPicker((prev) => !prev)}
            onToggleReaction={handleToggleReaction}
            onAddReaction={handleAddReaction}
          />
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
