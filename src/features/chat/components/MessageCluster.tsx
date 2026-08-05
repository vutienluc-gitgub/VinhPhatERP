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
  onQuoteReply?: (message: ChatMessage) => void;
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
  onQuoteReply,
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

  const lastMessage = messages[messages.length - 1];
  const lastStatus: MessageStatus = lastMessage
    ? deriveMessageStatus(lastMessage, isMine)
    : 'sent';

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
        {!isMine && senderName && (
          <div className="chat-cluster-header">
            <span className="chat-cluster-sender">{senderName}</span>
          </div>
        )}

        <div className="chat-cluster-messages">
          {messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              message={msg}
              isMine={isMine}
              isOptimistic={msg.status === 'pending'}
              onRetry={onRetry}
              onQuoteReply={onQuoteReply}
            />
          ))}
        </div>

        <div className="chat-cluster-meta">
          <span className="chat-cluster-time">
            {formatClusterTime(timestamp)}
          </span>
          {isMine && (
            <span
              className={`chat-status-indicator chat-status-indicator--${lastStatus}`}
            >
              {lastStatus === 'sending' && (
                <span className="chat-status-dot">○</span>
              )}
              {lastStatus === 'sent' && (
                <span className="chat-status-check">✓</span>
              )}
              {lastStatus === 'delivered' && (
                <span className="chat-status-check">✓✓</span>
              )}
              {lastStatus === 'read' && (
                <span className="chat-status-check chat-status-check--read">
                  ✓✓
                </span>
              )}
              {lastStatus === 'failed' && (
                <span className="chat-status-error">!</span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
