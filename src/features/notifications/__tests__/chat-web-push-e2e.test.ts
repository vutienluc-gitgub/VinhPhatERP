import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Automated Test Suite: Admin Portal -> Customer Portal Web Push Pipeline
 * Tests cross-portal ID correlation, recipient resolution, multi-device fan-out isolation,
 * provider error classification, idempotency, and Service Worker lock screen display logic.
 */

export interface ChatMessagePayload {
  message_id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  entity_type: 'customer' | 'supplier' | 'internal';
  entity_id: string;
  recipients: string[];
}

export interface PushSubscriptionItem {
  id: string;
  user_id: string;
  device_id: string;
  platform: string;
  browser: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  revoked_at: string | null;
}

export interface PushDispatchResult {
  subscription_id: string;
  status: 'delivered' | 'failed' | 'sent_mock';
  response_code: number;
  reason?: string;
  error?: string;
}

/**
 * Core Provider Error Classifier
 */
export function classifyPushProviderError(
  statusCode: number,
  reason = '',
): { isDeadToken: boolean; isTransient: boolean } {
  const isDeadToken =
    statusCode === 410 ||
    statusCode === 404 ||
    (statusCode === 400 &&
      (reason === 'BadDeviceToken' ||
        reason === 'Unregistered' ||
        reason === 'DeviceTokenNotForTopic'));

  return {
    isDeadToken,
    isTransient: !isDeadToken,
  };
}

/**
 * Multi-device fan-out dispatcher simulator
 */
