import type { FeatureDefinition } from '@/shared/types/feature';
import { createModule } from '@/core/registry/moduleRegistry';

export const quotationsFeature: FeatureDefinition = {
  key: 'quotations',
  route: '/quotations',
  title: 'Báo giá (CRM)',
  badge: 'Sale-Tool',
  description:
    'Công cụ tính toán giá thành nhanh cho khách hàng dựa trên biến động giá sợi và nhu cầu.',
  summary: [
    {
      label: 'Mẫu báo giá',
      value: '15',
    },
    {
      label: 'Tỷ lệ chốt',
      value: '65%',
    },
  ],
  highlights: [
    'Tính toán giá nhanh.',
    'Lưu lịch sử báo giá khách hàng.',
    'Xuất PDF chuyên nghiệp.',
  ],
  entities: ['quotations'],
  nextMilestones: [
    'Tự động lấy giá sợi thị trường.',
    'Tích hợp chatbot gửi báo giá nhanh.',
  ],
};

import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
export const quotationsPlugin: FeaturePlugin = {
  key: 'quotations',
  route: 'quotations',
  label: 'Báo giá',
  shortLabel: 'Báo giá',
  description: 'Tạo và quản lý báo giá gửi tới khách hàng tiềm năng.',
  icon: 'package',
  requiredRoles: ['admin', 'manager', 'staff'],
  group: 'sales',
  order: 5,
  component: () =>
    import('./QuotationsPage').then((m) => ({ default: m.QuotationsPage })),
};

export default createModule(quotationsFeature);
