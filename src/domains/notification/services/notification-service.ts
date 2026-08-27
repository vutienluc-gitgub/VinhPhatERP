import { NotificationRepository } from '@/domains/notification/repositories/notification-repository';
import { PushDispatcher } from '@/domains/notification/services/push-dispatcher';
import type { CreateNotificationInput } from '@/domains/notification/models/types';

export class NotificationService {
  /**
   * Dispatch a notification to a specific user (saves to DB and sends Web Push)
   */
  static async dispatch(input: CreateNotificationInput): Promise<string> {
    try {
      const notificationId =
        await NotificationRepository.createNotification(input);

      // Asynchronously trigger Web Push without blocking DB operation
      void PushDispatcher.dispatchPush(input, { notificationId });

      return notificationId;
    } catch (err) {
      // Structured error logging
      const message = err instanceof Error ? err.message : String(err);
      // eslint-disable-next-line no-console
      console.error('[NotificationService.dispatch] Error:', message);
      throw err;
    }
  }

  /**
   * Dispatch notifications in batch to multiple users
   */
  static async dispatchBatch(
    inputs: CreateNotificationInput[],
  ): Promise<string[]> {
    const results: string[] = [];
    for (const input of inputs) {
      try {
        const id = await this.dispatch(input);
        results.push(id);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        // eslint-disable-next-line no-console
        console.error(
          '[NotificationService.dispatchBatch] Failed item:',
          message,
        );
      }
    }
    return results;
  }
}
