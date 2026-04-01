import { useState } from 'react'

import { DebtSummary } from './DebtSummary'
import { PaymentList } from './PaymentList'

type Tab = 'list' | 'debt'

export function PaymentsPage() {
  const [tab, setTab] = useState<Tab>('list')

  return (
    <div>
      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          className={tab === 'list' ? 'primary-button' : 'btn-secondary'}
          type="button"
          onClick={() => setTab('list')}
          style={{ padding: '0.5rem 1rem', fontSize: '0.88rem' }}
        >
          Lịch sử thu tiền
        </button>
        <button
          className={tab === 'debt' ? 'primary-button' : 'btn-secondary'}
          type="button"
          onClick={() => setTab('debt')}
          style={{ padding: '0.5rem 1rem', fontSize: '0.88rem' }}
        >
          Công nợ
        </button>
      </div>

      {tab === 'list' ? <PaymentList /> : <DebtSummary />}
    </div>
  )
}