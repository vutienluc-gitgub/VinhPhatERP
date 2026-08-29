import { memo } from 'react';

import type { ChatMessage } from '@/schema/chat.schema';
import type { MessageCluster as MessageClusterType } from '@/features/chat/chat.types';

import { ChatBubble } from './ChatBubble';

interface MessageClusterProps {
  cluster: MessageClusterType;
  onRetry?: (message: ChatMessage) => void;
  onQuoteReply?: (message: ChatMessage) => void;
}

export const MessageCluster = memo(function MessageCluster({
  cluster,
  onRetry,
  onQuoteReply,
}: MessageClusterProps) {
  const { isMine, senderName, senderInitials, messages } = cluster;

  return (
    <div
      className={`chat-cluster ${
        isMine ? 'chat-cluster--mine' : 'chat-cluster--theirs'
      }`}
    >
      {!isMine && (
        <div className="chat-cluster-avatar" title={senderName}>
          <span>{senderInitials}</span>
        </div>
      )}

      <div className="chat-cluster-content">
        {!isMine && senderName && (
          <div className="chat-cluster-header">
            <span className="chat-cluster-sender">{senderName}</span>
          </div>
        )}

        <div className="chat-cluster-messages">
          {messages.map((vm) => (
            <ChatBubble
              key={vm.message.id}
              viewModel={vm}
              isOptimistic={vm.message.status === 'pending'}
              onRetry={onRetry}
              onQuoteReply={onQuoteReply}
            />
          ))}
        </div>
      </div>
    </div>
  );
});
