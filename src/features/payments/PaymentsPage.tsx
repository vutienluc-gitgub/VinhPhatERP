import { useState } from 'react';

import { TabSwitcher, Icon } from '@/shared/components';
import type { TabItem } from '@/shared/components';

import { AccountForm } from './AccountForm';
import { AccountList } from './AccountList';
import { CashFlowDashboard } from './CashFlowDashboard';
import { DebtSummary } from './DebtSummary';
import { ExpenseForm } from './ExpenseForm';
import { ExpenseList } from './ExpenseList';
import { PaymentList } from './PaymentList';
import { SupplierDebtSummary } from './SupplierDebtSummary';
import type { Expense, PaymentAccount } from './types';

type Tab =
  | 'cashflow'
  | 'payments'
  | 'expenses'
  | 'customer-debt'
  | 'supplier-debt'
  | 'accounts';

const TAB_CONFIG: TabItem<Tab>[] = [
  {
    key: 'cashflow',
    label: 'Dòng tiền',
    icon: <Icon name="LineChart" size={16} />,
  },
  {
    key: 'payments',
    label: 'Phiếu thu',
    icon: <Icon name="Receipt" size={16} />,
  },
  {
    key: 'expenses',
    label: 'Phiếu chi',
    icon: <Icon name="CreditCard" size={16} />,
  },
  {
    key: 'customer-debt',
    label: 'Công nợ KH',
    icon: <Icon name="Users" size={16} />,
  },
  {
    key: 'supplier-debt',
    label: 'Công nợ NCC',
    icon: <Icon name="Truck" size={16} />,
  },
  {
    key: 'accounts',
    label: 'Tài khoản',
    icon: <Icon name="Wallet" size={16} />,
  },
];

export function PaymentsPage() {
  const [tab, setTab] = useState<Tab>('cashflow');

  // Expense form state
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  // Account form state
  const [editAccount, setEditAccount] = useState<PaymentAccount | null>(null);
  const [showAccountForm, setShowAccountForm] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      {/* Premium Tab Header */}
      <div className="panel-card card-flush">
        <div className="card-header-area">
          <div className="card-header-row">
            <div>
              <p className="eyebrow">Tài chính</p>
              <h3 className="m-0 text-base font-bold">Quản lý Tiền tệ</h3>
            </div>
          </div>
        </div>
        <div className="px-5 pb-4 pt-3">
          <TabSwitcher
            tabs={TAB_CONFIG}
            active={tab}
            onChange={setTab}
            variant="premium"
          />
        </div>
      </div>

      {/* Tab content */}
      {tab === 'cashflow' && <CashFlowDashboard />}

      {tab === 'payments' && <PaymentList />}

      {tab === 'expenses' && (
        <>
          <ExpenseList
            onEdit={(exp) => {
              setEditExpense(exp);
              setShowExpenseForm(true);
            }}
            onNew={() => {
              setEditExpense(null);
              setShowExpenseForm(true);
            }}
          />
          {showExpenseForm && (
            <ExpenseForm
              expense={editExpense}
              onClose={() => {
                setShowExpenseForm(false);
                setEditExpense(null);
              }}
            />
          )}
        </>
      )}

      {tab === 'customer-debt' && <DebtSummary />}

      {tab === 'supplier-debt' && <SupplierDebtSummary />}

      {tab === 'accounts' && (
        <>
          <AccountList
            onEdit={(acc) => {
              setEditAccount(acc);
              setShowAccountForm(true);
            }}
            onNew={() => {
              setEditAccount(null);
              setShowAccountForm(true);
            }}
          />
          {showAccountForm && (
            <AccountForm
              account={editAccount}
              onClose={() => {
                setShowAccountForm(false);
                setEditAccount(null);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
