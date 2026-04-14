import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
import type { FeatureDefinition } from '@/shared/types/feature';
import { createModule } from '@/core/registry/moduleRegistry';
import type {
  CompanySettingRow,
  CompanySettingsFormValues,
  CompanySettingsMap,
} from '@/schema/company-settings.schema';

export type {
  CompanySettingRow,
  CompanySettingsFormValues,
  CompanySettingsMap,
};

export const settingsFeature: FeatureDefinition = {
  key: 'settings',
  route: '/settings',
  title: 'Cài đặt hệ thống',
  badge: 'Settings',
  description:
    'Quản lý thông tin công ty, cấu hình quy trình, phân quyền và các tham số vận hành.',
  summary: [
    {
      label: 'Người dùng',
      value: '15',
    },
    {
      label: 'Vai trò',
      value: '4',
    },
  ],
  highlights: [
    'Cấu hình thông tin pháp lý.',
    'Quản lý danh mục dùng chung.',
    'Backup dữ liệu.',
  ],
  entities: ['company_settings'],
  nextMilestones: ['Tích hợp nhật ký hoạt động hệ thống (System Audit Logs).'],
};

export const settingsPlugin: FeaturePlugin = {
  key: 'settings',
  route: 'settings',
  label: 'Cài đặt',
  shortLabel: 'Cấu hình',
  description: 'Cài đặt thông tin công ty và các tham số vận hành hệ thống.',
  icon: 'Settings',
  requiredRoles: ['admin'],
  group: 'system',
  routes: [
    {
      path: 'settings',
      component: () =>
        import('./SettingsPage').then((m) => ({ default: m.SettingsPage })),
    },
  ],
};

export default createModule(settingsFeature);
