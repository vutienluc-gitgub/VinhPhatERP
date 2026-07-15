import type { OverdueOrderRow } from '@/api/reports.api';
import {
  KpiCard,
  KpiGrid,
  DataTable,
  type DataTableColumn,
} from '@/shared/components';
import { MoneyText } from '@/shared/value';
import { sumBy } from '@/shared/utils/array.util';

import { REPORT_LABELS } from './reports.constants';

type OverdueSectionProps = {
  data: OverdueOrderRow[];
  isLoading: boolean;
};

export function OverdueSection({ data, isLoading }: OverdueSectionProps) {
  const severeCount = data.filter((r) => r.days_overdue > 7).length;
  const totalBalance = sumBy(data, (r) => r.balance_due);

  const columns: DataTableColumn<OverdueOrderRow>[] = [
    {
      header: REPORT_LABELS.COL_ORDER,
      cell: (r) => <span className="font-bold">{r.order_number}</span>,
    },
    {
      header: REPORT_LABELS.COL_CUSTOMER,
      cell: (r) => r.customer_name,
      className: 'max-sm:hidden text-muted text-sm',
    },
    {
      header: REPORT_LABELS.COL_DELIVERY_DATE,
      cell: (r) => r.delivery_date,
      className: 'text-muted text-sm',
    },
    {
      header: REPORT_LABELS.COL_LATE,
      cell: (r) => (
        <span
          className={
            r.days_overdue > 7
              ? 'text-danger font-bold'
              : 'text-warning font-medium'
          }
        >
          {r.days_overdue} {REPORT_LABELS.DAYS}
        </span>
      ),
      className: 'text-right',
    },
    {
      header: REPORT_LABELS.COL_TOTAL_AMOUNT,
      cell: (r) => (
        <>
          <MoneyText value={r.total_amount} />đ
        </>
      ),
      className: 'text-right max-sm:hidden text-muted text-sm',
    },
    {
      header: REPORT_LABELS.COL_BALANCE_DUE,
      cell: (r) => (
        <>
          <MoneyText value={r.balance_due} />đ
        </>
      ),
      className: 'text-right font-bold text-danger',
    },
  ];

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area">
        <span className="font-bold text-lg">
          {REPORT_LABELS.OVERDUE_SECTION_TITLE}
        </span>
      </div>

      <KpiGrid className="px-5 py-4">
        <KpiCard
          label={REPORT_LABELS.OVERDUE_TOTAL_ORDERS}
          value={data.length}
          icon="AlertTriangle"
          variant={data.length > 0 ? 'danger' : 'success'}
          isLoading={isLoading}
        />
        <KpiCard
          label={REPORT_LABELS.OVERDUE_SEVERE}
          value={severeCount}
          icon="Clock"
          variant={severeCount > 0 ? 'danger' : 'success'}
          isLoading={isLoading}
        />
        <KpiCard
          label={REPORT_LABELS.OVERDUE_TOTAL_DEBT}
          value={totalBalance}
          formatMode="currency"
          icon="Wallet"
          variant="warning"
          isLoading={isLoading}
        />
      </KpiGrid>

      <DataTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        rowKey={(r) => r.order_id}
        emptyStateTitle={REPORT_LABELS.OVERDUE_EMPTY_TITLE}
        emptyStateDescription={REPORT_LABELS.OVERDUE_EMPTY_DESC}
        emptyStateIcon="PartyPopper"
        renderMobileCard={(r) => (
          <div
            className={`mobile-card ${r.days_overdue > 7 ? 'border-l-danger' : 'border-l-warning'}`}
          >
            <div className="flex justify-between items-start">
              <span className="font-bold">{r.order_number}</span>
              <span
                className={
                  r.days_overdue > 7 ? 'text-danger font-bold' : 'text-warning'
                }
              >
                {r.days_overdue} {REPORT_LABELS.DAYS}
              </span>
            </div>
            <div className="text-xs text-muted mb-2">{r.customer_name}</div>
            <div className="flex justify-between items-center border-t pt-2 mt-2">
              <span className="text-[10px] text-muted uppercase">
                {REPORT_LABELS.DEBT_LABEL}
              </span>
              <span className="font-bold text-danger">
                <MoneyText value={r.balance_due} />đ
              </span>
            </div>
          </div>
        )}
      />
    </div>
  );
}
