import { lazy } from 'react';

import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';

const ApprovalWorkflowsPage = lazy(() =>
  import('./ApprovalWorkflowsPage').then((m) => ({
    default: m.ApprovalWorkflowsPage,
  })),
);
const ApprovalHistoryPage = lazy(() =>
  import('./ApprovalHistoryPage').then((m) => ({
    default: m.ApprovalHistoryPage,
  })),
);
const ApprovalPoCPage = lazy(() =>
  import('./ApprovalPoCPage').then((m) => ({ default: m.ApprovalPoCPage })),
);
const WorkflowDesignerPage = lazy(() =>
  import('./WorkflowDesignerPage').then((m) => ({
    default: m.WorkflowDesignerPage,
  })),
);

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
      component: async () => ({ default: ApprovalPoCPage }),
    },
    {
      path: 'system/approval/workflows',
      component: async () => ({ default: ApprovalWorkflowsPage }),
    },
    {
      path: 'system/approval/workflows/designer',
      component: async () => ({ default: WorkflowDesignerPage }),
    },
    {
      path: 'system/approval/history',
      component: async () => ({ default: ApprovalHistoryPage }),
    },
  ],
};
