import type { FeatureDefinition } from '@/shared/types/feature';

export const settingsFeature: FeatureDefinition = {
  key: 'settings',
  route: '/settings',
  title: 'Cài đặt',
  badge: 'Active',
  description:
    'Quản lý thông tin công ty, hiển thị trên báo giá và các chứng từ. Chỉ admin truy cập được.',
  summary: [
    {
      label: 'Bảng',
      value: 'company_settings',
    },
    {
      label: 'Quyền',
      value: 'Admin only',
    },
  ],
  highlights: [
    'Chỉ admin mới được xem và sửa.',
    'Thông tin tự động chèn vào báo giá khi in.',
    'Hỗ trợ logo, MST, ngân hàng, email.',
  ],
  resources: [
    'Bảng company_settings (key-value).',
    'RLS: đọc mọi người, ghi admin.',
  ],
  entities: ['CompanySetting'],
  nextMilestones: ['Upload logo trực tiếp.', 'Config document prefixes.'],
};

import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
export const settingsPlugin: FeaturePlugin = {
  key: 'settings',
  route: 'settings',
  label: 'Cài đặt',
  shortLabel: 'Settings',
  description: 'Cấu hình môi trường, phân quyền, đồng bộ và triển khai.',
  icon: 'settings',
  requiredRoles: ['admin'],
  routeGuard: 'admin',
  group: 'system',
  order: 99,
  component: () => import('./index').then((m) => ({ default: m.SettingsPage })),
};
