import { lazy } from 'react';

import type { FeatureDefinition } from '@/shared/types/feature';
import { createModule } from '@/core/registry/moduleRegistry';
import { LazyPage } from '@/app/router/LazyPage';
export { inventoryAdjustmentSchema } from '@/schema/inventory.schema';
export type { InventoryAdjustmentFormValues } from '@/schema/inventory.schema';

export const inventoryFeature: FeatureDefinition = {
  key: 'inventory',
  route: '/inventory',
  title: 'Tồn kho',
  badge: 'Scaffolded',
  description:
    'Inventory tập trung vào movement, available stock và reservations để tránh over-selling.',
  summary: [
    {
      label: 'Nguồn sự thật',
      value: 'Movements',
    },
    {
      label: 'View mode',
      value: 'Cards + Table',
    },
    {
      label: 'Alerts',
      value: 'Low stock',
    },
  ],
  highlights: [
    'Tồn có sẵn và tồn đã giữ chỗ cần hiển thị tách biệt.',
    'Cảnh báo tồn thấp theo item type.',
    'Mobile card list, desktop rich table.',
  ],
  resources: [
    'Bang inventory_adjustments.',
    'View inventory available va ready to ship.',
    'Badge canh bao o navigation sau khi co data that.',
  ],
  entities: ['Stock card', 'Movement', 'Adjustment', 'Reservation'],
  nextMilestones: [
    'Hop nhat ton soi, vai moc va thanh pham.',
    'Tao card canh bao low stock va aging stock.',
    'Bo sung inventory history theo reference item.',
  ],
};

const InventoryPage = lazy(() =>
  import('./InventoryPage').then((m) => ({ default: m.InventoryPage })),
);

export const inventoryModule = createModule({
  key: 'module-inventory',
  name: 'Tồn Kho',
  routes: [
    {
      path: '/inventory',
      element: (
        <LazyPage>
          <InventoryPage />
        </LazyPage>
      ),
    },
  ],
  menu: [
    {
      path: '/inventory',
      label: 'Tồn kho',
      shortLabel: 'Stock',
      description: 'Tồn khả dụng, tồn giữ chỗ, cảnh báo tồn thấp và truy vết.',
      icon: 'warehouse',
      primaryMobile: true,
      group: 'master-data',
      order: 80,
    },
  ],
});

import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
export const inventoryPlugin: FeaturePlugin = {
  key: 'inventory',
  route: 'inventory',
  label: 'Tồn kho',
  shortLabel: 'Stock',
  description: 'Tồn khả dụng, tồn giữ chỗ, cảnh báo tồn thấp và truy vết.',
  icon: 'warehouse',
  primaryMobile: true,
  group: 'master-data',
  order: 80,
  component: () =>
    import('./InventoryPage').then((m) => ({ default: m.InventoryPage })),
};
