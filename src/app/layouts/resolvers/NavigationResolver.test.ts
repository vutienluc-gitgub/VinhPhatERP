import { beforeEach, describe, expect, it } from 'vitest';

import { FeatureRegistry } from '@/shared/lib/FeatureRegistry';

import {
  resolveMobileNav,
  resolveNavGroups,
  resolveNavItems,
} from './NavigationResolver';

describe('NavigationResolver', () => {
  beforeEach(() => {
    FeatureRegistry.clear();
  });

  it('filters navigation items based on user role', () => {
    FeatureRegistry.registerAll([
      {
        key: 'customers',
        label: 'Khách hàng',
        shortLabel: 'KH',
        description: 'Quản lý khách hàng',
        group: 'sales',
        order: 10,
        entryPath: '/customers',
        requiredRoles: ['admin', 'manager'],
      },
      {
        key: 'reports',
        label: 'Báo cáo',
        shortLabel: 'BC',
        description: 'Báo cáo doanh thu',
        group: 'system',
        order: 20,
        entryPath: '/reports',
        requiredRoles: ['admin'],
      },
      {
        key: 'public-info',
        label: 'Thông tin chung',
        shortLabel: 'TT',
        description: 'Thông tin',
        group: 'system',
        order: 30,
        entryPath: '/info',
      },
    ]);

    // Manager role
    const managerItems = resolveNavItems('manager');
    const managerKeys = managerItems.map((i) => i.key);
    expect(managerKeys).toEqual(['customers', 'public-info']);

    // Admin role
    const adminItems = resolveNavItems('admin');
    const adminKeys = adminItems.map((i) => i.key);
    expect(adminKeys).toEqual(['customers', 'reports', 'public-info']);

    // Staff role (only public-info has no requiredRoles)
    const staffItems = resolveNavItems('staff');
    const staffKeys = staffItems.map((i) => i.key);
    expect(staffKeys).toEqual(['public-info']);
  });

  it('groups navigation items by PluginGroup and sorts by order', () => {
    FeatureRegistry.registerAll([
      {
        key: 'orders',
        label: 'Đơn hàng',
        shortLabel: 'ĐH',
        description: 'Đơn hàng',
        group: 'sales',
        order: 20,
        entryPath: '/orders',
      },
      {
        key: 'customers',
        label: 'Khách hàng',
        shortLabel: 'KH',
        description: 'Khách hàng',
        group: 'sales',
        order: 10,
        entryPath: '/customers',
      },
      {
        key: 'inventory',
        label: 'Kho',
        shortLabel: 'Kho',
        description: 'Kho',
        group: 'warehouse',
        order: 15,
        entryPath: '/inventory',
      },
    ]);

    const groups = resolveNavGroups('admin');
    expect(groups).toHaveLength(2);

    const salesGroup = groups.find((g) => g.group === 'sales');
    expect(salesGroup?.items.map((i) => i.key)).toEqual([
      'customers',
      'orders',
    ]);

    const warehouseGroup = groups.find((g) => g.group === 'warehouse');
    expect(warehouseGroup?.items.map((i) => i.key)).toEqual(['inventory']);
  });

  it('filters primary mobile navigation items', () => {
    FeatureRegistry.registerAll([
      {
        key: 'customers',
        label: 'Khách hàng',
        shortLabel: 'KH',
        description: 'Khách hàng',
        group: 'sales',
        order: 10,
        entryPath: '/customers',
        primaryMobile: true,
      },
      {
        key: 'reports',
        label: 'Báo cáo',
        shortLabel: 'BC',
        description: 'Báo cáo',
        group: 'system',
        order: 20,
        entryPath: '/reports',
        primaryMobile: false,
      },
    ]);

    const mobileItems = resolveMobileNav('admin');
    expect(mobileItems).toHaveLength(1);
    expect(mobileItems[0]?.key).toBe('customers');
  });
});
