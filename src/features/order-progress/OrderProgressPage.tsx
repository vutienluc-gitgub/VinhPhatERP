import { useState } from 'react'

import { ProgressAuditLogView } from './ProgressAuditLog'
import { ProgressBoard } from './ProgressBoard'
import { ProgressDashboard } from './ProgressDashboard'

type Tab = 'dashboard' | 'board' | 'audit'

const TABS: { key: Tab; label: string }[] = [
  { key: 'dashboard', label: 'Tổng quan' },
  { key: 'board', label: 'Board' },
  { key: 'audit', label: 'Nhật ký' },
]

export function OrderProgressPage() {
  const [tab, setTab] = useState<Tab>('dashboard')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`tab-item${tab === t.key ? ' is-active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && <ProgressDashboard />}
      {tab === 'board' && <ProgressBoard />}
      {tab === 'audit' && <ProgressAuditLogView />}
    </div>
  )
}