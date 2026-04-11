import { useState } from 'react';

import { TabSwitcher, Icon } from '@/shared/components';
import type { TabItem } from '@/shared/components';

import { ProgressAuditLogView } from './ProgressAuditLog';
import { ProgressBoard } from './ProgressBoard';
import { ProgressDashboard } from './ProgressDashboard';

type Tab = 'dashboard' | 'board' | 'audit';

const TABS: TabItem<Tab>[] = [
  {
    key: 'dashboard',
    label: 'Tổng quan',
    icon: <Icon name="LayoutDashboard" size={16} />,
  },
  {
    key: 'board',
    label: 'Bảng tiến hồ',
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

  return (
    <div className="flex flex-col gap-6">
      <div className="panel-card card-flush">
        <div className="card-header-area card-header-premium">
          <div>
            <p className="eyebrow-premium">SẢN XUẤT</p>
            <h3 className="title-premium">Tiến độ sản xuất</h3>
          </div>
        </div>

        <TabSwitcher
          tabs={TABS}
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
