import type { OverdueOrderRow } from '@/api/reports.api';
import {
  KpiCardPremium,
  KpiGridPremium,
  DataTablePremium,
  type DataTableColumn,
} from '@/shared/components';
import { formatCurrency } from '@/shared/utils/format';
import { sumBy } from '@/shared/utils/array.util';

type OverdueSectionProps = {
  data: OverdueOrderRow[];
  isLoading: boolean;
};

export function OverdueSection({ data, isLoading }: OverdueSectionProps) {
  const severeCount = data.filter((r) => r.days_overdue > 7).length;
  const totalBalance = sumBy(data, (r) => r.balance_due);

  const columns: DataTableColumn<OverdueOrderRow>[] = [
    {
      header: 'Đơn hàng',
      cell: (r) => <span className="font-bold">{r.order_number}</span>,
    },
    {
      header: 'Khách hàng',
      cell: (r) => r.customer_name,
      className: 'hide-mobile td-muted',
    },
    {
      header: 'Hạn giao',
      cell: (r) => r.delivery_date,
      className: 'td-muted',
    },
    {
      header: 'Trễ',
      cell: (r) => (
        <span
          className={
            r.days_overdue > 7
              ? 'text-danger font-bold'
              : 'text-warning font-medium'
          }
        >
          {r.days_overdue} ngày
        </span>
      ),
      className: 'text-right',
    },
    {
      header: 'Tổng tiền',
      cell: (r) => `${formatCurrency(r.total_amount)}đ`,
      className: 'text-right hide-mobile td-muted',
    },
    {
      header: 'Còn nợ',
      cell: (r) => `${formatCurrency(r.balance_due)}đ`,
      className: 'text-right font-bold text-danger',
    },
  ];

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area card-header-premium">
        <div>
          <p className="eyebrow-premium">GIAO HÀNG</p>
          <h3 className="title-premium">Đơn hàng trễ hạn</h3>
        </div>
      </div>

      <KpiGridPremium className="px-5 py-4">
        <KpiCardPremium
          label="Tổng đơn trễ"
          value={data.length}
          icon="AlertTriangle"
          variant={data.length > 0 ? 'danger' : 'success'}
          isLoading={isLoading}
        />
        <KpiCardPremium
          label="Trễ > 7 ngày"
          value={severeCount}
          icon="Clock"
          variant={severeCount > 0 ? 'danger' : 'success'}
          isLoading={isLoading}
        />
        <KpiCardPremium
          label="Tổng nợ trễ"
          value={`${formatCurrency(totalBalance)} đ`}
          icon="Wallet"
          variant="warning"
          isLoading={isLoading}
        />
      </KpiGridPremium>

      <DataTablePremium
        data={data}
        columns={columns}
        isLoading={isLoading}
        rowKey={(r) => r.order_id}
        emptyStateTitle="Tuyệt vời! Không có đơn trễ hạn."
        emptyStateDescription="Tất cả các đơn hàng đều đang trong tiến độ giao hàng đúng hạn."
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
                {r.days_overdue} ngày
              </span>
            </div>
            <div className="text-xs text-muted mb-2">{r.customer_name}</div>
            <div className="flex justify-between items-center border-t pt-2 mt-2">
              <span className="text-[10px] text-muted uppercase">Nợ:</span>
              <span className="font-bold text-danger">
                {formatCurrency(r.balance_due)}đ
              </span>
            </div>
          </div>
        )}
      />
    </div>
  );
}
