import {
  PermissionDeniedError,
  PermissionDismissedError,
} from '@/features/notifications/domain/notification-errors';

export class PermissionClient {
  /**
   * Reads current permission without prompting
   */
  static getPermission(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'default';
    }
    return Notification.permission;
  }

  /**
   * Requests native browser notification permission (Must be called inside User Gesture)
   */
  static async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }

    const result = await Notification.requestPermission();

    if (result === 'denied') {
      throw new PermissionDeniedError('User denied notification permission.');
    }

    if (result === 'default') {
      throw new PermissionDismissedError('User dismissed notification prompt.');
    }

    return result;
  }
}
