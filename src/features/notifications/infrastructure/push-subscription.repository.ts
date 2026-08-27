import { safeUpsertOne } from '@/lib/db-guard';
import { untypedDb } from '@/services/supabase/client';
import type { PushSubscriptionRecord } from '@/features/notifications/domain/notification.types';

export class PushSubscriptionRepository {
  /**
   * Saves or updates a device push subscription idempotently
   */
  static async saveSubscription(
    record: PushSubscriptionRecord,
  ): Promise<string | null> {
    const payload = {
      user_id: record.user_id,
      endpoint: record.endpoint,
      p256dh: record.p256dh,
      auth: record.auth,
      device_id: record.device_id ?? undefined,
      platform: record.platform || 'unknown',
      browser: record.browser || 'unknown',
      user_agent:
        record.user_agent ||
        (typeof navigator !== 'undefined' ? navigator.userAgent : null),
      is_standalone: record.is_standalone ?? false,
      last_seen_at: new Date().toISOString(),
      revoked_at: null,
      updated_at: new Date().toISOString(),
    };

    const res = (await safeUpsertOne({
      table: 'push_subscriptions',
      data: payload,
      conflictKey: 'endpoint',
    })) as { data?: { id?: string } | null; error?: unknown };

    if (res.error) {
      // eslint-disable-next-line no-console
      console.debug(
        '[PushSubscriptionRepository] saveSubscription error:',
        res.error,
      );
      return null;
    }

    return res.data?.id || null;
  }

  /**
   * Revokes (soft-deletes) a device push subscription
   */
  static async revokeSubscription(endpoint: string): Promise<boolean> {
    const { error } = await untypedDb
      .from('push_subscriptions')
      .update({
        revoked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('endpoint', endpoint);

    if (error) {
      // eslint-disable-next-line no-console
      console.debug(
        '[PushSubscriptionRepository] revoke error:',
        error.message,
      );
      return false;
    }

    return true;
  }
}
