import { untypedDb } from '@/services/supabase/untyped';
import { safeUpsertOne } from '@/lib/db-guard';

export interface PushSubscriptionRecord {
  id?: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  device_id: string;
  device_name?: string;
  platform: string;
  browser: string;
  user_agent?: string;
  tenant_id?: string | null;
}

export class PushSubscriptionRepository {
  /**
   * Upsert a push subscription for a user device (idempotent by endpoint)
   */
  static async saveSubscription(
    data: PushSubscriptionRecord,
  ): Promise<PushSubscriptionRecord> {
    const id = data.id || crypto.randomUUID();
    const result = await safeUpsertOne({
      table: 'push_subscriptions',
      data: {
        id,
        user_id: data.user_id,
        endpoint: data.endpoint,
        p256dh: data.p256dh,
        auth: data.auth,
        device_id: data.device_id,
        device_name: data.device_name ?? null,
        platform: data.platform,
        browser: data.browser,
        user_agent: data.user_agent ?? null,
        tenant_id: data.tenant_id ?? null,
        last_seen_at: new Date().toISOString(),
        revoked_at: null,
      },
      conflictKey: 'endpoint',
    });

    return result as PushSubscriptionRecord;
  }

  /**
   * Revoke an active subscription (e.g. on user opt-out or logout)
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
      console.warn(
        '[PushSubscriptionRepository] revoke failed:',
        error.message,
      );
      return false;
    }

    return true;
  }

  /**
   * Fetch all active subscriptions for a given user
   */
  static async findActiveByUserId(
    userId: string,
  ): Promise<PushSubscriptionRecord[]> {
    const { data, error } = await untypedDb
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .is('revoked_at', null);

    if (error) {
      // eslint-disable-next-line no-console
      console.warn(
        '[PushSubscriptionRepository] findActive failed:',
        error.message,
      );
      return [];
    }

    return (data || []) as PushSubscriptionRecord[];
  }
}
