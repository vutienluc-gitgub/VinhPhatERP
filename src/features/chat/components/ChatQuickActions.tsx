import { memo, type MouseEvent } from 'react';

import { Icon } from '@/shared/components/Icon';
import { CHAT_LABELS, type ChatMessage } from '@/schema/chat.schema';

interface Props {
  message: ChatMessage;
  onAddReaction: (emoji: string) => void;
  onQuoteReply?: ((message: ChatMessage) => void) | undefined;
  onCopyText: () => void;
}

export const ChatQuickActions = memo(function ChatQuickActions({
  message,
  onAddReaction,
  onQuoteReply,
  onCopyText,
}: Props) {
  const handleAction = (e: MouseEvent, callback: () => void) => {
    e.stopPropagation();
    e.preventDefault();
    callback();
  };

  return (
    <div
      className="chat-bubble-quick-actions"
      onClick={(e) => e.stopPropagation()}
      role="toolbar"
      aria-label="Thao tác nhanh tin nhắn"
    >
      <button
        type="button"
        className="chat-quick-action-btn"
        onClick={(e) => handleAction(e, () => onAddReaction('like'))}
        title={CHAT_LABELS.LIKE}
        aria-label={CHAT_LABELS.LIKE}
      >
        <Icon name="ThumbsUp" size={13} />
      </button>
      <button
        type="button"
        className="chat-quick-action-btn"
        onClick={(e) => handleAction(e, () => onAddReaction('heart'))}
        title={CHAT_LABELS.HEART}
        aria-label={CHAT_LABELS.HEART}
      >
        <Icon name="Heart" size={13} />
      </button>
      {onQuoteReply && (
        <button
          type="button"
          className="chat-quick-action-btn"
          onClick={(e) => handleAction(e, () => onQuoteReply(message))}
          title={CHAT_LABELS.REPLY_MESSAGE}
          aria-label={CHAT_LABELS.REPLY_MESSAGE}
        >
          <Icon name="CornerUpLeft" size={13} />
        </button>
      )}
      <button
        type="button"
        className="chat-quick-action-btn"
        onClick={(e) => handleAction(e, onCopyText)}
        title={CHAT_LABELS.COPY_TEXT_ACTION}
        aria-label={CHAT_LABELS.COPY_TEXT_ACTION}
      >
        <Icon name="Copy" size={13} />
      </button>
    </div>
  );
});
