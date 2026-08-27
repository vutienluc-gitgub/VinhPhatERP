import {
  type NotificationFsmState,
  NotificationFsm,
} from '@/features/notifications/domain/notification-fsm';
import {
  type NotificationError,
  mapToNotificationError,
} from '@/features/notifications/domain/notification-errors';
import { PlatformCapabilityClient } from '@/features/notifications/infrastructure/platform-capability.client';
import { PermissionClient } from '@/features/notifications/infrastructure/permission.client';
import { PushSubscriptionService } from '@/features/notifications/application/push-subscription.service';
import { BadgeService } from '@/features/notifications/application/badge.service';

export interface FacadeResult<T = void> {
  success: boolean;
  data?: T;
  error?: NotificationError;
}

export class NotificationFacade {
  /**
   * Queries the current runtime State of the notification subsystem
   */
  static async getDeviceState(): Promise<NotificationFsmState> {
    const caps = PlatformCapabilityClient.getCapabilities();
    const permission = PermissionClient.getPermission();
    const isSubscribed = await PushSubscriptionService.isDeviceSubscribed();

    return NotificationFsm.deriveState({
      isSupported: caps.isFullySupported,
      permission,
      isSubscribed,
    });
  }

  /**
   * High-level entry point to enable push on current device (Must be triggered by User Gesture)
   */
  static async enableDevicePush(userId: string): Promise<FacadeResult> {
    try {
      await PushSubscriptionService.subscribeDevice(userId);
      return { success: true };
    } catch (err) {
      const mappedError = mapToNotificationError(err);
      return {
        success: false,
        error: mappedError,
      };
    }
  }

  /**
   * High-level entry point to disable push on current device
   */
  static async disableDevicePush(): Promise<FacadeResult> {
    try {
      await PushSubscriptionService.unsubscribeDevice();
      return { success: true };
    } catch (err) {
      const mappedError = mapToNotificationError(err);
      return {
        success: false,
        error: mappedError,
      };
    }
  }

  /**
   * Synchronizes the App Badge count derived from unread counters
   */
  static async syncAppBadge(totalUnreadCount: number): Promise<boolean> {
    return BadgeService.setBadge(totalUnreadCount);
  }
}
