import { lazy } from 'react';

import type { FeatureDefinition } from '@/shared/types/feature';
import { createModule } from '@/core/registry/moduleRegistry';
import { LazyPage } from '@/app/router/LazyPage';
import { inventoryAdjustmentSchema } from '@/schema/inventory.schema';
import type { InventoryAdjustmentFormValues } from '@/schema/inventory.schema';
import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';

import type { InventoryAction, InventoryLog } from './types';
import { inventoryFeature as inventoryFeatureExport } from './inventory.feature';

export { inventoryAdjustmentSchema, inventoryFeatureExport };
export type { InventoryAdjustmentFormValues, InventoryAction, InventoryLog };

export const inventoryFeature: FeatureDefinition = {
  key: 'inventory',
  route: '/inventory',
  title: 'Kho & Tồn kho',
  badge: 'Critical',
  description:
    'Quản lý linh hoạt nhập/xuất kho, điều chỉnh tồn kho và nhật ký giao dịch.',
  summary: [
    {
      label: 'Sức chứa',
      value: '85%',
    },
    {
      label: 'Giao dịch/tháng',
      value: '1.2k',
    },
  ],
  highlights: [
    'Quản lý đa kho.',
    'Nhật ký giao dịch thời gian thực.',
    'Hỗ trợ QR Code/Barcode.',
  ],
  entities: ['inventory_stocks', 'inventory_logs', 'warehouses'],
  nextMilestones: [
    'Tự động cảnh báo tồn kho thấp.',
    'Tích hợp tính giá vốn hàng tồn kho.',
  ],
};

export const inventoryPlugin: FeaturePlugin = {
  key: 'inventory',
  route: 'inventory',
  label: 'Kho & Tồn kho',
  shortLabel: 'Kho',
  description: 'Theo dõi tồn kho sợi, mộc, thành phẩm và vật tư.',
  icon: 'package',
  requiredRoles: ['admin', 'manager', 'staff'],
  group: 'inventory',
  order: 20,
  component: () =>
    import('./InventoryPage').then((m) => ({ default: m.InventoryPage })),
};

export default createModule(inventoryFeature);
