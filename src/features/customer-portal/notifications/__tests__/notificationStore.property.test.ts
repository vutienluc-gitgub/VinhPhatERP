import { describe, it } from 'vitest';
import * as fc from 'fast-check';

import {
  addWithCapacity,
  sortNotifications,
  computeUnreadCount,
  markAllRead,
} from '@/features/customer-portal/notifications/notificationStore';
import type { NotificationItem } from '@/features/customer-portal/notifications/types';

// ---------------------------------------------------------------------------
// Arbitrary
// ---------------------------------------------------------------------------

const arbitraryNotificationItem = (): fc.Arbitrary<NotificationItem> =>
  fc.record({
    id: fc.uuid(),
    type: fc.constantFrom(
      'order_status',
      'order_progress',
      'shipment',
    ) as fc.Arbitrary<NotificationItem['type']>,
    title: fc.string({ minLength: 1 }),
    body: fc.string(),
    orderId: fc.option(fc.uuid(), { nil: undefined }),
    shipmentId: fc.option(fc.uuid(), { nil: undefined }),
    createdAt: fc
      .integer({
        min: 0,
        max: 2e12,
      })
      .map((ms) => new Date(ms).toISOString()),
    isRead: fc.boolean(),
  });

// ---------------------------------------------------------------------------
// Property 7: Danh sách thông báo luôn sắp xếp mới nhất trước
// ---------------------------------------------------------------------------

describe('notificationStore — Property 7: sorted newest first', () => {
  it('sortNotifications returns items in descending createdAt order', () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryNotificationItem(), { minLength: 1 }),
        (items) => {
          const sorted = sortNotifications(items);
          return sorted.every(
            (item, i) =>
              i === 0 ||
              new Date(sorted[i - 1]!.createdAt).getTime() >=
                new Date(item.createdAt).getTime(),
          );
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 8: Badge count bằng số thông báo chưa đọc
// ---------------------------------------------------------------------------

describe('notificationStore — Property 8: unreadCount equals unread items', () => {
  it('computeUnreadCount returns exact count of isRead=false items', () => {
    fc.assert(
      fc.property(fc.array(arbitraryNotificationItem()), (items) => {
        const count = computeUnreadCount(items);
        return count === items.filter((i) => !i.isRead).length;
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 9: Mark all read đặt tất cả isRead = true
// ---------------------------------------------------------------------------

describe('notificationStore — Property 9: markAllRead sets all isRead=true', () => {
  it('all items have isRead=true after markAllRead', () => {
    fc.assert(
      fc.property(fc.array(arbitraryNotificationItem()), (items) => {
        const result = markAllRead(items);
        return (
          result.every((i) => i.isRead === true) &&
          computeUnreadCount(result) === 0
        );
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 10: Giới hạn 50 thông báo — xóa cũ nhất khi vượt quá
// ---------------------------------------------------------------------------

describe('notificationStore — Property 10: capacity capped at 50', () => {
  it('list stays at cap=50, new item at index 0, oldest removed', () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryNotificationItem(), {
          minLength: 50,
          maxLength: 100,
        }),
        arbitraryNotificationItem(),
        (items, newItem) => {
          const result = addWithCapacity(items, newItem, 50);
          const oldestId = items[items.length - 1]!.id;
          return (
            result.length === 50 &&
            result[0]!.id === newItem.id &&
            !result.some((i) => i.id === oldestId)
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  it('list grows normally when under cap', () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryNotificationItem(), {
          minLength: 0,
          maxLength: 49,
        }),
        arbitraryNotificationItem(),
        (items, newItem) => {
          const result = addWithCapacity(items, newItem, 50);
          return (
            result.length === items.length + 1 && result[0]!.id === newItem.id
          );
        },
      ),
      { numRuns: 100 },
    );
  });
});
