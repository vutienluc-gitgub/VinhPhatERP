// Service Worker — Web Push Notification & Deep Link Navigation for Vinh Phat ERP

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = {
      title: 'Vinh Phat ERP',
      body: event.data.text() || 'Bạn có thông báo mới.',
    };
  }

  event.waitUntil((async () => {
    // ── CHAT MESSAGE LOGIC ──
    if (payload.action === 'chat' && payload.roomId) {
      const roomId = payload.roomId;
      const messageId = payload.messageId || payload.message_id;
      const messageBody = payload.body;
      const senderName = payload.senderName || payload.title;
      const unreadCount = payload.unreadCount || 1;

      // 1. Check if the chat room is currently open and visible
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const isRoomOpenAndVisible = allClients.some(client => {
        return client.visibilityState === 'visible' && client.url.includes(roomId);
      });

      // 2. If open and visible in foreground, skip push notification
      if (isRoomOpenAndVisible) {
        return;
      }

      const url = messageId
        ? `/?chatOpen=1&roomId=${roomId}&messageId=${messageId}`
        : `/?chatOpen=1&roomId=${roomId}`;

      // 3. Otherwise show push notification
      await self.registration.showNotification(senderName, {
        body: messageBody,
        icon: '/icon-192.png', // Fallback to main app icon
        badge: '/icon-192.png',
        tag: `chat-${roomId}-${Date.now()}`, // Unique timestamp tag so iOS alerts on Lock Screen for each message
        data: { url, action: 'chat', roomId, messageId },
        vibrate: [100, 50, 100],
      });

      if ('setAppBadge' in navigator) {
        // @ts-ignore
        navigator.setAppBadge(unreadCount).catch(() => {});
      }
      return;
    }

    // ── NORMAL NOTIFICATION LOGIC ──
    const title = payload.title || 'Vinh Phat ERP';
    const options = {
      body: payload.body || 'Bạn có thông báo công việc mới.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: payload.notification_id || `vp-${Date.now()}`,
      data: {
        notification_id: payload.notification_id,
        entity_type: payload.entity_type,
        entity_id: payload.entity_id,
        action: payload.action,
      },
      vibrate: [100, 50, 100],
    };

    const notifPromise = self.registration.showNotification(title, options);
    const badgePromise =
      typeof navigator !== 'undefined' && 'setAppBadge' in navigator
        ? typeof payload.unread_count === 'number'
          // @ts-ignore
          ? navigator.setAppBadge(payload.unread_count).catch(() => {})
          // @ts-ignore
          : navigator.setAppBadge().catch(() => {})
        : Promise.resolve();

    await Promise.all([notifPromise, badgePromise]);
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const notifData = event.notification.data || {};

  if (typeof navigator !== 'undefined' && 'clearAppBadge' in navigator) {
    // @ts-ignore
    navigator.clearAppBadge().catch(() => {});
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 1. Try to focus an existing window
      for (const client of clientList) {
        if ('focus' in client) {
          // If it's a chat notification, navigate to chat
          if (notifData.action === 'chat' && notifData.roomId) {
            client.postMessage({
              type: 'NAVIGATE_TO_CHAT',
              payload: {
                roomId: notifData.roomId,
                messageId: notifData.messageId,
              },
            });
          } else {
            client.postMessage({
              type: 'NAVIGATE_FROM_NOTIFICATION',
              payload: notifData,
            });
          }
          return client.focus();
        }
      }

      // 2. Open new window if none exists
      if (notifData.action === 'chat' && notifData.url) {
        if (self.clients.openWindow) {
          return self.clients.openWindow(notifData.url);
        }
      }

      // Build target path with query parameters if opening fresh window for normal notification
      const params = new URLSearchParams();
      if (notifData.entity_type) params.set('notif_entity', notifData.entity_type);
      if (notifData.entity_id) params.set('notif_id', notifData.entity_id);
      if (notifData.action) params.set('notif_action', notifData.action);

      const queryString = params.toString();
      const targetUrl = queryString ? `/?${queryString}` : '/';

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    }),
  );
});
