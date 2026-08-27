import {
  BrowserNotSupportedError,
  IOSStandaloneRequiredError,
  UserNotAuthenticatedError,
  BackendRegistrationError,
} from '@/features/notifications/domain/notification-errors';
import { PlatformCapabilityClient } from '@/features/notifications/infrastructure/platform-capability.client';
import { PermissionClient } from '@/features/notifications/infrastructure/permission.client';
import { VapidKeyClient } from '@/features/notifications/infrastructure/vapid-key.client';
import { ServiceWorkerClient } from '@/features/notifications/infrastructure/service-worker.client';
import { PushSubscriptionRepository } from '@/features/notifications/infrastructure/push-subscription.repository';

function getOrCreateDeviceId(): string {
  const STORAGE_KEY = 'vp_device_id';
  try {
    let deviceId = localStorage.getItem(STORAGE_KEY);
    if (!deviceId) {
      deviceId = `dev_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
      localStorage.setItem(STORAGE_KEY, deviceId);
    }
    return deviceId;
  } catch {
    return `dev_fallback_${Date.now()}`;
  }
}

export class PushSubscriptionService {
  /**
   * Complete lifecycle subscription pipeline
   */
  static async subscribeDevice(userId: string): Promise<boolean> {
    if (!userId) {
      throw new UserNotAuthenticatedError(
        'User ID is required to subscribe to push.',
      );
    }

    // 1. Check Platform Capabilities
    const caps = PlatformCapabilityClient.getCapabilities();

    if (caps.isIOS && !caps.isStandalone) {
      throw new IOSStandaloneRequiredError(
        'On iOS, user must Add to Home Screen to enable Web Push.',
      );
    }

    if (!caps.isFullySupported) {
      throw new BrowserNotSupportedError(
        'Push notifications are not supported on this browser/platform.',
      );
    }

    // 2. Request Native Permission
    await PermissionClient.requestPermission();

    // 3. Get Active Service Worker
    const registration = await ServiceWorkerClient.getReadyRegistration();

    // 4. Validate and Get Application Server Key (NIST P-256 Fail-Fast)
    const appServerKey = VapidKeyClient.getApplicationServerKey();

    // 5. Subscribe with Browser Push Gateway
    const subscription = await ServiceWorkerClient.subscribeToPush(
      registration,
      appServerKey,
    );

    const subJson = subscription.toJSON();
    const p256dh = subJson.keys?.p256dh;
    const auth = subJson.keys?.auth;

    if (!p256dh || !auth) {
      throw new BackendRegistrationError(
        'Push subscription keys could not be extracted from browser subscription.',
      );
    }

    // 6. Save to Backend Database (Idempotent)
    const savedId = await PushSubscriptionRepository.saveSubscription({
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh,
      auth,
      device_id: getOrCreateDeviceId(),
      platform: PlatformCapabilityClient.detectPlatformName(),
      browser: PlatformCapabilityClient.detectBrowserName(),
      is_standalone: caps.isStandalone,
    });

    if (!savedId) {
      throw new BackendRegistrationError(
        'Failed to save push subscription to backend database.',
      );
    }

    return true;
  }

  /**
   * Unsubscribe pipeline
   */
  static async unsubscribeDevice(): Promise<boolean> {
    try {
      const registration = await ServiceWorkerClient.getReadyRegistration();
      const subscription =
        await ServiceWorkerClient.getExistingSubscription(registration);

      if (subscription) {
        await PushSubscriptionRepository.revokeSubscription(
          subscription.endpoint,
        );
        await subscription.unsubscribe();
      }

      return true;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.debug('[PushSubscriptionService] unsubscribe error:', err);
      return false;
    }
  }

  /**
   * Checks if device is currently subscribed
   */
  static async isDeviceSubscribed(): Promise<boolean> {
    try {
      const caps = PlatformCapabilityClient.getCapabilities();
      if (!caps.hasServiceWorker || !caps.hasPushManager) {
        return false;
      }

      const registration = await ServiceWorkerClient.getReadyRegistration();
      const sub =
        await ServiceWorkerClient.getExistingSubscription(registration);
      return Boolean(sub);
    } catch {
      return false;
    }
  }
}
