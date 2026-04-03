import { useState } from 'react'

import { AccountForm } from './AccountForm'
import { AccountList } from './AccountList'
import { CashFlowDashboard } from './CashFlowDashboard'
import { DebtSummary } from './DebtSummary'
import { ExpenseForm } from './ExpenseForm'
import { ExpenseList } from './ExpenseList'
import { PaymentList } from './PaymentList'
import { SupplierDebtSummary } from './SupplierDebtSummary'
import type { Expense, PaymentAccount } from './types'

type Tab = 'cashflow' | 'payments' | 'expenses' | 'customer-debt' | 'supplier-debt' | 'accounts'

const TAB_CONFIG: { key: Tab; label: string }[] = [
  { key: 'cashflow', label: 'Dòng tiền' },
  { key: 'payments', label: 'Phiếu thu' },
  { key: 'expenses', label: 'Phiếu chi' },
  { key: 'customer-debt', label: 'Công nợ KH' },
  { key: 'supplier-debt', label: 'Công nợ NCC' },
  { key: 'accounts', label: 'Tài khoản' },
]

export function PaymentsPage() {
  const [tab, setTab] = useState<Tab>('cashflow')

  // Expense form state
  const [editExpense, setEditExpense] = useState<Expense | null>(null)
  const [showExpenseForm, setShowExpenseForm] = useState(false)

  // Account form state
  const [editAccount, setEditAccount] = useState<PaymentAccount | null>(null)
  const [showAccountForm, setShowAccountForm] = useState(false)

  return (
    <div>
      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {TAB_CONFIG.map(({ key, label }) => (
          <button
            key={key}
            className={tab === key ? 'primary-button' : 'btn-secondary'}
            type="button"
            onClick={() => setTab(key)}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'cashflow' && <CashFlowDashboard />}

      {tab === 'payments' && <PaymentList />}

      {tab === 'expenses' && (
        <>
          <ExpenseList
            onEdit={(exp) => { setEditExpense(exp); setShowExpenseForm(true) }}
            onNew={() => { setEditExpense(null); setShowExpenseForm(true) }}
          />
          {showExpenseForm && (
            <ExpenseForm
              expense={editExpense}
              onClose={() => { setShowExpenseForm(false); setEditExpense(null) }}
            />
          )}
        </>
      )}

      {tab === 'customer-debt' && <DebtSummary />}

      {tab === 'supplier-debt' && <SupplierDebtSummary />}

      {tab === 'accounts' && (
        <>
          <AccountList
            onEdit={(acc) => { setEditAccount(acc); setShowAccountForm(true) }}
            onNew={() => { setEditAccount(null); setShowAccountForm(true) }}
          />
          {showAccountForm && (
            <AccountForm
              account={editAccount}
              onClose={() => { setShowAccountForm(false); setEditAccount(null) }}
            />
          )}
        </>
      )}
    </div>
  )
}