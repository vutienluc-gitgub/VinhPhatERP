import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';

export * from './ContractDetailPage';
export * from './ContractForm';
export * from './ContractsPage';
export * from './ContractsFeature';
export * from './ContractPreview';
export * from './ContractStatusBadge';
export * from './contracts.module';

export const contractsPlugin: FeaturePlugin = {
  key: 'contracts',
  route: 'contracts',
  label: 'Hợp đồng',
  shortLabel: 'HĐ',
  description: 'Quản lý hợp đồng bán hàng và mua hàng.',
  icon: 'FileText',
  group: 'sales',
  order: 15,
  routes: [
    {
      path: 'contracts',
      component: () =>
        import('./ContractsFeature').then((m) => ({
          default: m.ContractsFeature,
        })),
    },
  ],
};
