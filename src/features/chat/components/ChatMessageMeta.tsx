import React from 'react';

import type { MessageStatus } from '@/features/chat/chat.types';

interface ChatMessageMetaProps {
  time: string;
  status: MessageStatus;
  isMine: boolean;
  layoutMode?: 'inline' | 'side' | 'overlay';
}

export const ChatMessageMeta = React.memo(function ChatMessageMeta({
  time,
  status,
  isMine,
  layoutMode = 'side',
}: ChatMessageMetaProps) {
  if (!time && !isMine) return null;

  return (
    <span
      className={`chat-message-meta chat-message-meta--${layoutMode} ${
        isMine ? 'chat-message-meta--mine' : 'chat-message-meta--theirs'
      }`}
    >
      <span className="chat-meta-time">{time}</span>

      {isMine && (
        <span
          className={`chat-meta-status chat-meta-status--${status}`}
          aria-label={status}
        >
          {status === 'sending' && <span className="chat-status-dot">○</span>}
          {status === 'sent' && <span className="chat-status-check">✓</span>}
          {status === 'delivered' && (
            <span className="chat-status-check">✓✓</span>
          )}
          {status === 'read' && (
            <span className="chat-status-check chat-status-check--read">
              ✓✓
            </span>
          )}
          {status === 'failed' && <span className="chat-status-error">!</span>}
        </span>
      )}
    </span>
  );
});
