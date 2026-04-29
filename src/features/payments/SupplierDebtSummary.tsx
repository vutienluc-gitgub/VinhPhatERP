import { formatCurrency } from '@/shared/utils/format';
import { useSupplierDebt } from '@/application/payments';

import { DEBT_LABELS } from './payments.constants';
import {
  DebtTablePanel,
  DebtMobileCard,
  DebtRiskBadge,
} from './components/DebtTablePanel';
import type { SupplierDebtRow } from './types';

const L = DEBT_LABELS.supplier;

export function SupplierDebtSummary() {
  const { data: debts = [], isLoading, error } = useSupplierDebt();

  return (
    <DebtTablePanel<SupplierDebtRow>
      data={debts}
      isLoading={isLoading}
      error={error}
      kpiTitle={L.kpiTitle}
      kpiFooter={L.kpiFooter}
      kpiIcon={L.kpiIcon}
      countLabel={L.countLabel}
      countIcon={L.countIcon}
      countFooter={L.countFooter}
      emptyTitle={L.emptyTitle}
      emptyDescription={L.emptyDescription}
      rowKey={(d) => d.supplier_id}
      columns={[
        {
          header: 'Nhà cung cấp',
          id: 'supplier_name',
          sortable: true,
          accessor: (d) => d.supplier_name,
          cell: (d) => (
            <div className="flex flex-col">
              <span className="font-bold">{d.supplier_name}</span>
              {d.supplier_code && (
                <span className="text-xs text-muted">{d.supplier_code}</span>
              )}
              <DebtRiskBadge balanceDue={d.balance_due} />
            </div>
          ),
        },
        {
          header: 'Số phiếu',
          id: 'document_count',
          sortable: true,
          className: 'text-right',
          cell: (d) => <span className="font-medium">{d.document_count}</span>,
        },
        {
          header: L.totalLabel,
          id: 'total_purchased',
          sortable: true,
          className: 'text-right',
          cell: (d) => (
            <span className="font-medium">
              {formatCurrency(d.total_purchased)}đ
            </span>
          ),
        },
        {
          header: L.paidLabel,
          id: 'total_paid',
          sortable: true,
          className: 'text-right',
          cell: (d) => (
            <span className="font-medium text-success">
              {formatCurrency(d.total_paid)}đ
            </span>
          ),
        },
        {
          header: 'Còn nợ',
          id: 'balance_due',
          sortable: true,
          className: 'text-right',
          cell: (d) => (
            <span className="font-bold text-danger">
              {formatCurrency(d.balance_due)}đ
            </span>
          ),
        },
      ]}
      renderMobileCard={(d) => (
        <DebtMobileCard
          name={d.supplier_name}
          code={d.supplier_code}
          balanceDue={d.balance_due}
          totalAmount={d.total_purchased}
          totalPaid={d.total_paid}
          countValue={d.document_count}
          countUnit={L.docUnit}
          totalLabel={L.totalLabel}
          paidLabel={L.paidLabel}
          countLabel="Số phiếu"
          progressLabel={L.progressLabel}
        />
      )}
    />
  );
}
