import { useState } from 'react';

import { TabSwitcher, Icon } from '@/shared/components';
import type { TabItem } from '@/shared/components';
import { useProgressBoard } from '@/application/orders';
import { ORDERS_PROG_LABELS } from '@/features/orders/orders.constants';

import { ProgressAuditLogView } from './ProgressAuditLog';
import { ProgressBoard } from './ProgressBoard';
import { ProgressDashboard } from './ProgressDashboard';

type Tab = 'dashboard' | 'board' | 'audit';

const BASE_TABS: TabItem<Tab>[] = [
  {
    key: 'dashboard',
    label: ORDERS_PROG_LABELS.PROG_TAB_DASHBOARD,
    icon: <Icon name="LayoutDashboard" size={16} />,
  },
  {
    key: 'board',
    label: ORDERS_PROG_LABELS.PROG_TAB_BOARD,
    icon: <Icon name="Kanban" size={16} />,
  },
  {
    key: 'audit',
    label: ORDERS_PROG_LABELS.PROG_TAB_AUDIT,
    icon: <Icon name="History" size={16} />,
  },
];

export function OrderProgressPage() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const { data: boardData = [] } = useProgressBoard();

  const inProgressCount = boardData.filter(
    (r) => r.status === 'in_progress',
  ).length;

  const tabsWithBadge = BASE_TABS.map((t) => {
    if (t.key === 'board')
      return {
        ...t,
        badge: inProgressCount,
      };
    return t;
  });

  return (
    <div className="page-container flex flex-col gap-6 pb-20">
      <div className="panel-card card-flush">
        <div className="card-header-area">
          <div className="card-header-row">
            <h3 className="text-lg font-bold m-0">
              {ORDERS_PROG_LABELS.PROG_PAGE_TITLE}
            </h3>
          </div>
        </div>

        <div className="px-5 pb-4 pt-3">
          <TabSwitcher tabs={tabsWithBadge} active={tab} onChange={setTab} />
        </div>
      </div>

      {tab === 'dashboard' && <ProgressDashboard />}
      {tab === 'board' && <ProgressBoard />}
      {tab === 'audit' && <ProgressAuditLogView />}
    </div>
  );
}
