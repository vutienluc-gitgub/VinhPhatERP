import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
import type { FeatureDefinition } from '@/shared/types/feature';
import { createModule } from '@/core/registry/moduleRegistry';

export const rfqsFeature: FeatureDefinition = {
  key: 'sourcing-rfqs',
  route: '/sourcing-rfqs',
  title: 'Yêu cầu Báo giá (RFQ)',
  badge: 'Procurement',
  description:
    'Quản lý các yêu cầu thu mua, tạo QR Code và nhận báo giá từ Nhà cung cấp.',
  summary: [{ label: 'RFQ Đang mở', value: '0' }],
  highlights: ['Tích hợp QR Code.', 'Chấm điểm NCC tự động.'],
  entities: ['sourcing_rfqs', 'sourcing_rfq_items'],
  nextMilestones: ['Kết nối Zalo ZNS để gửi RFQ'],
};

export const rfqsPlugin: FeaturePlugin = {
  key: 'sourcing-rfqs',
  route: 'sourcing-rfqs',
  label: 'Yêu cầu Báo giá',
  shortLabel: 'RFQ',
  description: 'Tạo RFQ và so sánh giá',
  icon: 'FileSearch',
  requiredRoles: ['admin', 'manager', 'staff'],
  group: 'production',
  order: 2,
  routes: [
    {
      path: 'sourcing-rfqs',
      component: () =>
        import('./RFQList').then((m) => ({ default: m.RFQList })),
    },
    {
      path: 'sourcing-rfqs/create',
      component: () =>
        import('./RFQCreate').then((m) => ({ default: m.RFQCreate })),
    },
    {
      path: 'sourcing-rfqs/:id',
      component: () =>
        import('./RFQDetail').then((m) => ({ default: m.RFQDetail })),
    },
  ],
};

export default createModule(rfqsFeature);
