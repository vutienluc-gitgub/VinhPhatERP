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

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const notifData = event.notification.data || {};

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({
            type: 'NAVIGATE_FROM_NOTIFICATION',
            payload: notifData,
          });
          return client.focus();
        }
      }

      // Build target path with query parameters if opening fresh window
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
