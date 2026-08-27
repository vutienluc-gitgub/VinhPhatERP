import { describe, it, expect, vi, beforeEach } from 'vitest';

import { PlatformCapabilityClient } from '@/features/notifications/infrastructure/platform-capability.client';
import { PushSubscriptionService } from '@/features/notifications/application/push-subscription.service';
import { NotificationFacade } from '@/features/notifications/application/notification.facade';

vi.mock(
  '@/features/notifications/infrastructure/platform-capability.client',
  () => ({
    PlatformCapabilityClient: {
      getCapabilities: vi.fn(),
    },
  }),
);

vi.mock(
  '@/features/notifications/application/push-subscription.service',
  () => ({
    PushSubscriptionService: {
      subscribeDevice: vi.fn(),
      unsubscribeDevice: vi.fn(),
      isDeviceSubscribed: vi.fn(),
    },
  }),
);

describe('NotificationFacade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns UNSUPPORTED when platform is not capable', async () => {
    vi.mocked(PlatformCapabilityClient.getCapabilities).mockReturnValue({
      hasServiceWorker: false,
      hasPushManager: false,
      hasNotification: false,
      hasAppBadging: false,
      isStandalone: false,
      isIOS: false,
      isAndroid: false,
      isDesktop: true,
      isFullySupported: false,
    });

    const state = await NotificationFacade.getDeviceState();
    expect(state).toBe('UNSUPPORTED');
  });

  it('returns success: true when enableDevicePush succeeds', async () => {
    vi.mocked(PushSubscriptionService.subscribeDevice).mockResolvedValue(true);

    const result = await NotificationFacade.enableDevicePush('user-123');
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('maps caught errors to typed NotificationError and userMessage', async () => {
    vi.mocked(PushSubscriptionService.subscribeDevice).mockRejectedValue(
      new Error('applicationServerKey P-256 error'),
    );

    const result = await NotificationFacade.enableDevicePush('user-123');
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('INVALID_VAPID_PUBLIC_KEY');
    expect(result.error?.userMessage).toContain('Cấu hình thông báo máy chủ');
  });
});
