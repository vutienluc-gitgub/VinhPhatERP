import { safeUpsertOne } from '@/lib/db-guard';
import { Notification } from '@/domains/approval/models/types';

export class NotificationRepository {
  static async saveNotification(
    notification: Partial<Notification>,
  ): Promise<Notification> {
    return (await safeUpsertOne({
      table: 'notifications',
      data: { ...notification, id: notification.id || crypto.randomUUID() },
      conflictKey: 'id',
    })) as Notification;
  }
}
