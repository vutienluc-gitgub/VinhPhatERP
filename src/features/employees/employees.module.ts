import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';

export const employeesPlugin: FeaturePlugin = {
  key: 'employees',
  route: 'employees',
  label: 'Nhân viên',
  shortLabel: 'Nhân sự',
  description: 'Quản trị nhân viên, tài xế, kinh doanh',
  icon: 'UserCog',
  requiredRoles: ['admin', 'manager'],
  group: 'master-data',
  order: 100,
  routes: [
    {
      path: 'employees',
      component: () =>
        import('./EmployeeListPage').then((m) => ({
          default: m.EmployeeListPage,
        })),
    },
  ],
};
