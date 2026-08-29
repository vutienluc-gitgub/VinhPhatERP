import { describe, it, expect, beforeEach } from 'vitest';

import {
  evaluateNotificationPolicy,
  isWithinQuietHours,
  registerActiveView,
  unregisterActiveView,
  clearActiveViews,
} from '@/features/notifications';

describe('NotificationPolicy & ActiveViewRegistry', () => {
  beforeEach(() => {
    clearActiveViews();
  });

  it('suppresses all notifications if sender is current user', () => {
    const decision = evaluateNotificationPolicy(
      {
        domain: 'chat',
        entityType: 'chat_room',
        entityId: 'room-1',
        senderId: 'user-me',
      },
      {
        currentUserId: 'user-me',
      },
    );

    expect(decision.shouldDeliverInApp).toBe(false);
    expect(decision.shouldDeliverWebPush).toBe(false);
    expect(decision.shouldPlaySound).toBe(false);
    expect(decision.suppressReasons).toContain('self_sender');
  });

  it('suppresses In-App toast, Web Push, and sound when user has active view on entity', () => {
    registerActiveView('chat_room', 'room-100');

    const decision = evaluateNotificationPolicy(
      {
        domain: 'chat',
        entityType: 'chat_room',
        entityId: 'room-100',
        senderId: 'user-other',
      },
      {
        currentUserId: 'user-me',
        deviceCapabilities: { hasPushPermission: true },
      },
    );

    expect(decision.shouldDeliverInApp).toBe(false);
    expect(decision.shouldDeliverWebPush).toBe(false);
    expect(decision.shouldPlaySound).toBe(false);
    expect(decision.shouldUpdateBadge).toBe(false);
    expect(decision.suppressReasons).toContain('active_view');
  });

  it('delivers notification normally when entity is not active', () => {
    unregisterActiveView('chat_room', 'room-100');

    const decision = evaluateNotificationPolicy(
      {
        domain: 'chat',
        entityType: 'chat_room',
        entityId: 'room-100',
        senderId: 'user-other',
      },
      {
        currentUserId: 'user-me',
        preferences: {
          soundEnabled: true,
          inAppEnabled: true,
          pushEnabled: true,
        },
        deviceCapabilities: { hasPushPermission: true },
      },
    );

    expect(decision.shouldDeliverInApp).toBe(true);
    expect(decision.shouldDeliverWebPush).toBe(true);
    expect(decision.shouldPlaySound).toBe(true);
    expect(decision.shouldUpdateBadge).toBe(true);
    expect(decision.suppressReasons).toHaveLength(0);
  });

  it('suppresses notifications for muted entities', () => {
    const decision = evaluateNotificationPolicy(
      {
        domain: 'chat',
        entityType: 'chat_room',
        entityId: 'room-muted',
        senderId: 'user-other',
      },
      {
        currentUserId: 'user-me',
        preferences: { mutedEntityIds: ['room-muted'] },
      },
    );

    expect(decision.shouldDeliverInApp).toBe(false);
    expect(decision.shouldDeliverWebPush).toBe(false);
    expect(decision.shouldPlaySound).toBe(false);
    expect(decision.suppressReasons).toContain('muted_entity');
  });

  it('calculates quiet hours accurately', () => {
    const nightTime = new Date('2026-08-29T23:30:00');
    const dayTime = new Date('2026-08-29T14:30:00');

    // 22:00 -> 07:00
    expect(isWithinQuietHours('22:00', '07:00', nightTime)).toBe(true);
    expect(isWithinQuietHours('22:00', '07:00', dayTime)).toBe(false);
  });
});
