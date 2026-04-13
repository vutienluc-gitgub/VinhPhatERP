import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';

export * from './ContractDetailPage';
export * from './ContractForm';
export * from './ContractsPage';
export * from './ContractPreview';
export * from './ContractStatusBadge';
export * from './contracts.module';

export const contractsPlugin: FeaturePlugin = {
  key: 'contracts',
  route: 'contracts',
  label: 'Hop dong',
  shortLabel: 'HĐ',
  description: 'Quan ly hop dong ban hang va mua hang.',
  icon: 'FileText',
  group: 'sales',
  order: 15,
  component: () =>
    import('./ContractsPage').then((m) => ({ default: m.ContractsPage })),
};
