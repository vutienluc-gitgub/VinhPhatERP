import { memo } from 'react';

import { CANNED_RESPONSES } from '@/schema/chat.schema';
import { Icon } from '@/shared/components/Icon';

interface Props {
  onSelectReply: (reply: string) => void;
  disabled?: boolean;
}

export const ChatQuickReplies = memo(function ChatQuickReplies({
  onSelectReply,
  disabled,
}: Props) {
  return (
    <div
      className="chat-quick-replies"
      role="region"
      aria-label="Tin nhắn mẫu nhanh"
    >
      <div className="chat-quick-replies-scroll">
        <span className="chat-quick-replies-tag">
          <Icon name="Zap" size={11} />
          <span>Gợi ý:</span>
        </span>
        {CANNED_RESPONSES.map((reply) => (
          <button
            key={reply}
            type="button"
            className="chat-quick-reply-pill"
            onClick={() => onSelectReply(reply)}
            disabled={disabled}
          >
            {reply}
          </button>
        ))}
      </div>
    </div>
  );
});
