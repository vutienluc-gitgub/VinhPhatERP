import { describe, it, expect, vi, beforeEach } from 'vitest';

import { PushSubscriptionService } from '@/features/notifications/application/push-subscription.service';
import { VapidKeyClient } from '@/features/notifications/infrastructure/vapid-key.client';
import { ServiceWorkerClient } from '@/features/notifications/infrastructure/service-worker.client';
import { PlatformCapabilityClient } from '@/features/notifications/infrastructure/platform-capability.client';

vi.mock(
  '@/features/notifications/infrastructure/service-worker.client',
  () => ({
    ServiceWorkerClient: {
      getReadyRegistration: vi.fn(),
      getExistingSubscription: vi.fn(),
      subscribeToPush: vi.fn(),
    },
  }),
);

vi.mock(
  '@/features/notifications/infrastructure/platform-capability.client',
  () => ({
    PlatformCapabilityClient: {
      getCapabilities: vi.fn(),
      detectPlatformName: vi.fn().mockReturnValue('Web'),
      detectBrowserName: vi.fn().mockReturnValue('Chrome'),
    },
  }),
);

describe('PushSubscriptionService — Key Drift Detection & Silent Re-subscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('detects matching VAPID key when subscription applicationServerKey matches authoritative key', () => {
    const authoritativeKeyBytes = VapidKeyClient.getApplicationServerKey();
    const mockSub = {
      options: {
        applicationServerKey: authoritativeKeyBytes.buffer,
      },
    } as unknown as PushSubscription;

    const isMatch = PushSubscriptionService.isKeyMatchingAuthoritative(mockSub);
    expect(isMatch).toBe(true);
  });

  it('detects VAPID key mismatch when subscription was created with different key', () => {
    // Different key bytes (e.g. legacy Key B)
    const differentKeyBytes = new Uint8Array(65);
    differentKeyBytes[0] = 0x04;
    differentKeyBytes[1] = 0x99; // Deliberate mismatch

    const mockSub = {
      options: {
        applicationServerKey: differentKeyBytes.buffer,
      },
    } as unknown as PushSubscription;

    const isMatch = PushSubscriptionService.isKeyMatchingAuthoritative(mockSub);
    expect(isMatch).toBe(false);
  });

  it('falls back safely to true when browser options do not expose applicationServerKey', () => {
    const mockSub = {
      options: {},
    } as unknown as PushSubscription;

    const isMatch = PushSubscriptionService.isKeyMatchingAuthoritative(mockSub);
    expect(isMatch).toBe(true);
  });

  it('unsubscribes stale registration and returns false when key mismatch is encountered in isDeviceSubscribed', async () => {
    vi.mocked(PlatformCapabilityClient.getCapabilities).mockReturnValue({
      hasServiceWorker: true,
      hasPushManager: true,
      hasNotification: true,
      hasAppBadging: true,
      isStandalone: false,
      isIOS: false,
      isAndroid: false,
      isDesktop: true,
      isFullySupported: true,
    });

    const differentKeyBytes = new Uint8Array(65);
    differentKeyBytes[0] = 0x04;
    differentKeyBytes[1] = 0xfe;

    const unsubscribeMock = vi.fn().mockResolvedValue(true);
    const mockStaleSub = {
      options: {
        applicationServerKey: differentKeyBytes.buffer,
      },
      unsubscribe: unsubscribeMock,
    } as unknown as PushSubscription;

    vi.mocked(ServiceWorkerClient.getReadyRegistration).mockResolvedValue(
      {} as ServiceWorkerRegistration,
    );
    vi.mocked(ServiceWorkerClient.getExistingSubscription).mockResolvedValue(
      mockStaleSub,
    );

    const isSubscribed = await PushSubscriptionService.isDeviceSubscribed();
    expect(isSubscribed).toBe(false);
    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
  });
});
