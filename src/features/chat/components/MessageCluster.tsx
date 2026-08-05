import { memo } from 'react';

import type { ChatMessage } from '@/schema/chat.schema';
import type {
  MessageCluster as MessageClusterType,
  MessageStatus,
} from '@/features/chat/chat.types';

import { ChatBubble } from './ChatBubble';

interface MessageClusterProps {
  cluster: MessageClusterType;
  onRetry?: (message: ChatMessage) => void;
}

function formatClusterTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

function deriveMessageStatus(msg: ChatMessage, isMine: boolean): MessageStatus {
  if (msg.status === 'error') return 'failed';
  if (msg.status === 'pending') return 'sending';
  if (isMine && msg.read_at) return 'read';
  return 'sent'; // default sent
}

export const MessageCluster = memo(function MessageCluster({
  cluster,
  onRetry,
}: MessageClusterProps) {
  const { isMine, senderName, messages, timestamp } = cluster;
  const initials = senderName
    ? senderName
        .split(' ')
        .slice(-2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <div
      className={`chat-cluster ${isMine ? 'chat-cluster--mine' : 'chat-cluster--theirs'}`}
    >
      {!isMine && (
        <div className="chat-cluster-avatar" title={senderName}>
          {initials}
        </div>
      )}

      <div className="chat-cluster-content">
        {!isMine && (
          <div className="chat-cluster-header">
            {senderName && (
              <span className="chat-cluster-sender">{senderName}</span>
            )}
            <span className="chat-cluster-time">
              {formatClusterTime(timestamp)}
            </span>
          </div>
        )}

        <div className="chat-cluster-messages">
          {messages.map((msg, index) => {
            const status = deriveMessageStatus(msg, isMine);
            const isLast = index === messages.length - 1;
            return (
              <div key={msg.id} className="chat-cluster-bubble-wrapper">
                <ChatBubble
                  message={msg}
                  isMine={isMine}
                  isOptimistic={status === 'sending'}
                  onRetry={onRetry}
                />
                {isMine && isLast && (
                  <div
                    className={`chat-status-indicator chat-status-indicator--${status}`}
                  >
                    {status === 'sending' && (
                      <span className="chat-status-dot">○</span>
                    )}
                    {status === 'sent' && (
                      <span className="chat-status-check">✓</span>
                    )}
                    {status === 'delivered' && (
                      <span className="chat-status-check">✓✓</span>
                    )}
                    {status === 'read' && (
                      <span className="chat-status-check chat-status-check--read">
                        ✓✓
                      </span>
                    )}
                    {status === 'failed' && (
                      <span className="chat-status-error">!</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {isMine && (
          <div className="chat-cluster-footer-time">
            {formatClusterTime(timestamp)}
          </div>
        )}
      </div>
    </div>
  );
});
