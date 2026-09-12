import webpush from 'web-push';

import { serverSupabase } from '@/db/supabase.js';

export interface PushNotificationPayload {
  title: string;
  body: string;
  userId?: string;
  userIds?: string[];
  domain?: string;
  type?: string;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  tag?: string;
  metadata?: Record<string, unknown>;
}

export interface PushDispatchResult {
  sentCount: number;
  failedCount: number;
  cleanedCount: number;
  errors: string[];
}

export class WebPushService {
  private static isInitialized = false;

  private static ensureInitialized(): boolean {
    if (this.isInitialized) return true;

    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject =
      process.env.VAPID_SUBJECT || 'mailto:admin@detmayvinhphat.com';

    if (!publicKey || !privateKey) {
      // eslint-disable-next-line no-console
      console.warn(
        '[WebPushService] VAPID credentials are not configured in environment',
      );
      return false;
    }

    try {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.isInitialized = true;
      return true;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[WebPushService] Failed to initialize VAPID details', err);
      return false;
    }
  }

  /**
   * Sanitizes notification text to mask sensitive values (e.g. monetary values).
   */
  static sanitizeNotificationBody(body: string): string {
    if (!body) return '';
    return body.replace(
      /(\d{1,3}[.,]\d{3}[.,]\d{3}[.,]\d{3}|\d{1,3}[.,]\d{3}[.,]\d{3}|\d{1,3}[.,]\d{3})\s*(đ|VND|vnđ|USD|\$)/gi,
      '***',
    );
  }

  /**
   * Sends web push notification to target user(s).
   */
  static async sendPushNotification(
    payload: PushNotificationPayload,
  ): Promise<PushDispatchResult> {
    const isReady = this.ensureInitialized();
    if (!isReady) {
      return {
        sentCount: 0,
        failedCount: 0,
        cleanedCount: 0,
        errors: ['VAPID_UNCONFIGURED'],
      };
    }

    const targetUserIds: string[] = [];
    if (payload.userId) targetUserIds.push(payload.userId);
    if (payload.userIds?.length) targetUserIds.push(...payload.userIds);

    if (targetUserIds.length === 0) {
      return {
        sentCount: 0,
        failedCount: 0,
        cleanedCount: 0,
        errors: ['NO_RECIPIENT_SPECIFIED'],
      };
    }

    // 1. Query subscriptions from database
    const { data: subscriptions, error: dbError } = await serverSupabase
      .from('push_subscriptions')
      .select('id, user_id, endpoint, p256dh, auth')
      .in('user_id', targetUserIds)
      .is('revoked_at', null);

    if (dbError) {
      // eslint-disable-next-line no-console
      console.error(
        '[WebPushService] DB error querying subscriptions',
        dbError,
      );
      return {
        sentCount: 0,
        failedCount: 0,
        cleanedCount: 0,
        errors: [`DB_ERROR: ${dbError.message}`],
      };
    }

    if (!subscriptions || subscriptions.length === 0) {
      return {
        sentCount: 0,
        failedCount: 0,
        cleanedCount: 0,
        errors: [],
      };
    }

    const sanitizedBody = this.sanitizeNotificationBody(payload.body);
    const notificationJson = JSON.stringify({
      title: payload.title,
      body: sanitizedBody,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      tag: payload.tag || payload.type || 'vinhphat-notification',
      data: {
        domain: payload.domain,
        entityType: payload.entityType,
        entityId: payload.entityId,
        url: payload.actionUrl || '/',
        metadata: payload.metadata,
      },
    });

    let sentCount = 0;
    let failedCount = 0;
    let cleanedCount = 0;
    const errors: string[] = [];
    const expiredIds: string[] = [];

    // 2. Dispatch to each subscription
    await Promise.all(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        try {
          await webpush.sendNotification(pushSubscription, notificationJson);
          sentCount++;
        } catch (err: unknown) {
          failedCount++;
          const statusCode = (err as { statusCode?: number })?.statusCode;
          const errMsg = err instanceof Error ? err.message : String(err);
          errors.push(`Sub ${sub.id}: ${errMsg}`);

          // 410 Gone or 404 Not Found: subscription is expired or uninstalled
          if (statusCode === 410 || statusCode === 404) {
            expiredIds.push(sub.id);
          }
        }
      }),
    );

    // 3. Clean up expired subscriptions
    if (expiredIds.length > 0) {
      cleanedCount = expiredIds.length;
      await serverSupabase
        .from('push_subscriptions')
        .update({ revoked_at: new Date().toISOString() })
        .in('id', expiredIds);
    }

    return {
      sentCount,
      failedCount,
      cleanedCount,
      errors,
    };
  }
}
