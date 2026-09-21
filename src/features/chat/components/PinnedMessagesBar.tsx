import { useState } from 'react';

import { usePinnedMessages } from '@/application/chat';
import { CHAT_LABELS, type ChatMessage } from '@/schema/chat.schema';

interface PinnedMessagesBarProps {
  roomId: string;
}

export function PinnedMessagesBar({ roomId }: PinnedMessagesBarProps) {
  const { data: pinnedMessages = [] } = usePinnedMessages(roomId);
  const [expanded, setExpanded] = useState(false);

  if (pinnedMessages.length === 0) return null;

  const topMessage = pinnedMessages[0] as ChatMessage;

  return (
    <div className="chat-pinned-bar">
      <div
        className="chat-pinned-header"
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
      >
        <div className="chat-pinned-icon">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="17" x2="12" y2="22"></line>
            <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.6V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3v4.6a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
          </svg>
        </div>
        <div className="chat-pinned-summary">
          <span className="chat-pinned-label">
            {pinnedMessages.length} {CHAT_LABELS.PINNED_MESSAGES.toLowerCase()}
          </span>
          {!expanded && (
            <span className="chat-pinned-preview">
              {topMessage.message_type === 'image'
                ? '🖼️ Hình ảnh'
                : topMessage.content}
            </span>
          )}
        </div>
        <div className="chat-pinned-chevron">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: expanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
            }}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="chat-pinned-list">
          {pinnedMessages.map((msg) => (
            <div key={msg.id} className="chat-pinned-item">
              <div className="chat-pinned-item-content">
                {msg.message_type === 'image' ? '🖼️ Hình ảnh' : msg.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
