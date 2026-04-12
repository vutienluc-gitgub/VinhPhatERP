import { useState } from 'react';

import { TabSwitcher, Icon } from '@/shared/components';
import type { TabItem } from '@/shared/components';

import { ProgressAuditLogView } from './ProgressAuditLog';
import { ProgressBoard } from './ProgressBoard';
import { ProgressDashboard } from './ProgressDashboard';
import { useProgressBoard } from './useOrderProgress';

type Tab = 'dashboard' | 'board' | 'audit';

const BASE_TABS: TabItem<Tab>[] = [
  {
    key: 'dashboard',
    label: 'Tổng quan',
    icon: <Icon name="LayoutDashboard" size={16} />,
  },
  {
    key: 'board',
    label: 'Bảng tiến độ',
    icon: <Icon name="Kanban" size={16} />,
  },
  {
    key: 'audit',
    label: 'Nhật ký',
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
    <div className="flex flex-col gap-6">
      <div className="panel-card card-flush">
        <div className="card-header-area card-header-premium">
          <div>
            <p className="eyebrow-premium">SAN XUAT</p>
            <h3 className="title-premium">Tien do San xuat</h3>
          </div>
        </div>

        <TabSwitcher
          tabs={tabsWithBadge}
          active={tab}
          onChange={setTab}
          variant="underline"
        />
      </div>

      {tab === 'dashboard' && <ProgressDashboard />}
      {tab === 'board' && <ProgressBoard />}
      {tab === 'audit' && <ProgressAuditLogView />}
    </div>
  );
}
