import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';

export const crmPlugin: FeaturePlugin = {
  key: 'crm',
  label: 'Khách hàng Tiềm năng (Leads)',
  shortLabel: 'Leads',
  description: 'Quản lý yêu cầu báo giá và mẫu vải từ khách hàng.',
  icon: 'Target',
  group: 'sales',
  order: 60,
  routes: [
    {
      path: 'crm/leads',
      component: () =>
        import('./pages/LeadsPage').then((m) => ({ default: m.LeadsPage })),
    },
  ],
};
