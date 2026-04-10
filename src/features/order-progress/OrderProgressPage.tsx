import { useState } from 'react';

import { TabSwitcher } from '@/shared/components';

import { ProgressAuditLogView } from './ProgressAuditLog';
import { ProgressBoard } from './ProgressBoard';
import { ProgressDashboard } from './ProgressDashboard';

type Tab = 'dashboard' | 'board' | 'audit';

const TABS = [
  {
    key: 'dashboard' as Tab,
    label: 'Tổng quan',
  },
  {
    key: 'board' as Tab,
    label: 'Board',
  },
  {
    key: 'audit' as Tab,
    label: 'Nhật ký',
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
