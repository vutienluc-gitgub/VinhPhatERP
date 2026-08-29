import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { resolveDeepLink } from '@/shared/notifications/deepLinkResolver';
import { chatNavigationStore } from '@/features/chat/controllers/chatNavigationStore';

/**
 * Hook to listen for Notification Clicks (from Service Worker message or PWA launch query params)
 * and route to the corresponding business screen.
 */
export function useNotificationDeepLink() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. Handle URL Query Params (when app opened fresh from notification click)
  useEffect(() => {
    // 1A. Chat Notification Deep Link
    if (searchParams.get('chatOpen') === '1') {
      const intent =
        chatNavigationStore.parseChatNavigationFromUrl(searchParams);
      if (intent) {
        chatNavigationStore.openChat(intent);
      }
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('chatOpen');
      newParams.delete('roomId');
      newParams.delete('messageId');
      newParams.delete('entityType');
      newParams.delete('entityId');
      setSearchParams(newParams, { replace: true });
      return;
    }

    // 1B. Standard ERP Notification Deep Link
    const entityType = searchParams.get('notif_entity');
    const entityId = searchParams.get('notif_id');
    const action = searchParams.get('notif_action') || undefined;

    if (entityType && entityId) {
      const targetUrl = resolveDeepLink({
        entity_type: entityType,
        entity_id: entityId,
        action,
      });

      // Clear the query params from current URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('notif_entity');
      newParams.delete('notif_id');
      newParams.delete('notif_action');
      setSearchParams(newParams, { replace: true });

      // Navigate to target entity
      navigate(targetUrl);
    }
  }, [searchParams, setSearchParams, navigate]);

  // 2. Handle Service Worker postMessage (when app was already open in a tab)
  useEffect(() => {
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
        return;
      }

      if (event.data?.type === 'NAVIGATE_FROM_NOTIFICATION') {
        const payload = event.data.payload || {};
        if (payload.entity_type && payload.entity_id) {
          const targetUrl = resolveDeepLink({
            entity_type: payload.entity_type,
            entity_id: payload.entity_id,
            action: payload.action,
          });
          navigate(targetUrl);
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
  }, [navigate]);
}
