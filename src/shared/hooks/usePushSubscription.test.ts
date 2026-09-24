import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'user-customer-tham' },
    profile: { tenant_id: 'tenant-vp', customer_id: 'cust-tanphat' },
  }),
}));

const mockSubscribe = vi.fn();
interface MockSub {
  options: { applicationServerKey?: ArrayBuffer };
  endpoint: string;
  unsubscribe: () => Promise<boolean>;
  toJSON: () => unknown;
}
let currentSub: MockSub | null = null;

vi.mock('@/shared/lib/serviceWorkerRegistration', () => ({
  getServiceWorkerRegistration: vi.fn(async () => ({
    pushManager: {
      getSubscription: vi.fn(async () => currentSub),
      subscribe: mockSubscribe,
    },
  })),
}));

const mockSaveSubscription = vi.fn(async (_record: unknown) => ({}));
vi.mock(
  '@/domains/notification/repositories/push-subscription-repository',
  () => ({
    PushSubscriptionRepository: {
      saveSubscription: (record: unknown) => mockSaveSubscription(record),
      revokeSubscription: vi.fn(async () => true),
    },
  }),
);

import {
  urlBase64ToUint8Array,
  getVapidPublicKey,
} from '@/shared/lib/vapidHelper';

import { isIOSNonStandalone, usePushSubscription } from './usePushSubscription';

const IOS_SAFARI_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

function installPushEnvironment({ ios }: { ios: boolean }) {
  Object.defineProperty(global.navigator, 'userAgent', {
    value: ios
      ? IOS_SAFARI_UA
      : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
    configurable: true,
  });
  Object.defineProperty(global.navigator, 'serviceWorker', {
    value: {},
    configurable: true,
  });
  Object.defineProperty(global.window, 'PushManager', {
    value: function PushManager() {},
    configurable: true,
  });
  Object.defineProperty(global.window, 'Notification', {
    value: {
      permission: 'default',
      requestPermission: vi.fn(async () => 'granted'),
    },
    configurable: true,
  });
  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) as unknown as typeof window.matchMedia;
}

describe('usePushSubscription — iOS standalone guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSub = null;
    installPushEnvironment({ ios: true });
  });

  afterEach(() => vi.restoreAllMocks());

  it('detects iOS Safari tab (non-standalone) as requiring Add to Home Screen', () => {
    expect(isIOSNonStandalone()).toBe(true);
  });

  it('refuses to subscribe on an iOS Safari tab so the OS cannot revoke an invalid token', async () => {
    const { result } = renderHook(() => usePushSubscription());
    expect(result.current.isSupported).toBe(true);

    const subscribed = await result.current.subscribe();

    expect(subscribed).toBe(false);
    expect(mockSubscribe).not.toHaveBeenCalled();
  });
});

describe('usePushSubscription — VAPID key rotation recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installPushEnvironment({ ios: false });
    Object.defineProperty(global.window, 'Notification', {
      value: { permission: 'granted', requestPermission: vi.fn() },
      configurable: true,
    });
  });

  afterEach(() => vi.restoreAllMocks());

  function makeSub(keyBytes: Uint8Array): MockSub {
    return {
      options: { applicationServerKey: keyBytes.buffer as ArrayBuffer },
      endpoint: 'https://fcm.googleapis.com/fcm/send/stale',
      toJSON: () => ({ keys: { p256dh: 'p', auth: 'a' } }),
      unsubscribe: vi.fn(async () => {
        currentSub = null;
        return true;
      }),
    };
  }

  it('unsubscribes a stale-key device subscription and re-enrolls with the current key', async () => {
    // Legacy 65-byte key from before the rotation — deliberately different bytes.
    const staleKey = new Uint8Array(65);
    staleKey[1] = 0x99;
    const staleSub = makeSub(staleKey);
    currentSub = staleSub;

    mockSubscribe.mockResolvedValue({
      endpoint: 'https://fcm.googleapis.com/fcm/send/fresh',
      toJSON: () => ({ keys: { p256dh: 'p', auth: 'a' } }),
    });

    renderHook(() => usePushSubscription());
    await vi.waitFor(() => expect(mockSubscribe).toHaveBeenCalled());

    expect(staleSub.unsubscribe).toHaveBeenCalled();
    expect(mockSaveSubscription).toHaveBeenCalled();
  });

  it('keeps a device subscription that already uses the current authoritative key', async () => {
    currentSub = makeSub(urlBase64ToUint8Array(getVapidPublicKey()));

    renderHook(() => usePushSubscription());
    // Give the effect a chance to run before asserting it did nothing.
    await new Promise((r) => setTimeout(r, 20));

    expect(mockSubscribe).not.toHaveBeenCalled();
  });
});
