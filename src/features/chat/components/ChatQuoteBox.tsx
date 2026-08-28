import React, { memo } from 'react';

import { CHAT_LABELS } from '@/schema/chat.schema';

interface ChatQuoteBoxProps {
  replyToMessage?: {
    id?: string;
    sender_name?: string | null;
    content?: string | null;
    message_type?: string | null;
  } | null;
  /** Fallback content snippet if reply is embedded as text */
  fallbackSnippet?: string | null;
  /** Callback when user clicks the quote box to smooth scroll to original message */
  onClick?: (messageId?: string) => void;
}

export const ChatQuoteBox = memo(function ChatQuoteBox({
  replyToMessage,
  fallbackSnippet,
  onClick,
}: ChatQuoteBoxProps) {
  if (!replyToMessage && !fallbackSnippet) return null;

  const authorName =
    replyToMessage?.sender_name ||
    (fallbackSnippet ? CHAT_LABELS.REPLY_MESSAGE : CHAT_LABELS.UNKNOWN_USER);
  const snippetContent =
    replyToMessage?.content ||
    (replyToMessage?.message_type === 'image'
      ? CHAT_LABELS.IMAGE
      : fallbackSnippet || '');

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick && replyToMessage?.id) {
      onClick(replyToMessage.id);
    }
  };

  return (
    <div
      className="chat-quote-box"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      title="Bấm để cuộn tới tin nhắn gốc"
    >
      <span className="chat-quote-author">{authorName}</span>
      <span className="chat-quote-text">{snippetContent}</span>
    </div>
  );
});
