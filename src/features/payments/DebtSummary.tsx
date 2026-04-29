import { formatCurrency } from '@/shared/utils/format';
import { useDebtSummary } from '@/application/payments';

import { DEBT_LABELS } from './payments.constants';
import {
  DebtTablePanel,
  DebtMobileCard,
  DebtRiskBadge,
} from './components/DebtTablePanel';
import type { DebtSummaryRow } from './types';

const L = DEBT_LABELS.customer;

export function DebtSummary() {
  const { data: debts = [], isLoading, error } = useDebtSummary();

  return (
    <DebtTablePanel<DebtSummaryRow>
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
      rowKey={(d) => d.customer_id}
      columns={[
        {
          header: 'Khách hàng',
          id: 'customer_name',
          sortable: true,
          accessor: (d) => d.customer_name,
          cell: (d) => (
            <div className="flex flex-col">
              <span className="font-bold">{d.customer_name}</span>
              {d.customer_code && (
                <span className="text-xs text-muted">{d.customer_code}</span>
              )}
              <DebtRiskBadge
                balanceDue={d.balance_due}
                oldestOverdueDays={d.oldest_overdue_days}
                creditLimit={d.credit_limit}
              />
            </div>
          ),
        },
        {
          header: 'Số đơn',
          id: 'order_count',
          sortable: true,
          className: 'text-right',
          cell: (d) => <span className="font-medium">{d.order_count}</span>,
        },
        {
          header: L.totalLabel,
          id: 'total_ordered',
          sortable: true,
          className: 'text-right',
          cell: (d) => (
            <span className="font-medium">
              {formatCurrency(d.total_ordered)}đ
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
          name={d.customer_name}
          code={d.customer_code}
          balanceDue={d.balance_due}
          totalAmount={d.total_ordered}
          totalPaid={d.total_paid}
          countValue={d.order_count}
          countUnit={L.docUnit}
          totalLabel={L.totalLabel}
          paidLabel={L.paidLabel}
          countLabel="Số đơn"
          progressLabel={L.progressLabel}
        />
      )}
    />
  );
}
