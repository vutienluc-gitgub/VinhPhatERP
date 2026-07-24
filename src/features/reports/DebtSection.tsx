import type { DebtByCustomerRow } from '@/api/reports.api';
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

type DebtSectionProps = {
  data: DebtByCustomerRow[];
  isLoading: boolean;
};

export function DebtSection({ data, isLoading }: DebtSectionProps) {
  const totalDebt = sumBy(data, (r) => r.balance_due);
  const totalAmount = sumBy(data, (r) => r.total_amount);
  const totalPaid = sumBy(data, (r) => r.paid_amount);
  const customerCount = data.length;

  const columns: DataTableColumn<DebtByCustomerRow>[] = [
    {
      header: REPORT_LABELS.COL_CUSTOMER,
      cell: (r) => <span className="font-bold">{r.customer_name}</span>,
      footer: `${REPORT_LABELS.TOTAL} (${customerCount})`,
    },
    {
      header: REPORT_LABELS.COL_CUSTOMER_CODE,
      cell: (r) => r.customer_code || '—',
      className: 'max-sm:hidden text-muted text-sm',
    },
    {
      header: REPORT_LABELS.COL_TOTAL_ORDERS,
      cell: (r) => r.total_orders,
      className: 'text-right max-sm:hidden',
    },
    {
      header: REPORT_LABELS.COL_TOTAL_AMOUNT,
      cell: (r) => <MoneyText value={r.total_amount} />,
      footer: <MoneyText value={totalAmount} />,
      className: 'text-right max-sm:hidden font-medium',
    },
    {
      header: REPORT_LABELS.COL_PAID_AMOUNT,
      cell: (r) => <MoneyText value={r.paid_amount} />,
      footer: <MoneyText value={totalPaid} />,
      className: 'text-right max-sm:hidden text-success',
    },
    {
      header: REPORT_LABELS.COL_BALANCE_DUE,
      cell: (r) => <MoneyText value={r.balance_due} />,
      footer: <MoneyText value={totalDebt} />,
      className: 'text-right font-bold text-danger',
    },
  ];

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area">
        <span className="font-bold text-lg">
          {REPORT_LABELS.DEBT_SECTION_TITLE}
        </span>
      </div>

      <KpiGrid className="px-5 py-4">
        <KpiCard
          label={REPORT_LABELS.TOTAL_DEBT}
          value={totalDebt}
          formatMode="currency"
          icon="Wallet"
          variant={totalDebt > 0 ? 'danger' : 'success'}
          isLoading={isLoading}
        />
        <KpiCard
          label={REPORT_LABELS.CUSTOMER_OWE}
          value={customerCount}
          icon="Users"
          variant="warning"
          isLoading={isLoading}
        />
      </KpiGrid>

      <DataTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        rowKey={(r) => r.customer_id}
        renderMobileCard={(r) => (
          <div className="mobile-card">
            <div className="flex justify-between items-start">
              <span className="font-bold">{r.customer_name}</span>
              <Badge variant="danger">
                <MoneyText value={r.balance_due} />
              </Badge>
            </div>
            <div className="text-sm text-muted mb-2">
              {r.customer_code || '—'}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs border-t pt-2">
              <div>
                <p className="opacity-70">{REPORT_LABELS.COL_TOTAL_AMOUNT}</p>
                <p className="font-medium">
                  <MoneyText value={r.total_amount} />
                </p>
              </div>
              <div className="text-right">
                <p className="opacity-70">{REPORT_LABELS.COL_TOTAL_ORDERS}</p>
                <p className="font-medium">{r.total_orders}</p>
              </div>
            </div>
          </div>
        )}
      />
    </div>
  );
}
