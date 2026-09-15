import { describe, it, expect } from 'vitest';

import { PushErrorClassifier } from '@/features/notifications/domain/push-error-classifier';

describe('PushErrorClassifier — Safe Token Lifecycle & APNs Error Classification', () => {
  it('REVOKES token on HTTP 410 Gone (Apple APNs / Google FCM)', () => {
    const shouldRevoke = PushErrorClassifier.shouldRevokeToken({
      statusCode: 410,
      body: '{"reason":"Unregistered"}',
    });
    expect(shouldRevoke).toBe(true);
    expect(PushErrorClassifier.classify({ statusCode: 410 })).toBe(
      'REVOKE_TOKEN',
    );
  });

  it('REVOKES token on HTTP 404 Not Found', () => {
    const shouldRevoke = PushErrorClassifier.shouldRevokeToken({
      statusCode: 404,
    });
    expect(shouldRevoke).toBe(true);
  });

  it('REVOKES token on HTTP 400 when reason is explicitly BadDeviceToken or Unregistered', () => {
    const badToken = PushErrorClassifier.shouldRevokeToken({
      statusCode: 400,
      body: '{"reason":"BadDeviceToken"}',
    });
    expect(badToken).toBe(true);

    const unregistered = PushErrorClassifier.shouldRevokeToken({
      statusCode: 400,
      reason: 'Unregistered',
    });
    expect(unregistered).toBe(true);
  });

  it('RETAINS token on HTTP 400 when reason is VAPID mismatch / BadJwtToken (DO NOT DESTROY TOKENS)', () => {
    const vapidMismatch = PushErrorClassifier.shouldRevokeToken({
      statusCode: 400,
      body: '{"reason":"BadJwtToken"}',
    });
    expect(vapidMismatch).toBe(false);
    expect(
      PushErrorClassifier.classify({
        statusCode: 400,
        body: '{"reason":"BadJwtToken"}',
      }),
    ).toBe('RETAIN_TOKEN_CONFIG_ERROR');
  });

  it('RETAINS token on generic HTTP 400 without dead-token reason', () => {
    const generic400 = PushErrorClassifier.shouldRevokeToken({
      statusCode: 400,
      message: 'Received unexpected response code',
    });
    expect(generic400).toBe(false);
  });

  it('RETAINS token on HTTP 500 / 503 gateway transient network failure', () => {
    const serverError = PushErrorClassifier.shouldRevokeToken({
      statusCode: 503,
      body: 'Service Unavailable',
    });
    expect(serverError).toBe(false);
    expect(PushErrorClassifier.classify({ statusCode: 503 })).toBe(
      'RETAIN_TOKEN_TRANSIENT',
    );
  });
});
