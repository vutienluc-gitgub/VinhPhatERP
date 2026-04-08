import type { FeatureDefinition } from '@/shared/types/feature';
import { createModule } from '@/core/registry/moduleRegistry';

export const reportsFeature: FeatureDefinition = {
  key: 'reports',
  route: '/reports',
  title: 'Báo cáo & Dashboard',
  badge: 'Insight',
  description:
    'Trung tâm phân tích dữ liệu kinh doanh, sản xuất, tài chính và hiệu suất.',
  summary: [
    {
      label: 'Báo cáo chuẩn',
      value: '25',
    },
    {
      label: 'Dữ liệu cập nhật',
      value: 'Real-time',
    },
  ],
  highlights: [
    'Biểu đồ trực quan.',
    'Xuất báo cáo Excel/PDF.',
    'Phân tích xu hướng tăng trưởng.',
  ],
  entities: [],
  nextMilestones: [
    'Dự báo sản xuất thông minh.',
    'Báo cáo chi phí giá thành thực tế.',
  ],
};

import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
export const reportsPlugin: FeaturePlugin = {
  key: 'reports',
  route: 'reports',
  label: 'Báo cáo',
  shortLabel: 'Báo cáo',
  description:
    'Tổng hợp số liệu sản xuất, kinh doanh và tài chính toàn công ty.',
  icon: 'package',
  requiredRoles: ['admin', 'manager'],
  group: 'admin',
  order: 100,
  component: () =>
    import('./ReportsPage').then((m) => ({ default: m.ReportsPage })),
};

export default createModule(reportsFeature);
