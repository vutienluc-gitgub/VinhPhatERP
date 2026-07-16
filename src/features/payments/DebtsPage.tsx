import { useState } from 'react';

import { TabSwitcher } from '@/shared/components';
import type { TabItem } from '@/shared/components';
import { Icon } from '@/shared/components/Icon';
import { DebtAgingSection } from '@/shared/components/DebtAgingSection';
import { useDebtAging } from '@/application/reports/useDebtAging';

import { DebtSummary } from './DebtSummary';
import { SupplierDebtSummary } from './SupplierDebtSummary';
import {
  DEBTS_PAGE_TABS as TABS,
  DEBTS_PAGE_MESSAGES as MSG,
} from './payments.constants';

type DebtTab = 'customer' | 'supplier';

const TABS_CONFIG: TabItem<DebtTab>[] = [
  {
    key: 'customer',
    label: TABS.CUSTOMER,
    icon: <Icon name="Users" size={16} />,
  },
  {
    key: 'supplier',
    label: TABS.SUPPLIER,
    icon: <Icon name="Building2" size={16} />,
  },
];

export function DebtsPage() {
  const [activeTab, setActiveTab] = useState<DebtTab>('customer');
  const debtAging = useDebtAging();

  return (
    <div className="page-container">
      <div className="panel-card card-flush mb-6">
        <div className="card-header-area">
          <div className="card-header-row">
            <h3 className="text-lg font-bold m-0">{MSG.TITLE}</h3>
          </div>
        </div>

        <div className="px-5 pb-4 pt-3">
          <TabSwitcher
            tabs={TABS_CONFIG}
            active={activeTab}
            onChange={setActiveTab}
            variant="premium"
          />
        </div>
      </div>

      {/* Content - Responsive Gap */}
      <div className="flex flex-col gap-6">
        {activeTab === 'customer' ? (
          <>
            <DebtSummary />
            <DebtAgingSection
              data={debtAging.data ?? []}
              isLoading={debtAging.isLoading}
            />
          </>
        ) : (
          <SupplierDebtSummary />
        )}
      </div>
    </div>
  );
}
