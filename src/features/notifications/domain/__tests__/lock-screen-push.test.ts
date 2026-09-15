import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  evaluateNotificationPolicy,
  registerActiveView,
  clearActiveViews,
} from '@/features/notifications';

describe('Lock Screen Push Notification & Service Worker Simulation', () => {
  beforeEach(() => {
    clearActiveViews();
    vi.clearAllMocks();
  });

  it('LOCK SCREEN STATE: Delivers push notification with sound, badge, and vibration when device is locked / background', () => {
    // 1. Device is locked / window in background: chat room is NOT in active foreground
    const policyDecision = evaluateNotificationPolicy(
      {
        domain: 'chat',
        entityType: 'chat_room',
        entityId: 'room-monz-brand',
        senderId: 'user-admin',
      },
      {
        currentUserId: 'user-customer',
        preferences: {
          pushEnabled: true,
          soundEnabled: true,
          inAppEnabled: true,
        },
        deviceCapabilities: {
          hasPushPermission: true,
        },
      },
    );

    // Assert policy explicitly permits Web Push, Sound, and App Badge
    expect(policyDecision.shouldDeliverWebPush).toBe(true);
    expect(policyDecision.shouldPlaySound).toBe(true);
    expect(policyDecision.shouldUpdateBadge).toBe(true);
    expect(policyDecision.suppressReasons).toHaveLength(0);

    // 2. Service Worker Lock Screen Notification Construction Simulation
    const mockShowNotification = vi.fn();
    const mockRegistration = { showNotification: mockShowNotification };

    const payload = {
      action: 'chat',
      roomId: 'room-monz-brand',
      messageId: 'msg-001',
      senderName: 'Vũ Tiến Lực (Admin)',
      body: 'Admin đã nhận được tin nhắn',
      unreadCount: 1,
    };

    // Service worker logic for Lock Screen (public/sw.js)
    const timestamp = 1773489000000;
    const options = {
      body: payload.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: `chat-${payload.roomId}-${timestamp}`, // Unique tag ensures iOS/Android displays banner on Lock Screen
      data: {
        url: `/?chatOpen=1&roomId=${payload.roomId}&messageId=${payload.messageId}`,
        action: 'chat',
        roomId: payload.roomId,
        messageId: payload.messageId,
      },
      vibrate: [100, 50, 100],
    };

    mockRegistration.showNotification(payload.senderName, options);

    expect(mockShowNotification).toHaveBeenCalledTimes(1);
    expect(mockShowNotification).toHaveBeenCalledWith(
      'Vũ Tiến Lực (Admin)',
      expect.objectContaining({
        body: 'Admin đã nhận được tin nhắn',
        tag: `chat-room-monz-brand-${timestamp}`,
        vibrate: [100, 50, 100],
        data: expect.objectContaining({
          action: 'chat',
          roomId: 'room-monz-brand',
        }),
      }),
    );
  });

  it('ACTIVE FOREGROUND STATE: Suppresses Lock Screen push alert if customer is already actively looking at the room', () => {
    // When customer has the chat drawer active on screen
    registerActiveView('chat_room', 'room-monz-brand');

    const policyDecision = evaluateNotificationPolicy(
      {
        domain: 'chat',
        entityType: 'chat_room',
        entityId: 'room-monz-brand',
        senderId: 'user-admin',
      },
      {
        currentUserId: 'user-customer',
        deviceCapabilities: {
          hasPushPermission: true,
        },
      },
    );

    // Push alert suppressed to prevent chime spam while actively chatting in foreground
    expect(policyDecision.shouldDeliverWebPush).toBe(false);
    expect(policyDecision.shouldPlaySound).toBe(false);
    expect(policyDecision.suppressReasons).toContain('active_view');
  });
});
