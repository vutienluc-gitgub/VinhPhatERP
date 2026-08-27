import { memo } from 'react';

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
  return (
    <div className="chat-bubble-quick-actions">
      <button
        type="button"
        className="chat-quick-action-btn"
        onClick={() => onAddReaction('👍')}
        title={CHAT_LABELS.LIKE}
      >
        👍
      </button>
      <button
        type="button"
        className="chat-quick-action-btn"
        onClick={() => onAddReaction('❤️')}
        title={CHAT_LABELS.HEART}
      >
        ❤️
      </button>
      {onQuoteReply && (
        <button
          type="button"
          className="chat-quick-action-btn"
          onClick={() => onQuoteReply(message)}
          title={CHAT_LABELS.REPLY_MESSAGE}
        >
          <Icon name="CornerUpLeft" size={12} />
        </button>
      )}
      <button
        type="button"
        className="chat-quick-action-btn"
        onClick={onCopyText}
        title={CHAT_LABELS.COPY_TEXT_ACTION}
      >
        <Icon name="Copy" size={12} />
      </button>
    </div>
  );
});