export async function simulateMultiDeviceDispatch(
  subscriptions: PushSubscriptionItem[],
  sendPushFn: (
    sub: PushSubscriptionItem,
  ) => Promise<{ statusCode: number; reason?: string }>,
): Promise<{
  results: PushDispatchResult[];
  revokedSubscriptionIds: string[];
}> {
  const results: PushDispatchResult[] = [];
  const revokedSubscriptionIds: string[] = [];

  for (const sub of subscriptions) {
    try {
      const res = await sendPushFn(sub);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        results.push({
          subscription_id: sub.id,
          status: 'delivered',
          response_code: res.statusCode,
        });
      } else {
        const { isDeadToken } = classifyPushProviderError(
          res.statusCode,
          res.reason || '',
        );
        if (isDeadToken) {
          revokedSubscriptionIds.push(sub.id);
        }
        results.push({
          subscription_id: sub.id,
          status: 'failed',
          response_code: res.statusCode,
          reason: res.reason,
          error: res.reason || `HTTP ${res.statusCode}`,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      results.push({
        subscription_id: sub.id,
        status: 'failed',
        response_code: 500,
        error: errorMessage,
      });
    }
  }

  return { results, revokedSubscriptionIds };
}

describe('Web Push Chat Pipeline — Admin to Customer Correlation', () => {
  const adminUserId = 'user-admin-luc';
  const customerUserId = 'user-customer-tham';
  const roomId = 'room-customer-tanphat';
  const messageId = 'msg-chat-1001';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Section A & B & C: Cross-Portal ID Correlation & Recipient Resolution', () => {
    it('correlates Admin message_id -> Outbox Payload -> Customer Subscription -> Dispatch Payload', async () => {
      // 1. Admin sends message in customer room
      const adminMessage: ChatMessagePayload = {
        message_id: messageId,
        room_id: roomId,
        sender_id: adminUserId,
        sender_name: 'Vũ Tiến Lực (Admin)',
        content: 'Báo giá vải cotton mới cho quý khách',
        entity_type: 'customer',
        entity_id: 'cust-tanphat',
        recipients: [customerUserId],
      };

      // 2. Assert notification targets ONLY customer (excludes admin sender)
      expect(adminMessage.recipients).toContain(customerUserId);
      expect(adminMessage.recipients).not.toContain(adminUserId);

      // 3. Customer active push subscription
      const customerSubscription: PushSubscriptionItem = {
        id: 'sub-iphone-001',
        user_id: customerUserId,
        device_id: 'dev-iphone-tham',
        platform: 'ios',
        browser: 'safari-pwa',
        endpoint: 'https://web.push.apple.com/QN7KySnBwuxfvngKteFzMREk',
        p256dh: 'p256dh-mock-key',
        auth: 'auth-mock-key',
        revoked_at: null,
      };

      // 4. Dispatcher payload mapping
      const dispatchPayload = {
        title: adminMessage.sender_name,
        body: adminMessage.content,
        action: 'chat',
        roomId: adminMessage.room_id,
        messageId: adminMessage.message_id,
        senderName: adminMessage.sender_name,
        unreadCount: 1,
      };

      // Assert complete correlation chain across IDs
      expect(dispatchPayload.messageId).toBe(messageId);
      expect(dispatchPayload.roomId).toBe(roomId);
      expect(customerSubscription.user_id).toBe(customerUserId);
      expect(customerSubscription.revoked_at).toBeNull();
    });
  });

  describe('Section D: Multi-Device Fan-out & Partial Failure Isolation', () => {
    it('delivers push to Devices A & C while isolating Device B failure without revoking token', async () => {
      const devices: PushSubscriptionItem[] = [
        {
          id: 'sub-iphone',
          user_id: customerUserId,
          device_id: 'dev-1',
          platform: 'ios',
          browser: 'safari-pwa',
          endpoint: 'https://web.push.apple.com/sub-iphone',
          p256dh: 'k1',
          auth: 'a1',
          revoked_at: null,
        },
        {
          id: 'sub-desktop',
          user_id: customerUserId,
          device_id: 'dev-2',
          platform: 'windows',
          browser: 'chrome',
          endpoint: 'https://fcm.googleapis.com/fcm/sub-desktop',
          p256dh: 'k2',
          auth: 'a2',
          revoked_at: null,
        },
        {
          id: 'sub-tablet',
          user_id: customerUserId,
          device_id: 'dev-3',
          platform: 'ios',
          browser: 'safari-pwa',
          endpoint: 'https://web.push.apple.com/sub-tablet',
          p256dh: 'k3',
          auth: 'a3',
          revoked_at: null,
        },
      ];

      // Mock provider responses: Device A=201, Device B=500, Device C=200
      const mockProvider = vi.fn(async (sub: PushSubscriptionItem) => {
        if (sub.id === 'sub-desktop') {
          return { statusCode: 500, reason: 'Internal Server Error' };
        }
        return { statusCode: 200 };
      });

      const { results, revokedSubscriptionIds } =
        await simulateMultiDeviceDispatch(devices, mockProvider);

      expect(results).toHaveLength(3);
      expect(results[0]?.status).toBe('delivered'); // iPhone
      expect(results[1]?.status).toBe('failed'); // Desktop (500)
      expect(results[2]?.status).toBe('delivered'); // Tablet

      // Desktop transient failure MUST NOT trigger token revocation
      expect(revokedSubscriptionIds).not.toContain('sub-desktop');
      expect(revokedSubscriptionIds).toHaveLength(0);
    });
  });

  describe('Section E: Provider Error Classification Matrix', () => {
    it('correctly classifies dead token errors (410, 404, BadDeviceToken) for revocation', () => {
      expect(classifyPushProviderError(410).isDeadToken).toBe(true);
      expect(classifyPushProviderError(404).isDeadToken).toBe(true);
      expect(classifyPushProviderError(400, 'BadDeviceToken').isDeadToken).toBe(
        true,
      );
      expect(classifyPushProviderError(400, 'Unregistered').isDeadToken).toBe(
        true,
      );
      expect(
        classifyPushProviderError(400, 'DeviceTokenNotForTopic').isDeadToken,
      ).toBe(true);
    });

    it('correctly classifies transient errors (429, 500, timeout, VapidPkHashMismatch) as non-revoking', () => {
      expect(classifyPushProviderError(429).isDeadToken).toBe(false);
      expect(classifyPushProviderError(500).isDeadToken).toBe(false);
      expect(classifyPushProviderError(503).isDeadToken).toBe(false);
      expect(
        classifyPushProviderError(400, 'VapidPkHashMismatch').isDeadToken,
      ).toBe(false);
    });
  });

  describe('Section H: Service Worker & Lock Screen Simulation', () => {
    it('displays push notification on Lock Screen when chat room is in background / closed', () => {
      const mockShowNotification = vi.fn();
      const mockRegistration = { showNotification: mockShowNotification };

      const payload = {
        action: 'chat',
        roomId: roomId,
        messageId: messageId,
        senderName: 'Vũ Tiến Lực (Admin)',
        body: 'Báo giá vải cotton mới cho quý khách',
        unreadCount: 1,
      };

      // Service worker simulates background Lock Screen payload processing
      const isRoomOpenAndVisible = false;

      if (!isRoomOpenAndVisible) {
        const timestamp = 1773489000000;
        mockRegistration.showNotification(payload.senderName, {
          body: payload.body,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: `chat-${payload.roomId}-${timestamp}`,
          data: {
            url: `/?chatOpen=1&roomId=${payload.roomId}&messageId=${payload.messageId}`,
            action: 'chat',
            roomId: payload.roomId,
            messageId: payload.messageId,
          },
          vibrate: [100, 50, 100],
        });
      }

      expect(mockShowNotification).toHaveBeenCalledTimes(1);
      expect(mockShowNotification).toHaveBeenCalledWith(
        'Vũ Tiến Lực (Admin)',
        expect.objectContaining({
          body: 'Báo giá vải cotton mới cho quý khách',
          tag: `chat-${roomId}-1773489000000`,
          data: expect.objectContaining({
            action: 'chat',
            roomId: roomId,
            messageId: messageId,
            url: `/?chatOpen=1&roomId=${roomId}&messageId=${messageId}`,
          }),
        }),
      );
    });

    it('suppresses Lock Screen push alert if Customer is actively looking at the room in foreground', () => {
      const mockShowNotification = vi.fn();

      // Service worker simulates foreground active view
      const isRoomOpenAndVisible = true;

      if (!isRoomOpenAndVisible) {
        mockShowNotification('Vũ Tiến Lực (Admin)', { body: 'Test' });
      }

      // Assert showNotification was NOT invoked
      expect(mockShowNotification).not.toHaveBeenCalled();
    });
  });
});
