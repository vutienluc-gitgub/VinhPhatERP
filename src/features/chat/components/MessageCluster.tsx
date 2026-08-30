import { memo } from 'react';

import type { ChatMessage } from '@/schema/chat.schema';
import type { MessageCluster as MessageClusterType } from '@/features/chat/chat.types';
import { Avatar } from '@/shared/components';

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
  const { isMine, senderId, senderName, senderAvatarUrl, messages } = cluster;

  return (
    <div
      className={`chat-cluster ${
        isMine ? 'chat-cluster--mine' : 'chat-cluster--theirs'
      }`}
    >
      {!isMine && (
        <Avatar
          userId={senderId}
          name={senderName}
          src={senderAvatarUrl}
          size="sm"
          className="chat-cluster-avatar"
        />
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
              key={vm.message.id || vm.message.client_id}
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
