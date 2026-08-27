import { untypedDb } from '@/services/supabase/untyped';
import { safeUpsertOne } from '@/lib/db-guard';
import type {
  AppNotification,
  CreateNotificationInput,
} from '@/domains/notification/models/types';

export class NotificationRepository {
  /**
   * Fetch paginated notification list for current user
   */
  static async fetchUserNotifications(
    userId: string,
    limit = 20,
  ): Promise<AppNotification[]> {
    const { data, error } = await untypedDb
      .from('app_notifications')
      .select('*')
      .eq('user_id', userId)
      .is('archived_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      // Structured fallback
      // eslint-disable-next-line no-console
      console.warn(
        '[NotificationRepository] fetchUserNotifications error:',
        error.message,
      );
      return [];
    }

    return (data || []) as unknown as AppNotification[];
  }

  /**
   * Get unread notification count
   */
  static async fetchUnreadCount(userId: string): Promise<number> {
    const { count, error } = await untypedDb
      .from('app_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null)
      .is('archived_at', null);

    if (error) {
      // eslint-disable-next-line no-console
      console.warn(
        '[NotificationRepository] fetchUnreadCount error:',
        error.message,
      );
      return 0;
    }

    return count ?? 0;
  }

  /**
   * Mark a single notification as read
   */
  static async markAsRead(notificationId: string): Promise<boolean> {
    const { error } = await untypedDb
      .from('app_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) {
      throw new Error(`Failed to mark notification read: ${error.message}`);
    }

    return true;
  }

  /**
   * Mark all notifications as read for current user
   */
  static async markAllAsRead(userId?: string): Promise<number> {
    let query = untypedDb
      .from('app_notifications')
      .update({ read_at: new Date().toISOString() })
      .is('read_at', null);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { error } = await query;

    if (error) {
      throw new Error(
        `Failed to mark all notifications read: ${error.message}`,
      );
    }

    return 1;
  }

  /**
   * Create a new notification entry (safe & idempotent)
   */
  static async createNotification(
    input: CreateNotificationInput,
  ): Promise<string> {
    const id = crypto.randomUUID();
    const result = await safeUpsertOne({
      table: 'app_notifications',
      data: {
        id,
        user_id: input.user_id,
        domain: input.domain,
        type: input.type,
        title: input.title,
        body: input.body,
        entity_type: input.entity_type,
        entity_id: input.entity_id,
        action: input.action ?? 'view',
        priority: input.priority ?? 'normal',
        metadata: input.metadata ?? {},
        tenant_id: input.tenant_id ?? null,
      },
      conflictKey: 'id',
    });

    const saved = result as { id: string };
    return saved.id || id;
  }

  /**
   * Backward-compatible adapter for Approval Subscriber
   */
  static async saveNotification(notification: {
    target_user_id?: string | null;
    target_role?: string | null;
    title: string;
    message: string;
    resource_type?: string;
    resource_id?: string;
  }): Promise<{ id: string }> {
    const userId =
      notification.target_user_id || '00000000-0000-0000-0000-000000000000';
    const id = await this.createNotification({
      user_id: userId,
      domain: 'approval',
      type: 'approval_status_change',
      title: notification.title,
      body: notification.message,
      entity_type: notification.resource_type || 'approval_request',
      entity_id: notification.resource_id || '',
    });
    return { id };
  }
}
