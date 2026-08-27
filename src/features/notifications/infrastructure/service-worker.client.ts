import { ServiceWorkerNotReadyError } from '@/features/notifications/domain/notification-errors';

export class ServiceWorkerClient {
  /**
   * Registers `/sw.js` if supported
   */
  static async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      return registration;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.debug('[ServiceWorkerClient] register error:', err);
      return null;
    }
  }

  /**
   * Waits for and retrieves active Service Worker registration
   */
  static async getReadyRegistration(): Promise<ServiceWorkerRegistration> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      throw new ServiceWorkerNotReadyError(
        'ServiceWorker is not supported in this environment.',
      );
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      return registration;
    } catch (err) {
      throw new ServiceWorkerNotReadyError(
        'Failed to get ready Service Worker registration.',
        err,
      );
    }
  }

  /**
   * Subscribes to Web Push using validated application server key
   */
  static async subscribeToPush(
    registration: ServiceWorkerRegistration,
    applicationServerKey: Uint8Array,
  ): Promise<PushSubscription> {
    return registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as unknown as BufferSource,
    });
  }

  /**
   * Gets existing push subscription if any
   */
  static async getExistingSubscription(
    registration: ServiceWorkerRegistration,
  ): Promise<PushSubscription | null> {
    return registration.pushManager.getSubscription();
  }
}
