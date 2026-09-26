import { describe, expect, it } from 'vitest';

import type { NavigationItem } from '@/app/router/routes';
import {
  DEFAULT_ROLE_BOTTOM_TAB_PATHS,
  getRoleBottomTabPaths,
  resolveRoleBottomTabs,
} from '@/app/layouts/resolvers/role-tabs.config';

const MOCK_NAV_ITEMS: NavigationItem[] = [
  {
    path: '/',
    label: 'Tổng quan',
    shortLabel: 'Home',
    description: 'Home',
    icon: 'Home',
    primaryMobile: true,
  },
  {
    path: '/orders',
    label: 'Đơn hàng',
    shortLabel: 'Đơn hàng',
    description: 'Quản lý đơn hàng',
    icon: 'ClipboardList',
  },
  {
    path: '/quotes',
    label: 'Báo giá',
    shortLabel: 'Báo giá',
    description: 'Báo giá',
    icon: 'FileText',
  },
  {
    path: '/customers',
    label: 'Khách hàng',
    shortLabel: 'Khách hàng',
    description: 'Khách hàng',
    icon: 'Users',
  },
  {
    path: '/raw-fabric',
    label: 'Vải mộc',
    shortLabel: 'Vải mộc',
    description: 'Vải mộc',
    icon: 'Package',
  },
  {
    path: '/finished-fabric',
    label: 'Vải thành phẩm',
    shortLabel: 'Thành phẩm',
    description: 'Vải thành phẩm',
    icon: 'Box',
  },
  {
    path: '/shipments',
    label: 'Xuất hàng',
    shortLabel: 'Giao hàng',
    description: 'Giao nhận',
    icon: 'Truck',
  },
];

describe('role-tabs.config', () => {
  describe('getRoleBottomTabPaths', () => {
    it('returns custom tab paths for sale role', () => {
      const paths = getRoleBottomTabPaths('sale');
      expect(paths).toEqual(['/', '/orders', '/quotes', '/customers']);
    });

    it('returns driver specific tab paths', () => {
      const paths = getRoleBottomTabPaths('driver');
      expect(paths).toEqual(['/', '/shipments', '/orders']);
    });

    it('returns default tab paths when role is undefined or unrecognized', () => {
      expect(getRoleBottomTabPaths()).toEqual(
        DEFAULT_ROLE_BOTTOM_TAB_PATHS.default,
      );
      expect(getRoleBottomTabPaths('unknown_role')).toEqual(
        DEFAULT_ROLE_BOTTOM_TAB_PATHS.default,
      );
    });
  });

  describe('resolveRoleBottomTabs', () => {
    it('returns empty array when visibleNavItems is empty', () => {
      const result = resolveRoleBottomTabs({
        visibleNavItems: [],
        userRole: 'admin',
      });
      expect(result).toEqual([]);
    });

    it('resolves correct tabs for sale role', () => {
      const result = resolveRoleBottomTabs({
        visibleNavItems: MOCK_NAV_ITEMS,
        userRole: 'sale',
      });

      const paths = result.map((t) => t.path);
      expect(paths).toEqual(['/', '/orders', '/quotes', '/customers']);
      expect(result[0]?.path).toBe('/');
    });

    it('resolves default production tabs for manager/admin role', () => {
      const result = resolveRoleBottomTabs({
        visibleNavItems: MOCK_NAV_ITEMS,
        userRole: 'manager',
      });

      const paths = result.map((t) => t.path);
      expect(paths).toEqual([
        '/',
        '/orders',
        '/raw-fabric',
        '/finished-fabric',
      ]);
    });

    it('falls back to remaining items if preferred tabs are not accessible', () => {
      // Sale role prefers /quotes and /customers, but only /orders and /shipments are accessible
      const restrictedItems = MOCK_NAV_ITEMS.filter((item) =>
        ['/', '/orders', '/shipments'].includes(item.path),
      );

      const result = resolveRoleBottomTabs({
        visibleNavItems: restrictedItems,
        userRole: 'sale',
      });

      const paths = result.map((t) => t.path);
      expect(paths).toContain('/');
      expect(paths).toContain('/orders');
      expect(paths).toContain('/shipments');
    });

    it('limits tabs to maxTabs', () => {
      const result = resolveRoleBottomTabs({
        visibleNavItems: MOCK_NAV_ITEMS,
        userRole: 'sale',
        maxTabs: 3,
      });

      expect(result).toHaveLength(3);
      expect(result.map((t) => t.path)).toEqual(['/', '/orders', '/quotes']);
    });
  });
});
