import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';

export const contractTemplatesPlugin: FeaturePlugin = {
  key: 'contract-templates',
  route: 'contract-templates',
  label: 'Mẫu hợp đồng',
  shortLabel: 'Mẫu HĐ',
  description: 'Quản lý mẫu nội dung hợp đồng bán hàng và mua hàng.',
  icon: 'FileEdit',
  requiredRoles: ['admin'],
  group: 'system',
  order: 92,
  routes: [
    {
      path: 'contract-templates',
      component: () =>
        import('./ContractTemplatesPage').then((m) => ({
          default: m.ContractTemplatesPage,
        })),
    },
  ],
};
