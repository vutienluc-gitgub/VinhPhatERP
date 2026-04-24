import { FeaturePlugin } from '@/shared/lib/FeatureRegistry';

export const operationsPlugin: FeaturePlugin = {
  key: 'operations',
  route: 'operations',
  label: 'Vận hành & Task',
  shortLabel: 'Vận hành',
  description: 'Quản lý công việc, task và hiệu suất vận hành',
  icon: 'ListChecks',
  order: 95,
  group: 'system',
  component: () =>
    import('./OperationsPage').then((m) => ({ default: m.OperationsPage })),
};
