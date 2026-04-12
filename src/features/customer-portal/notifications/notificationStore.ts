import type { NotificationItem } from './types';

const MAX_NOTIFICATIONS = 50;

/** Prepend newItem and trim oldest if over capacity */
export function addWithCapacity(
  items: NotificationItem[],
  newItem: NotificationItem,
  cap = MAX_NOTIFICATIONS,
): NotificationItem[] {
  const next = [newItem, ...items];
  return next.length > cap ? next.slice(0, cap) : next;
}

/** Sort notifications newest first */
export function sortNotifications(
  items: NotificationItem[],
): NotificationItem[] {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/** Count unread notifications */
export function computeUnreadCount(items: NotificationItem[]): number {
  return items.filter((i) => !i.isRead).length;
}

/** Return new array with all items marked as read */
export function markAllRead(items: NotificationItem[]): NotificationItem[] {
  return items.map((i) =>
    i.isRead
      ? i
      : {
          ...i,
          isRead: true,
        },
  );
}
