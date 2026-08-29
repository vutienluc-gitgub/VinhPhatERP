import { isViewActive } from './active-view-registry';
import type { NotificationDomain } from './notification.types';

export interface NotificationEvaluationContext {
  currentUserId: string;
  activeEntityType?: string;
  activeEntityId?: string;
  preferences?: {
    inAppEnabled?: boolean;
    pushEnabled?: boolean;
    soundEnabled?: boolean;
    mutedEntityIds?: string[];
    quietHoursStart?: string | null; // e.g. "22:00"
    quietHoursEnd?: string | null; // e.g. "07:00"
  };
  deviceCapabilities?: {
    hasPushPermission?: boolean;
  };
}

export type NotificationSuppressReason =
  | 'self_sender'
  | 'active_view'
  | 'muted_entity'
  | 'quiet_hours'
  | 'permission_denied'
  | 'preference_disabled';

export interface NotificationDispatchDecision {
  shouldDeliverInApp: boolean;
  shouldDeliverWebPush: boolean;
  shouldPlaySound: boolean;
  shouldUpdateBadge: boolean;
  suppressReasons: NotificationSuppressReason[];
}

/**
 * Checks whether the current time falls within user quiet hours.
 */
export function isWithinQuietHours(
  startStr?: string | null,
  endStr?: string | null,
  currentTime = new Date(),
): boolean {
  if (!startStr || !endStr) return false;

  const [startH, startM] = startStr.split(':').map(Number);
  const [endH, endM] = endStr.split(':').map(Number);

  if (startH === undefined || endH === undefined) return false;

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const startMinutes = startH * 60 + (startM ?? 0);
  const endMinutes = endH * 60 + (endM ?? 0);

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
  // Overnight range e.g. 22:00 to 07:00
  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}

/**
 * Evaluates whether an incoming event should trigger In-App Toast, Web Push, Sound, or Badge.
 */
export function evaluateNotificationPolicy(
  event: {
    domain: NotificationDomain;
    entityType?: string;
    entityId?: string;
    senderId?: string | null;
  },
  context: NotificationEvaluationContext,
): NotificationDispatchDecision {
  const suppressReasons: NotificationSuppressReason[] = [];

  // 1. Guard: Ignore self-produced events
  if (event.senderId && event.senderId === context.currentUserId) {
    suppressReasons.push('self_sender');
    return {
      shouldDeliverInApp: false,
      shouldDeliverWebPush: false,
      shouldPlaySound: false,
      shouldUpdateBadge: false,
      suppressReasons,
    };
  }

  const prefs = context.preferences ?? {};
  const isMuted = Boolean(
    event.entityId && prefs.mutedEntityIds?.includes(event.entityId),
  );

  if (isMuted) {
    suppressReasons.push('muted_entity');
  }

  // 2. Check if user is currently looking at this entity
  const isActive = Boolean(
    event.entityType &&
    event.entityId &&
    isViewActive(event.entityType, event.entityId),
  );

  if (isActive) {
    suppressReasons.push('active_view');
  }

  // 3. Check quiet hours
  const inQuietHours = isWithinQuietHours(
    prefs.quietHoursStart,
    prefs.quietHoursEnd,
  );

  if (inQuietHours) {
    suppressReasons.push('quiet_hours');
  }

  // 4. Compute channel delivery decisions
  const inAppAllowedByPref = prefs.inAppEnabled ?? true;
  const pushAllowedByPref = prefs.pushEnabled ?? true;
  const soundAllowedByPref = prefs.soundEnabled ?? true;
  const hasPushPermission =
    context.deviceCapabilities?.hasPushPermission ?? false;

  const shouldDeliverInApp = !isMuted && !isActive && inAppAllowedByPref;

  const shouldDeliverWebPush =
    !isMuted &&
    !isActive &&
    !inQuietHours &&
    pushAllowedByPref &&
    hasPushPermission;

  const shouldPlaySound =
    !isMuted && !isActive && !inQuietHours && soundAllowedByPref;

  // Unread badge count is server-authoritative and updates unless entity is active
  const shouldUpdateBadge = !isActive;

  return {
    shouldDeliverInApp,
    shouldDeliverWebPush,
    shouldPlaySound,
    shouldUpdateBadge,
    suppressReasons,
  };
}
