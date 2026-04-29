import { useCallback } from 'react';
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

  // Ensure room exists when drawer opens
  const handleOpen = useCallback(() => {
    if (!createRoomMutation.data && !createRoomMutation.isPending) {
      createRoomMutation.mutate({ entityType, entityId });
    }
  }, [createRoomMutation, entityType, entityId]);

  // Trigger room creation on first open
  if (open && !roomId && !createRoomMutation.isPending) {
    handleOpen();
  }

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
            aria-label="Dong"
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

        {/* Error Banner */}
        {createRoomMutation.isError ? (
          <div className="chat-connection-banner chat-connection-banner--error">
            {createRoomMutation.error instanceof Error
              ? createRoomMutation.error.message
              : CHAT_LABELS.SEND_ERROR}
          </div>
        ) : null}

        {/* Connection Status Banner */}
        {connectionStatus === 'disconnected' && !createRoomMutation.isError ? (
          <div className="chat-connection-banner chat-connection-banner--error">
            {CHAT_LABELS.CONNECTION_LOST}
          </div>
        ) : null}
        {connectionStatus === 'reconnecting' ? (
          <div className="chat-connection-banner chat-connection-banner--warning">
            {CHAT_LABELS.CONNECTION_LOST}
          </div>
        ) : null}

        {/* Offline Pending Banner */}
        {pendingCount > 0 ? (
          <div className="chat-connection-banner chat-connection-banner--info">
            {pendingCount} tin nhan cho gui
          </div>
        ) : null}

        {/* Messages */}
        <ChatMessageList
          pages={data?.pages}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={() => void fetchNextPage()}
          isLoading={isLoading}
        />

        {/* Input */}
        <ChatInputArea
          onSend={handleSend}
          onSendImage={handleSendImage}
          roomId={roomId}
          disabled={!roomId || createRoomMutation.isPending}
        />
      </div>
    </>,
    mount,
  );
}
