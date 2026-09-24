import { describe, it, expect, vi, beforeEach } from 'vitest';

import { PushSubscriptionRepository } from '@/domains/notification/repositories/push-subscription-repository';

const mockSafeUpsertOne = vi.fn();

vi.mock('@/lib/db-guard', () => ({
  safeUpsertOne: (...args: unknown[]) => mockSafeUpsertOne(...args),
}));

vi.mock('@/services/supabase/untyped', () => ({
  untypedDb: {
    from: vi.fn(() => ({
      update: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      then: undefined,
    })),
  },
}));

function savedPayload() {
  const call = mockSafeUpsertOne.mock.calls[0] as [
    { data: Record<string, unknown> },
  ];
  return call[0].data;
}

describe('PushSubscriptionRepository.saveSubscription', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the persisted row so callers can read the generated id', async () => {
    mockSafeUpsertOne.mockResolvedValue({
      id: 'row-uuid',
      endpoint: 'https://push.example/abc',
    });

    const saved = await PushSubscriptionRepository.saveSubscription({
      user_id: 'user-1',
      endpoint: 'https://push.example/abc',
      p256dh: 'p',
      auth: 'a',
      device_id: 'dev-1',
      platform: 'ios',
      browser: 'safari-pwa',
      is_standalone: true,
    });

    expect(saved.id).toBe('row-uuid');
  });

  it('throws instead of silently succeeding when the upsert returns no row', async () => {
    mockSafeUpsertOne.mockResolvedValue(null);

    await expect(
      PushSubscriptionRepository.saveSubscription({
        user_id: 'user-1',
        endpoint: 'https://push.example/abc',
        p256dh: 'p',
        auth: 'a',
        device_id: 'dev-1',
        platform: 'ios',
        browser: 'safari-pwa',
      }),
    ).rejects.toThrow(/no row/);
  });

  it('persists is_standalone so iOS PWA eligibility survives the upsert', async () => {
    mockSafeUpsertOne.mockResolvedValue({ id: 'row-uuid' });

    await PushSubscriptionRepository.saveSubscription({
      user_id: 'user-1',
      endpoint: 'https://push.example/abc',
      p256dh: 'p',
      auth: 'a',
      device_id: 'dev-1',
      platform: 'ios',
      browser: 'safari-pwa',
      is_standalone: true,
    });

    expect(savedPayload().is_standalone).toBe(true);
  });

  it('defaults is_standalone to false when the caller does not report it', async () => {
    mockSafeUpsertOne.mockResolvedValue({ id: 'row-uuid' });

    await PushSubscriptionRepository.saveSubscription({
      user_id: 'user-1',
      endpoint: 'https://push.example/abc',
      p256dh: 'p',
      auth: 'a',
      device_id: 'dev-1',
      platform: 'windows',
      browser: 'chrome',
    });

    expect(savedPayload().is_standalone).toBe(false);
  });

  it('clears revoked_at and stamps updated_at so re-subscription revives the row', async () => {
    mockSafeUpsertOne.mockResolvedValue({ id: 'row-uuid' });

    await PushSubscriptionRepository.saveSubscription({
      user_id: 'user-1',
      endpoint: 'https://push.example/abc',
      p256dh: 'p',
      auth: 'a',
      device_id: 'dev-1',
      platform: 'ios',
      browser: 'safari-pwa',
    });

    const payload = savedPayload();
    expect(payload.revoked_at).toBeNull();
    expect(typeof payload.updated_at).toBe('string');
    expect(payload.last_seen_at).toBe(payload.updated_at);
  });
});
