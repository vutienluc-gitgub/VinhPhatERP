import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';

export const guidePlugin: FeaturePlugin = {
  key: 'guide-system',
  route: 'guide',
  label: 'Sổ tay vận hành',
  shortLabel: 'Hướng dẫn',
  description: 'Tài liệu hướng dẫn, quy trình vận hành và hệ thống Playbook.',
  icon: 'BookOpen',
  requiredRoles: ['admin', 'manager', 'staff'],
  group: 'system',
  order: 90,
  routes: [
    {
      path: 'guide',
      component: () =>
        import('./GuidePage').then((m) => ({ default: m.GuidePage })),
    },
  ],
};
