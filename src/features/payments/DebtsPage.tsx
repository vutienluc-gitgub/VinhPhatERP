import { useState } from 'react';

import { DebtSummary } from './DebtSummary';
import { SupplierDebtSummary } from './SupplierDebtSummary';

type DebtTab = 'customer' | 'supplier';

export function DebtsPage() {
  const [tab, setTab] = useState<DebtTab>('customer');

  return (
    <div className="p-4">
      <div className="page-header mb-6">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Công nợ</h1>
          <p className="text-muted-foreground">
            Theo dõi nợ phải thu của khách hàng và nợ phải trả cho nhà cung cấp.
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6 bg-muted/30 p-1 rounded-lg w-fit">
        <button
          className={`px-4 py-2 rounded-md transition-all ${
            tab === 'customer'
              ? 'bg-background shadow-sm font-medium'
              : 'text-muted-foreground hover:bg-background/50'
          }`}
          onClick={() => setTab('customer')}
        >
          Công nợ Khách hàng
        </button>
        <button
          className={`px-4 py-2 rounded-md transition-all ${
            tab === 'supplier'
              ? 'bg-background shadow-sm font-medium'
              : 'text-muted-foreground hover:bg-background/50'
          }`}
          onClick={() => setTab('supplier')}
        >
          Công nợ Nhà cung cấp
        </button>
      </div>

      <div className="mt-4">
        {tab === 'customer' ? <DebtSummary /> : <SupplierDebtSummary />}
      </div>
    </div>
  );
}
