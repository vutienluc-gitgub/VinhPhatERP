import { useState } from 'react';

import { Icon } from '@/shared/components/Icon';

import { DebtSummary } from './DebtSummary';
import { SupplierDebtSummary } from './SupplierDebtSummary';

type DebtTab = 'customer' | 'supplier';

export function DebtsPage() {
  const [tab, setTab] = useState<DebtTab>('customer');

  return (
    <div className="panel-card card-flush">
      {/* Premium Header */}
      <div className="card-header-area card-header-premium">
        <div>
          <p className="eyebrow-premium">TÀI CHÍNH</p>
          <h3 className="title-premium">Quản Lý Công Nợ</h3>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="p-4 border-b border-border">
        <div className="inline-flex gap-1 bg-surface-subtle p-1 rounded-lg">
          <button
            type="button"
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === 'customer'
                ? 'bg-surface-strong shadow-sm text-primary'
                : 'text-muted'
            }`}
            onClick={() => setTab('customer')}
          >
            <Icon name="Users" size={15} />
            Công nợ Khách hàng
          </button>
          <button
            type="button"
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === 'supplier'
                ? 'bg-surface-strong shadow-sm text-primary'
                : 'text-muted'
            }`}
            onClick={() => setTab('supplier')}
          >
            <Icon name="Building2" size={15} />
            Công nợ Nhà cung cấp
          </button>
        </div>
      </div>

      {/* Content */}
      <div>
        {tab === 'customer' ? <DebtSummary /> : <SupplierDebtSummary />}
      </div>
    </div>
  );
}
