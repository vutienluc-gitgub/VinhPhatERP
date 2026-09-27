import { describe, expect, it } from 'vitest';

import type { DockSourceItem } from './floating-dock.utils';
import {
  DOCK_BADGE_OVERFLOW,
  formatDockBadge,
  isDockItemActive,
  toDockItems,
} from './floating-dock.utils';

const sources: DockSourceItem[] = [
  { path: '/', label: 'Tổng quan', shortLabel: 'Home', icon: 'Home' },
  { path: '/orders', label: 'Đơn hàng', icon: 'ClipboardList' },
  { path: '/raw-fabric', label: 'Vải mộc', shortLabel: 'Vải mộc' },
  { path: '/finished-fabric', label: 'Vải thành phẩm', icon: 'Layers' },
  { path: '/shipments', label: 'Xuất kho', icon: 'Truck' },
];

describe('toDockItems', () => {
  it('giữ đúng thứ tự và giới hạn số tab', () => {
    const items = toDockItems(sources, 4);

    expect(items).toHaveLength(4);
    expect(items.map((i) => i.id)).toEqual([
      '/',
      '/orders',
      '/raw-fabric',
      '/finished-fabric',
    ]);
  });

  it('ưu tiên shortLabel, fallback label, fallback icon mặc định', () => {
    const [home, orders, rawFabric] = toDockItems(sources, 3);

    expect(home?.label).toBe('Home');
    expect(orders?.label).toBe('Đơn hàng');
    expect(orders?.icon).toBe('ClipboardList');
    expect(rawFabric?.icon).toBe('Component');
  });

  it('khử trùng theo path và bỏ item thiếu path', () => {
    const items = toDockItems(
      [
        { path: '/orders', label: 'Đơn hàng' },
        { path: '/orders', label: 'Trùng' },
        { path: '', label: 'Rỗng' },
        { path: '/customers', label: 'Khách hàng' },
      ],
      4,
    );

    expect(items.map((i) => i.id)).toEqual(['/orders', '/customers']);
  });

  it('trả về rỗng khi maxTabs <= 0', () => {
    expect(toDockItems(sources, 0)).toEqual([]);
    expect(toDockItems(sources, -1)).toEqual([]);
  });
});

describe('formatDockBadge', () => {
  it('ẩn huy hiệu rỗng hoặc bằng 0', () => {
    expect(formatDockBadge(undefined)).toBeNull();
    expect(formatDockBadge(null)).toBeNull();
    expect(formatDockBadge(0)).toBeNull();
    expect(formatDockBadge('')).toBeNull();
  });

  it('giữ số nguyên và chuỗi trong ngưỡng', () => {
    expect(formatDockBadge(3)).toBe('3');
    expect(formatDockBadge('Mới')).toBe('Mới');
  });

  it('rút gọn số vượt ngưỡng', () => {
    expect(formatDockBadge(DOCK_BADGE_OVERFLOW)).toBe('99');
    expect(formatDockBadge(DOCK_BADGE_OVERFLOW + 1)).toBe('99+');
    expect(formatDockBadge(1000)).toBe('99+');
  });
});

describe('isDockItemActive', () => {
  it('khớp chính xác cho trang chủ', () => {
    expect(isDockItemActive('/', '/')).toBe(true);
    expect(isDockItemActive('/', '/orders')).toBe(false);
  });

  it('khớp theo tiền tố cho các route con', () => {
    expect(isDockItemActive('/orders', '/orders')).toBe(true);
    expect(isDockItemActive('/orders', '/orders/123')).toBe(true);
    expect(isDockItemActive('/orders', '/order-history')).toBe(false);
  });
});
