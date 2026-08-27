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
    >
      <button
        type="button"
        className="chat-quick-action-btn"
        onClick={(e) => handleAction(e, () => onAddReaction('👍'))}
        title={CHAT_LABELS.LIKE}
      >
        👍
      </button>
      <button
        type="button"
        className="chat-quick-action-btn"
        onClick={(e) => handleAction(e, () => onAddReaction('❤️'))}
        title={CHAT_LABELS.HEART}
      >
        ❤️
      </button>
      {onQuoteReply && (
        <button
          type="button"
          className="chat-quick-action-btn"
          onClick={(e) => handleAction(e, () => onQuoteReply(message))}
          title={CHAT_LABELS.REPLY_MESSAGE}
        >
          <Icon name="CornerUpLeft" size={12} />
        </button>
      )}
      <button
        type="button"
        className="chat-quick-action-btn"
        onClick={(e) => handleAction(e, onCopyText)}
        title={CHAT_LABELS.COPY_TEXT_ACTION}
      >
        <Icon name="Copy" size={12} />
      </button>
    </div>
  );
});
