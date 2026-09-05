import { memo } from 'react';

import type { ChatMessage } from '@/schema/chat.schema';
import type {
  MessageCluster as MessageClusterType,
  MessagePresentation,
} from '@/features/chat/chat.types';
import { formatFullAuditTime } from '@/features/chat/chat.utils';
import { Avatar } from '@/shared/components';

import { ChatBubble } from './ChatBubble';

interface MessageClusterProps {
  cluster: MessageClusterType;
  onRetry?: (message: ChatMessage) => void;
  onQuoteReply?: (message: ChatMessage) => void;
  onScrollToMessage?: (messageId: string) => void;
}

export const MessageCluster = memo(function MessageCluster({
  cluster,
  onRetry,
  onQuoteReply,
  onScrollToMessage,
}: MessageClusterProps) {
  const { isMine, senderId, senderName, senderAvatarUrl, messages } = cluster;
  const count = messages.length;

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
          {messages.map((vm, index) => {
            const isFirst = index === 0;
            const isLast = index === count - 1;
            const prevVm = index > 0 ? messages[index - 1] : null;

            const hasMinuteBoundary = prevVm
              ? vm.timeFormatted !== prevVm.timeFormatted
              : false;

            const showTimestamp =
              vm.position === 'single' || isLast || hasMinuteBoundary;
            const showDeliveryStatus =
              isMine && (vm.position === 'single' || isLast);

            const presentation: MessagePresentation = {
              position: vm.position,
              showAvatar: !isMine && (vm.position === 'single' || isFirst),
              showSenderName:
                !isMine &&
                (vm.position === 'single' || isFirst) &&
                Boolean(senderName),
              showTimestamp,
              showDeliveryStatus,
              fullTimestampTooltip: formatFullAuditTime(vm.message.created_at),
            };

            return (
              <ChatBubble
                key={vm.message.id || vm.message.client_id}
                viewModel={vm}
                presentation={presentation}
                isOptimistic={vm.message.status === 'pending'}
                onRetry={onRetry}
                onQuoteReply={onQuoteReply}
                onScrollToMessage={onScrollToMessage}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
});
