import type { ChatMessage } from '@/schema/chat.schema';

export type ChatNavigationSource =
  | 'notification'
  | 'inbox'
  | 'customer'
  | 'order'
  | 'shipment'
  | 'url';

export interface ChatNavigationIntent {
  roomId: string;
  messageId?: string;
  source: ChatNavigationSource;
  entityType?: string;
  entityId?: string;
  title?: string;
  subtitle?: string;
}

export type ChatErrorCode =
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'NETWORK'
  | 'AUTH_REQUIRED'
  | 'UNKNOWN';

export type ChatTimelineState =
  | { status: 'initializing' }
  | { status: 'resolving-room' }
  | { status: 'loading' }
  | { status: 'ready'; messages: ChatMessage[]; hasNextPage?: boolean }
  | { status: 'empty' }
  | { status: 'error'; error: Error; code: ChatErrorCode };

/**
 * Normalizes query state and data into a single, deterministic ChatTimelineState machine.
 * Enforces that `status === 'empty'` ONLY when query has strictly succeeded with 0 messages.
 */
export function deriveChatTimelineState(params: {
  isAuthReady: boolean;
  isResolvingRoom: boolean;
  roomId?: string;
  isLoadingMessages: boolean;
  isError: boolean;
  error: unknown;
  messages?: ChatMessage[];
  hasNextPage?: boolean;
}): ChatTimelineState {
  const {
    isAuthReady,
    isResolvingRoom,
    roomId,
    isLoadingMessages,
    isError,
    error,
    messages,
    hasNextPage,
  } = params;

  if (!isAuthReady) {
    return { status: 'initializing' };
  }

  if (isResolvingRoom || !roomId) {
    return { status: 'resolving-room' };
  }

  if (isError) {
    const errObj = error instanceof Error ? error : new Error(String(error));
    const msgLower = errObj.message.toLowerCase();
    let code: ChatErrorCode = 'UNKNOWN';

    if (
      msgLower.includes('access denied') ||
      msgLower.includes('not a participant') ||
      msgLower.includes('permission denied')
    ) {
      code = 'FORBIDDEN';
    } else if (msgLower.includes('not found')) {
      code = 'NOT_FOUND';
    } else if (msgLower.includes('auth') || msgLower.includes('session')) {
      code = 'AUTH_REQUIRED';
    } else if (
      msgLower.includes('network') ||
      msgLower.includes('failed to fetch')
    ) {
      code = 'NETWORK';
    }

    return { status: 'error', error: errObj, code };
  }

  if (isLoadingMessages) {
    return { status: 'loading' };
  }

  if (!messages || messages.length === 0) {
    return { status: 'empty' };
  }

  return { status: 'ready', messages, hasNextPage };
}
