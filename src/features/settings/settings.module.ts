import type { FeatureDefinition } from '@/shared/types/feature'

export const settingsFeature: FeatureDefinition = {
  key: 'settings',
  route: '/settings',
  title: 'Cài đặt',
  badge: 'Active',
  description:
    'Quản lý thông tin công ty, hiển thị trên báo giá và các chứng từ. Chỉ admin truy cập được.',
  summary: [
    { label: 'Bảng', value: 'company_settings' },
    { label: 'Quyền', value: 'Admin only' },
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
  nextMilestones: [
    'Upload logo trực tiếp.',
    'Config document prefixes.',
  ],
}