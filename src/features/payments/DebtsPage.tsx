import { useState } from 'react';

import { TabSwitcher } from '@/shared/components';
import type { TabItem } from '@/shared/components';
import { Icon } from '@/shared/components/Icon';
import { DebtAgingSection } from '@/shared/components/debt-aging/DebtAgingSection';
import { useDebtAging } from '@/shared/components/debt-aging/useDebtAging';

import { DebtSummary } from './DebtSummary';
import { SupplierDebtSummary } from './SupplierDebtSummary';

type DebtTab = 'customer' | 'supplier';

const TABS: TabItem<DebtTab>[] = [
  {
    key: 'customer',
    label: 'Công nợ Khách hàng',
    icon: <Icon name="Users" size={16} />,
  },
  {
    key: 'supplier',
    label: 'Công nợ Nhà cung cấp',
    icon: <Icon name="Building2" size={16} />,
  },
];

export function DebtsPage() {
  const [activeTab, setActiveTab] = useState<DebtTab>('customer');
  const debtAging = useDebtAging();

  return (
    <div className="page-container p-4 md:p-6 overflow-x-hidden">
      <div className="panel-card card-flush mb-6">
        <div className="card-header-area">
          <div className="card-header-row">
            <div>
              <p className="eyebrow">Tài chính</p>
              <h3 className="m-0 text-base font-bold">Quản lý Công nợ</h3>
            </div>
          </div>
        </div>

        <div className="px-5 pb-4 pt-3">
          <TabSwitcher
            tabs={TABS}
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
