import { useState } from 'react';

import { useDebtSummary, useSupplierDebt } from '@/application/payments';
import { countOverdueDebts } from '@/domain/payments';
import { TabSwitcher, Icon, PageLayout } from '@/shared/components';
import type { TabItem } from '@/shared/components';
import type { Expense, PaymentAccount } from '@/domain/payments/types';

import { AccountForm } from './AccountForm';
import {
  PAYMENTS_PAGE_TABS as TABS,
  PAYMENTS_PAGE_MESSAGES as MSG,
} from './payments.constants';
import { AccountList } from './AccountList';
import { CashFlowDashboard } from './CashFlowDashboard';
import { DebtSummary } from './DebtSummary';
import { ExpenseForm } from './ExpenseForm';
import { ExpenseList } from './ExpenseList';
import { PaymentList } from './PaymentList';
import { SupplierDebtSummary } from './SupplierDebtSummary';

type Tab =
  | 'cashflow'
  | 'payments'
  | 'expenses'
  | 'customer-debt'
  | 'supplier-debt'
  | 'accounts';

const BASE_TABS: TabItem<Tab>[] = [
  {
    key: 'cashflow',
    label: TABS.CASH_FLOW,
    icon: <Icon name="LineChart" size={16} />,
  },
  {
    key: 'payments',
    label: TABS.RECEIPTS,
    icon: <Icon name="Receipt" size={16} />,
  },
  {
    key: 'expenses',
    label: TABS.EXPENSES,
    icon: <Icon name="CreditCard" size={16} />,
  },
  {
    key: 'customer-debt',
    label: TABS.CUSTOMER_DEBTS,
    icon: <Icon name="Users" size={16} />,
  },
  {
    key: 'supplier-debt',
    label: TABS.SUPPLIER_DEBTS,
    icon: <Icon name="Truck" size={16} />,
  },
  {
    key: 'accounts',
    label: TABS.ACCOUNTS,
    icon: <Icon name="Wallet" size={16} />,
  },
];

export function PaymentsPage() {
  const [tab, setTab] = useState<Tab>('cashflow');

  // Badge data
  const { data: customerDebts = [] } = useDebtSummary();
  const { data: supplierDebts = [] } = useSupplierDebt();

  const customerDebtCount = countOverdueDebts(customerDebts);
  const supplierDebtCount = countOverdueDebts(supplierDebts);

  const tabsWithBadge = BASE_TABS.map((t) => {
    if (t.key === 'customer-debt') return { ...t, badge: customerDebtCount };
    if (t.key === 'supplier-debt') return { ...t, badge: supplierDebtCount };
    return t;
  });

  // Expense form state
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [preselectedSupplierId, setPreselectedSupplierId] = useState<string>();

  // Account form state
  const [editAccount, setEditAccount] = useState<PaymentAccount | null>(null);
  const [showAccountForm, setShowAccountForm] = useState(false);

  return (
    <div className="page-container">
      <PageLayout className="flex flex-col gap-6 flex-1 h-full">
        {/* Premium Tab Header */}
        <div className="panel-card card-flush">
          <div className="card-header-area">
            <div className="card-header-row">
              <h3 className="text-lg font-bold m-0">{MSG.TITLE}</h3>
            </div>
          </div>
          <div className="px-5 pb-4 pt-3">
            <TabSwitcher tabs={tabsWithBadge} active={tab} onChange={setTab} />
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
                setPreselectedSupplierId(undefined);
                setShowExpenseForm(true);
              }}
            />
            {showExpenseForm && (
              <ExpenseForm
                expense={editExpense}
                initialSupplierId={preselectedSupplierId}
                onClose={() => {
                  setShowExpenseForm(false);
                  setEditExpense(null);
                  setPreselectedSupplierId(undefined);
                }}
              />
            )}
          </>
        )}

        {tab === 'customer-debt' && <DebtSummary />}

        {tab === 'supplier-debt' && (
          <SupplierDebtSummary
            onPay={(supplierId) => {
              setTab('expenses');
              setPreselectedSupplierId(supplierId);
              setEditExpense(null);
              setShowExpenseForm(true);
            }}
          />
        )}

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
      </PageLayout>
    </div>
  );
}
