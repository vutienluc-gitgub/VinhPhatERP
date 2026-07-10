import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
import type { FeatureDefinition } from '@/shared/types/feature';
import { createModule } from '@/core/registry/moduleRegistry';

export const purchaseRequestsFeature: FeatureDefinition = {
  key: 'purchase-requests',
  route: '/purchase-requests',
  title: 'Yêu cầu mua hàng (PR)',
  badge: 'Procurement',
  description: 'Quản lý các yêu cầu mua vật tư từ nội bộ (Kho, Sản xuất).',
  summary: [{ label: 'PR Chờ xử lý', value: '0' }],
  highlights: ['Quản lý nhu cầu tập trung.', 'Chuyển đổi PR sang RFQ tự động.'],
  entities: ['purchase_requests', 'purchase_request_items'],
  nextMilestones: ['Duyệt PR qua Zalo'],
};

export const purchaseRequestsPlugin: FeaturePlugin = {
  key: 'purchase-requests',
  route: 'purchase-requests',
  label: 'Yêu cầu mua hàng',
  shortLabel: 'PR',
  description: 'Quản lý nhu cầu mua vật tư',
  icon: 'ClipboardList',
  requiredRoles: ['admin', 'manager', 'staff'],
  group: 'production',
  order: 1,
  routes: [
    {
      path: 'purchase-requests',
      component: () => import('./PRList').then((m) => ({ default: m.PRList })),
    },
    {
      path: 'purchase-requests/create',
      component: () =>
        import('./PRCreate').then((m) => ({ default: m.PRCreate })),
    },
  ],
};

export default createModule(purchaseRequestsFeature);
