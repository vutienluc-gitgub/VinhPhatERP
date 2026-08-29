import { useSyncExternalStore, useEffect } from 'react';

import type {
  ChatNavigationIntent,
  ChatNavigationSource,
} from '@/domain/chat/chat.navigation';

interface ChatNavigationState {
  isOpen: boolean;
  activeIntent: ChatNavigationIntent | null;
}

let state: ChatNavigationState = {
  isOpen: false,
  activeIntent: null,
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export const chatNavigationStore = {
  getState(): ChatNavigationState {
    return state;
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  openChat(intent: ChatNavigationIntent) {
    state = {
      isOpen: true,
      activeIntent: intent,
    };
    notify();
  },

  openChatByRoomId(
    roomId: string,
    messageId?: string,
    source: ChatNavigationSource = 'inbox',
  ) {
    this.openChat({
      roomId,
      messageId,
      source,
    });
  },

  openChatByEntity(
    entityType: string,
    entityId: string,
    title?: string,
    subtitle?: string,
  ) {
    state = {
      isOpen: true,
      activeIntent: {
        roomId: '', // Empty indicates entity resolution fallback required
        entityType,
        entityId,
        title,
        subtitle,
        source: 'customer',
      },
    };
    notify();
  },

  closeChat() {
    state = {
      isOpen: false,
      activeIntent: null,
    };
    notify();
  },

  parseChatNavigationFromUrl(
    searchParams: URLSearchParams,
  ): ChatNavigationIntent | null {
    if (searchParams.get('chatOpen') !== '1') return null;

    const roomId = searchParams.get('roomId') || '';
    const messageId = searchParams.get('messageId') || undefined;
    const entityType = searchParams.get('entityType') || undefined;
    const entityId = searchParams.get('entityId') || undefined;

    return {
      roomId,
      messageId,
      entityType,
      entityId,
      source: 'notification',
    };
  },
};

/**
 * Hook to consume Chat Navigation State across any layout or component.
 */
export function useChatNavigation() {
  const current = useSyncExternalStore(
    chatNavigationStore.subscribe,
    chatNavigationStore.getState,
  );

  return {
    isOpen: current.isOpen,
    activeIntent: current.activeIntent,
    openChat: chatNavigationStore.openChat.bind(chatNavigationStore),
    openChatByRoomId:
      chatNavigationStore.openChatByRoomId.bind(chatNavigationStore),
    openChatByEntity:
      chatNavigationStore.openChatByEntity.bind(chatNavigationStore),
    closeChat: chatNavigationStore.closeChat.bind(chatNavigationStore),
  };
}

/**
 * Unified listener that binds Service Worker push notifications and URL query params
 * to the centralized ChatNavigationController.
 */
export function useChatNavigationSync() {
  useEffect(() => {
    // 1. Parse initial URL search params (Cold Start from push notification or deep link)
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const intent =
        chatNavigationStore.parseChatNavigationFromUrl(searchParams);

      if (intent) {
        chatNavigationStore.openChat(intent);
        // Clean up navigation query params from browser URL bar without reload
        const newParams = new URLSearchParams(window.location.search);
        newParams.delete('chatOpen');
        newParams.delete('roomId');
        newParams.delete('messageId');
        newParams.delete('entityType');
        newParams.delete('entityId');
        const newQuery = newParams.toString();
        const newUrl =
          window.location.pathname + (newQuery ? `?${newQuery}` : '');
        window.history.replaceState({}, '', newUrl);
      }
    }

    // 2. Listen for Service Worker postMessage (Warm Start from background push notification)
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    function handleServiceWorkerMessage(event: MessageEvent) {
      if (event.data?.type === 'NAVIGATE_TO_CHAT') {
        const payload = event.data.payload || {};
        if (payload.roomId) {
          chatNavigationStore.openChat({
            roomId: payload.roomId,
            messageId: payload.messageId,
            source: 'notification',
          });
        }
      }
    }

    navigator.serviceWorker.addEventListener(
      'message',
      handleServiceWorkerMessage,
    );

    return () => {
      navigator.serviceWorker.removeEventListener(
        'message',
        handleServiceWorkerMessage,
      );
    };
  }, []);
}
