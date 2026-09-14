import { useCallback, useEffect, useMemo, useRef } from 'react';

import {
  useChatMessages,
  useChatRealtime,
  useChatOfflineSync,
  useChatRoom,
  useGetOrCreateRoom,
  useSendMessage,
  useMarkAsRead,
} from '@/application/chat';
import {
  registerOpenRoom,
  unregisterOpenRoom,
} from '@/application/chat/useChatNotifications';
import { deriveChatTimelineState } from '@/domain/chat';
import {
  extractChronologicalMessages,
  formatReplyMessagePayload,
  scrollToAndHighlightMessage,
} from '@/features/chat/chat.utils';
import type { ChatMessage, ChatMention } from '@/schema/chat.schema';
import { useAuth } from '@/shared/hooks/useAuth';

export interface UseChatDrawerOrchestrationOptions {
  open: boolean;
  entityType?: string;
  entityId?: string;
  roomId?: string;
  messageId?: string;
}

export function useChatDrawerOrchestration({
  open,
  entityType,
  entityId,
  roomId: propRoomId,
  messageId: propMessageId,
}: UseChatDrawerOrchestrationOptions) {
  const { user, loading: authLoading } = useAuth();
  const isAuthReady = !authLoading && Boolean(user);

  // Invariant 1: If canonical roomId is provided, NEVER re-resolve via entity/customerId
  const hasDirectRoomId = Boolean(propRoomId && propRoomId.trim() !== '');

  const { data: cachedRoom, isLoading: isFetchingCachedRoom } = useChatRoom(
    entityType ?? '',
    open && !hasDirectRoomId ? entityId : undefined,
  );
  const createRoomMutation = useGetOrCreateRoom();

  const resolvedRoomId =
    propRoomId || cachedRoom?.id || createRoomMutation.data;

  const isResolvingRoom =
    !hasDirectRoomId &&
    (isFetchingCachedRoom ||
      createRoomMutation.isPending ||
      (!resolvedRoomId && Boolean(entityType && entityId)));

  const {
    data,
    isLoading: messagesLoading,
    isError: messagesError,
    error: messagesErrObj,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useChatMessages(resolvedRoomId);

  const sendMutation = useSendMessage(resolvedRoomId);

  // Subscribe to realtime (with reconnection + multi-tab sync)
  const { connectionStatus } = useChatRealtime(
    open ? resolvedRoomId : undefined,
  );

  // Auto-flush offline queue when online
  const { pendingCount } = useChatOfflineSync(
    open ? resolvedRoomId : undefined,
  );

  /**
   * Track which entity key has been triggered to prevent duplicate room creation.
   */
  const triggeredEntityKeyRef = useRef<string | null>(null);

  useEffect(() => {
    // Invariant: Skip fallback room creation if canonical roomId is already given
    if (hasDirectRoomId || cachedRoom?.id || !entityType || !entityId) return;

    const entityKey = `${entityType}:${entityId}`;
    if (open && triggeredEntityKeyRef.current !== entityKey) {
      triggeredEntityKeyRef.current = entityKey;
      createRoomMutation.mutate({ entityType, entityId });
    }
    if (!open) {
      triggeredEntityKeyRef.current = null;
    }
  }, [open, entityType, entityId, hasDirectRoomId, cachedRoom?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mark room as read when drawer is open
  const markAsRead = useMarkAsRead(resolvedRoomId);
  useEffect(() => {
    if (open && resolvedRoomId) {
      markAsRead();
    }
  }, [open, resolvedRoomId, markAsRead, data]);

  // Register room globally so notifications are muted for this active room
  useEffect(() => {
    if (!open || !resolvedRoomId) return;
    registerOpenRoom(resolvedRoomId);
    return () => {
      unregisterOpenRoom(resolvedRoomId);
    };
  }, [open, resolvedRoomId]);

  // Derive deterministic ChatTimelineState
  const flattenedMessages = useMemo(
    () => extractChronologicalMessages(data?.pages),
    [data?.pages],
  );

  const timelineState = useMemo(() => {
    const hasError = Boolean(
      (resolvedRoomId && messagesError) ||
      (!resolvedRoomId && createRoomMutation.isError),
    );
    const activeError = resolvedRoomId
      ? messagesErrObj
      : createRoomMutation.error;

    return deriveChatTimelineState({
      isAuthReady,
      isResolvingRoom,
      roomId: resolvedRoomId,
      isLoadingMessages: messagesLoading,
      isError: hasError,
      error: activeError,
      messages: flattenedMessages,
      hasNextPage,
    });
  }, [
    isAuthReady,
    isResolvingRoom,
    resolvedRoomId,
    messagesLoading,
    createRoomMutation.isError,
    createRoomMutation.error,
    messagesError,
    messagesErrObj,
    flattenedMessages,
    hasNextPage,
  ]);

  // Deep link direct message jump / highlight
  useEffect(() => {
    if (propMessageId && timelineState.status === 'ready') {
      const cleanup = scrollToAndHighlightMessage(propMessageId);
      return cleanup;
    }
    return undefined;
  }, [propMessageId, timelineState.status]);

  // Retry handler for error state
  const handleRetryRoom = useCallback(() => {
    if (entityType && entityId) {
      createRoomMutation.reset();
      triggeredEntityKeyRef.current = null;
      createRoomMutation.mutate({ entityType, entityId });
    }
  }, [createRoomMutation, entityType, entityId]);

  const handleSend = useCallback(
    (
      content: string,
      meta?: {
        mentions?: ChatMention[];
        replyToId?: string | null;
        replyToMessage?: ChatMessage | null;
      },
    ) => {
      if (!resolvedRoomId) return;
      sendMutation.mutate({
        clientId: crypto.randomUUID(),
        content,
        mentions: meta?.mentions,
        replyToId: meta?.replyToId,
        replyToMessage: formatReplyMessagePayload(meta?.replyToMessage),
      });
    },
    [resolvedRoomId, sendMutation],
  );

  const handleSendImage = useCallback(
    (url: string) => {
      if (!resolvedRoomId) return;
      sendMutation.mutate({
        clientId: crypto.randomUUID(),
        content: '',
        messageType: 'image',
        imageUrl: url,
      });
    },
    [resolvedRoomId, sendMutation],
  );

  const handleSendFile = useCallback(
    (url: string, fileName: string, fileType: string) => {
      if (!resolvedRoomId) return;
      sendMutation.mutate({
        clientId: crypto.randomUUID(),
        content: '',
        messageType: 'file',
        fileUrl: url,
        fileName,
        fileType,
      });
    },
    [resolvedRoomId, sendMutation],
  );

  const createRoomErrorMessage = useMemo(() => {
    if (!createRoomMutation.isError) return null;
    const err = createRoomMutation.error;
    if (err instanceof Error) {
      return err.message;
    }
    if (
      err &&
      typeof err === 'object' &&
      'message' in err &&
      typeof (err as { message?: unknown }).message === 'string'
    ) {
      return (err as { message: string }).message;
    }
    return null;
  }, [createRoomMutation.isError, createRoomMutation.error]);

  return {
    resolvedRoomId,
    isResolvingRoom,
    timelineState,
    data,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    connectionStatus,
    pendingCount,
    createRoomError: createRoomErrorMessage,
    isCreateRoomError: createRoomMutation.isError,
    handleRetryRoom,
    handleSend,
    handleSendImage,
    handleSendFile,
  };
}
