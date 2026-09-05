import { memo, useCallback, useMemo, useState, type MouseEvent } from 'react';

import { CHAT_LABELS, type ChatMessage } from '@/schema/chat.schema';
import type {
  ChatMessageViewModel,
  MessagePresentation,
} from '@/features/chat/chat.types';
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
import { ChatQuoteBox } from './ChatQuoteBox';
import { ChatMessageMeta } from './ChatMessageMeta';

interface ChatBubbleProps {
  viewModel: ChatMessageViewModel;
  presentation?: MessagePresentation;
  isOptimistic?: boolean;
  onRetry?: (message: ChatMessage) => void;
  onQuoteReply?: (message: ChatMessage) => void;
  onScrollToMessage?: (messageId: string) => void;
}

export const ChatBubble = memo(function ChatBubble({
  viewModel,
  presentation,
  isOptimistic,
  onRetry,
  onQuoteReply,
  onScrollToMessage,
}: ChatBubbleProps) {
  const { message, position, isMine, timeFormatted, status } = viewModel;
  const { profile, user } = useAuth();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const togglePinMutation = useTogglePin(message.room_id);
  const addReactionMutation = useAddReaction(message.room_id);
  const removeReactionMutation = useRemoveReaction(message.room_id);

  const showTimestamp = presentation ? presentation.showTimestamp : true;
  const showDeliveryStatus = presentation
    ? presentation.showDeliveryStatus
    : isMine;
  const fullTimestamp = presentation?.fullTimestampTooltip || timeFormatted;
  const resolvedTime = showTimestamp ? timeFormatted : undefined;
  const resolvedStatus = showDeliveryStatus ? status : undefined;
  const hasMeta = Boolean(resolvedTime || (isMine && resolvedStatus));

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

  const handleScrollToMessage = useCallback(
    (targetMessageId?: string) => {
      if (!targetMessageId) return;
      if (onScrollToMessage) {
        onScrollToMessage(targetMessageId);
        return;
      }
      const targetElement = document.querySelector(
        `[data-message-id="${targetMessageId}"]`,
      );
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetElement.classList.add('chat-message-highlight');
        setTimeout(() => {
          targetElement.classList.remove('chat-message-highlight');
        }, 2000);
      }
    },
    [onScrollToMessage],
  );

  // Media geometry reservation (GOV-003): reserve intrinsic dimensions, 4:3 is fallback only
  const imageAspectRatio = useMemo(() => {
    if (!message.image_url) return '4 / 3';
    try {
      const url = new URL(message.image_url, 'https://dummy.local');
      const w = url.searchParams.get('w') || url.searchParams.get('width');
      const h = url.searchParams.get('h') || url.searchParams.get('height');
      if (w && h && !isNaN(Number(w)) && !isNaN(Number(h)) && Number(h) > 0) {
        return `${Number(w)} / ${Number(h)}`;
      }
    } catch {
      // Fallback below
    }
    return '4 / 3';
  }, [message.image_url]);

  // System message (journey updates)
  if (message.message_type === 'system') {
    return (
      <div className="chat-system-msg" title={fullTimestamp}>
        <span className="chat-system-msg-text">{message.content}</span>
      </div>
    );
  }

  // ePOD important events (signature confirmation, delivery complete)
  if (message.message_type === 'system_epod') {
    return (
      <div className="chat-system-epod" title={fullTimestamp}>
        <div className="chat-system-epod-content">{message.content}</div>
        <div className="chat-system-epod-time">{timeFormatted}</div>
      </div>
    );
  }

  const isError = !isOptimistic && message.status === 'error';
  const statusClass = isOptimistic
    ? 'chat-bubble--pending'
    : isError
      ? 'chat-bubble--error'
      : '';

  const legacyQuoteMatch = message.content
    ? message.content.match(/^↩️ "([^"]+)"\n([\s\S]*)$/)
    : null;
  const displayContent = legacyQuoteMatch
    ? legacyQuoteMatch[2]
    : message.content;
  const legacyQuoteSnippet = legacyQuoteMatch ? legacyQuoteMatch[1] : null;
  const isImageOnly =
    message.message_type === 'image' &&
    Boolean(message.image_url) &&
    !displayContent &&
    !message.reply_to_message &&
    !legacyQuoteSnippet;

  const isShortText =
    typeof displayContent === 'string' &&
    displayContent.length <= 35 &&
    !displayContent.includes('\n') &&
    !message.reply_to_message &&
    !legacyQuoteSnippet;

  const isMicroText =
    isShortText &&
    typeof displayContent === 'string' &&
    displayContent.length <= 6;

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
            onAddReaction={handleToggleReaction}
            onQuoteReply={onQuoteReply}
            onCopyText={handleCopyText}
          />
        )}

        <div
          className={`chat-bubble chat-bubble--pos-${position} ${
            isMine ? 'chat-bubble--mine' : 'chat-bubble--theirs'
          } ${statusClass} ${isImageOnly ? 'chat-bubble--image-only' : ''} ${
            viewModel.isEmojiOnly ? 'chat-bubble--emoji-only' : ''
          } ${isMicroText ? 'chat-bubble--micro' : ''}`}
          title={fullTimestamp}
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

          {/* Quoted Reply Box */}
          {(message.reply_to_message || legacyQuoteSnippet) && (
            <ChatQuoteBox
              replyToMessage={message.reply_to_message}
              fallbackSnippet={legacyQuoteSnippet}
              onClick={handleScrollToMessage}
            />
          )}

          {/* Image */}
          {message.message_type === 'image' && message.image_url ? (
            <div
              className="chat-bubble-image-container"
              style={{ aspectRatio: imageAspectRatio }}
            >
              <img
                src={getChatThumbnailUrl(message.image_url, 400, 400)}
                alt={CHAT_LABELS.IMAGE}
                className="chat-bubble-image"
                loading="lazy"
                onClick={() => setPreviewImage(message.image_url)}
              />
              <ChatMessageMeta
                time={resolvedTime}
                status={resolvedStatus}
                isMine={isMine}
                layoutMode="overlay"
              />
            </div>
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
              <ChatMessageMeta
                time={resolvedTime}
                status={resolvedStatus}
                isMine={isMine}
                layoutMode="side"
              />
            </a>
          ) : null}

          {/* Text content with Mention / Quote parsing */}
          {displayContent ? (
            isShortText ? (
              <div
                className={
                  hasMeta
                    ? 'chat-bubble-compact-flow'
                    : 'chat-bubble-text-only-row'
                }
              >
                <span className="chat-bubble-text-content">
                  <ChatMentionContent
                    content={displayContent}
                    mentions={message.mentions}
                  />
                </span>
                {hasMeta && (
                  <ChatMessageMeta
                    time={resolvedTime}
                    status={resolvedStatus}
                    isMine={isMine}
                    layoutMode="side"
                  />
                )}
              </div>
            ) : (
              <div className="chat-bubble-standard-flow">
                <span className="chat-bubble-text-content">
                  <ChatMentionContent
                    content={displayContent}
                    mentions={message.mentions}
                  />
                </span>
                {hasMeta && (
                  <ChatMessageMeta
                    time={resolvedTime}
                    status={resolvedStatus}
                    isMine={isMine}
                    layoutMode="inline"
                  />
                )}
              </div>
            )
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
