import type { RevenueRow } from '@/api/reports.api';
import {
  KpiCard,
  KpiGrid,
  DataTable,
  Badge,
  type DataTableColumn,
} from '@/shared/components';
import { MoneyText } from '@/shared/value';
import { sumBy } from '@/shared/utils/array.util';

import { REPORT_LABELS } from './reports.constants';

type RevenueSectionProps = {
  data: RevenueRow[];
  isLoading: boolean;
};

export function RevenueSection({ data, isLoading }: RevenueSectionProps) {
  const totalRevenue = sumBy(data, (r) => r.total_amount);
  const totalPaid = sumBy(data, (r) => r.paid_amount);
  const totalBalance = sumBy(data, (r) => r.balance_due);

  const columns: DataTableColumn<RevenueRow>[] = [
    {
      header: REPORT_LABELS.COL_ORDER,
      cell: (r) => <span className="font-bold">{r.order_number}</span>,
      footer: REPORT_LABELS.TOTAL,
    },
    {
      header: REPORT_LABELS.COL_CUSTOMER,
      cell: (r) => r.customer_name,
      className: 'max-sm:hidden text-muted text-sm',
    },
    {
      header: REPORT_LABELS.COL_ORDER_DATE,
      cell: (r) => r.order_date,
      className: 'text-muted text-sm',
    },
    {
      header: REPORT_LABELS.COL_TOTAL_AMOUNT,
      cell: (r) => <MoneyText value={r.total_amount} />,
      footer: <MoneyText value={totalRevenue} />,
      className: 'text-right font-medium',
    },
    {
      header: REPORT_LABELS.COL_PAID_AMOUNT,
      cell: (r) => <MoneyText value={r.paid_amount} />,
      footer: <MoneyText value={totalPaid} />,
      className: 'text-right text-success',
    },
    {
      header: REPORT_LABELS.COL_BALANCE_DUE,
      cell: (r) => <MoneyText value={r.balance_due} />,
      footer: <MoneyText value={totalBalance} />,
      className: 'text-right font-bold text-warning',
    },
  ];

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area">
        <span className="font-bold text-lg">
          {REPORT_LABELS.REVENUE_SECTION_TITLE}
        </span>
      </div>

      <KpiGrid className="px-5 py-4">
        <KpiCard
          label={REPORT_LABELS.REV_TOTAL}
          value={totalRevenue}
          formatMode="currency"
          icon="TrendingUp"
          variant="primary"
          isLoading={isLoading}
        />
        <KpiCard
          label={REPORT_LABELS.REV_PAID}
          value={totalPaid}
          formatMode="currency"
          icon="CheckCircle"
          variant="success"
          isLoading={isLoading}
        />
        <KpiCard
          label={REPORT_LABELS.REV_BALANCE}
          value={totalBalance}
          formatMode="currency"
          icon="Wallet"
          variant={totalBalance > 0 ? 'warning' : 'success'}
          isLoading={isLoading}
        />
        <KpiCard
          label={REPORT_LABELS.REV_ORDER_COUNT}
          value={data.length}
          icon="Package"
          variant="secondary"
          isLoading={isLoading}
        />
      </KpiGrid>

      <DataTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        rowKey={(r) => r.id}
        renderMobileCard={(r) => (
          <div className="mobile-card">
            <div className="flex justify-between items-start">
              <span className="font-bold">{r.order_number}</span>
              <Badge variant="info">{r.order_date}</Badge>
            </div>
            <div className="text-sm text-muted mb-2">{r.customer_name}</div>
            <div className="grid grid-cols-2 gap-2 text-xs border-t pt-2">
              <div>
                <p className="opacity-70">{REPORT_LABELS.COL_TOTAL_AMOUNT}</p>
                <p className="font-bold">
                  <MoneyText value={r.total_amount} />
                </p>
              </div>
              <div className="text-right">
                <p className="opacity-70">{REPORT_LABELS.COL_BALANCE_DUE}</p>
                <p className="font-bold text-warning">
                  <MoneyText value={r.balance_due} />
                </p>
              </div>
            </div>
          </div>
        )}
      />
    </div>
  );
}
