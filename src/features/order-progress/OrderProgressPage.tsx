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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <TabSwitcher tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'dashboard' && <ProgressDashboard />}
      {tab === 'board' && <ProgressBoard />}
      {tab === 'audit' && <ProgressAuditLogView />}
    </div>
  );
}
