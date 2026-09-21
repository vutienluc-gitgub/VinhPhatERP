import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';

export const approvalPlugin: FeaturePlugin = {
  key: 'approval-engine',
  label: 'Quy trình duyệt',
  shortLabel: 'Phê duyệt',
  description: 'Quản lý quy trình và lịch sử phê duyệt',
  icon: 'ShieldCheck', // Lucide icon
  requiredRoles: ['admin', 'manager'],
  group: 'system',
  order: 95,
  routes: [
    {
      path: 'system/approval/poc',
      component: () =>
        import('./ApprovalPoCPage').then((m) => ({
          default: m.ApprovalPoCPage,
        })),
    },
    {
      path: 'system/approval/workflows',
      component: () =>
        import('./ApprovalWorkflowsPage').then((m) => ({
          default: m.ApprovalWorkflowsPage,
        })),
    },
    {
      path: 'system/approval/workflows/designer',
      component: () =>
        import('./WorkflowDesignerPage').then((m) => ({
          default: m.WorkflowDesignerPage,
        })),
    },
    {
      path: 'system/approval/history',
      component: () =>
        import('./ApprovalHistoryPage').then((m) => ({
          default: m.ApprovalHistoryPage,
        })),
    },
  ],
};
