import { Hono } from 'hono';

import {
  WebPushService,
  type PushNotificationPayload,
} from '@/services/web-push.service.js';

const notificationsRouter = new Hono();

/**
 * Dispatch Web Push Notification
 * POST /api/v1/notifications/push
 */
notificationsRouter.post('/push', async (c) => {
  let body: PushNotificationPayload;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Bad Request: Invalid JSON body' }, 400);
  }

  if (!body.title || !body.body) {
    return c.json(
      { error: 'Bad Request: title and body are required fields' },
      400,
    );
  }

  const result = await WebPushService.sendPushNotification(body);

  return c.json({
    success: result.sentCount > 0 || result.failedCount === 0,
    sentCount: result.sentCount,
    failedCount: result.failedCount,
    cleanedCount: result.cleanedCount,
    errors: result.errors,
  });
});

export default notificationsRouter;
