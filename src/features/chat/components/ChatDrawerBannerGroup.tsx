import React from 'react';

import { CHAT_LABELS } from '@/schema/chat.schema';

export interface ChatDrawerBannerGroupProps {
  resolvedRoomId?: string;
  connectionStatus: string;
  pendingCount: number;
  isCreateRoomError: boolean;
  createRoomError?: string | null;
  onRetryRoom: () => void;
}

export const ChatDrawerBannerGroup = React.memo(function ChatDrawerBannerGroup({
  resolvedRoomId,
  connectionStatus,
  pendingCount,
  isCreateRoomError,
  createRoomError,
  onRetryRoom,
}: ChatDrawerBannerGroupProps) {
  return (
    <>
      {/* Connection Status Banner */}
      {resolvedRoomId && connectionStatus === 'reconnecting' ? (
        <div className="chat-connection-banner chat-connection-banner--warning">
          {CHAT_LABELS.CONNECTION_LOST}
        </div>
      ) : null}

      {/* Offline Pending Banner */}
      {pendingCount > 0 ? (
        <div className="chat-connection-banner chat-connection-banner--info">
          {pendingCount} {CHAT_LABELS.OFFLINE_PENDING_MSG}
        </div>
      ) : null}

      {/* Room Creation Fallback Error */}
      {isCreateRoomError ? (
        <div className="chat-message-list">
          <div className="chat-error-state">
            <p className="chat-error-msg">
              {createRoomError ?? CHAT_LABELS.SEND_ERROR}
            </p>
            <button
              type="button"
              className="chat-error-retry-btn"
              onClick={onRetryRoom}
            >
              {CHAT_LABELS.RETRY}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
});
