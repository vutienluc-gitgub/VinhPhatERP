import React from 'react';

import { CHAT_LABELS, type ChatMessage } from '@/schema/chat.schema';
import { Icon } from '@/shared/components/Icon';

interface ChatReplyBannerProps {
  replyingToMessage: ChatMessage | null;
  onCancelReply?: () => void;
}

export const ChatReplyBanner = React.memo(function ChatReplyBanner({
  replyingToMessage,
  onCancelReply,
}: ChatReplyBannerProps) {
  if (!replyingToMessage) return null;

  return (
    <div className="chat-reply-banner">
      <div className="chat-reply-banner-content">
        <div className="chat-reply-banner-header">
          <Icon name="CornerUpLeft" size={12} />
          <span>{CHAT_LABELS.REPLYING_TO}</span>
        </div>
        <p className="chat-reply-banner-text">
          {replyingToMessage.content || replyingToMessage.message_type}
        </p>
      </div>
      <button
        type="button"
        className="chat-reply-banner-close"
        onClick={onCancelReply}
        aria-label={CHAT_LABELS.CANCEL_REPLY}
      >
        <Icon name="X" size={14} />
      </button>
    </div>
  );
});
