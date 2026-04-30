import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import {
  useChatMessages,
  useChatRealtime,
  useChatOfflineSync,
  useGetOrCreateRoom,
  useSendMessage,
} from '@/application/chat';
import { CHAT_LABELS } from '@/schema/chat.schema';

import { ChatInputArea } from './components/ChatInputArea';
import { ChatMessageList } from './components/ChatMessageList';

import './chat.css';

interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
  entityType: string;
  entityId: string;
  title?: string;
  subtitle?: string;
}

export function ChatDrawer({
  open,
  onClose,
  entityType,
  entityId,
  title,
  subtitle,
}: ChatDrawerProps) {
  const createRoomMutation = useGetOrCreateRoom();

  // Get or create room on open
  const roomId = createRoomMutation.data;

  const {
    data,
    isLoading: messagesLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useChatMessages(roomId);

  const sendMutation = useSendMessage(roomId);

  // Subscribe to realtime (with reconnection + multi-tab sync)
  const { connectionStatus } = useChatRealtime(open ? roomId : undefined);

  // Auto-flush offline queue when online
  const { pendingCount } = useChatOfflineSync(open ? roomId : undefined);

  /**
   * Track which entity key has been triggered to prevent duplicate room
   * creation. The ref is immune to stale closures — unlike reading
   * `createRoomMutation.isPending` which was previously suppressed via
   * eslint-disable and could fire twice during fast prop changes.
   */
  const triggeredEntityKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const entityKey = `${entityType}:${entityId}`;
    if (open && triggeredEntityKeyRef.current !== entityKey) {
      triggeredEntityKeyRef.current = entityKey;
      createRoomMutation.mutate({ entityType, entityId });
    }
    if (!open) {
      triggeredEntityKeyRef.current = null;
    }
  }, [open, entityType, entityId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Retry handler for error state
  const handleRetryRoom = useCallback(() => {
    createRoomMutation.reset();
    triggeredEntityKeyRef.current = null;
    createRoomMutation.mutate({ entityType, entityId });
  }, [createRoomMutation, entityType, entityId]);

  const handleSend = useCallback(
    (content: string) => {
      if (!roomId) return;
      sendMutation.mutate({
        clientId: crypto.randomUUID(),
        content,
      });
    },
    [roomId, sendMutation],
  );

  const handleSendImage = useCallback(
    (imageUrl: string) => {
      if (!roomId) return;
      sendMutation.mutate({
        clientId: crypto.randomUUID(),
        content: '',
        messageType: 'image',
        imageUrl,
      });
    },
    [roomId, sendMutation],
  );

  if (!open) return null;

  const mount = document.getElementById('modal-root');
  if (!mount) return null;

  const isLoading = createRoomMutation.isPending || messagesLoading;

  return createPortal(
    <>
      <div
        className="chat-drawer-overlay"
        onClick={onClose}
        role="presentation"
      />
      <div
        className="chat-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={title ?? CHAT_LABELS.TITLE}
      >
        {/* Header */}
        <div className="chat-header">
          <div>
            <h3 className="chat-header-title">{title ?? CHAT_LABELS.TITLE}</h3>
            {subtitle ? (
              <p className="chat-header-subtitle">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="chat-close-btn"
            onClick={onClose}
            aria-label={CHAT_LABELS.CLOSE}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Room Creation Error — full error state with retry */}
        {createRoomMutation.isError ? (
          <div className="chat-message-list">
            <div className="chat-error-state">
              <p className="chat-error-msg">
                {createRoomMutation.error instanceof Error
                  ? createRoomMutation.error.message
                  : CHAT_LABELS.SEND_ERROR}
              </p>
              <button
                type="button"
                className="chat-error-retry-btn"
                onClick={handleRetryRoom}
              >
                {CHAT_LABELS.RETRY}
              </button>
            </div>
          </div>
        ) : null}

        {/* Connection Status Banner */}
        {roomId &&
        connectionStatus === 'disconnected' &&
        !createRoomMutation.isError ? (
          <div className="chat-connection-banner chat-connection-banner--error">
            {CHAT_LABELS.CONNECTION_LOST}
          </div>
        ) : null}
        {roomId && connectionStatus === 'reconnecting' ? (
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

        {/* Messages (only when room creation succeeded or is in progress) */}
        {!createRoomMutation.isError ? (
          <ChatMessageList
            pages={data?.pages}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onLoadMore={() => void fetchNextPage()}
            isLoading={isLoading}
          />
        ) : null}

        {/* Input */}
        <ChatInputArea
          onSend={handleSend}
          onSendImage={handleSendImage}
          roomId={roomId}
          disabled={
            !roomId ||
            createRoomMutation.isPending ||
            createRoomMutation.isError
          }
        />
      </div>
    </>,
    mount,
  );
}
