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
      header: 'Đơn hàng',
      cell: (r) => <span className="font-bold">{r.order_number}</span>,
      footer: 'Tổng cộng',
    },
    {
      header: 'Khách hàng',
      cell: (r) => r.customer_name,
      className: 'hide-mobile td-muted',
    },
    {
      header: 'Ngày đặt',
      cell: (r) => r.order_date,
      className: 'td-muted',
    },
    {
      header: 'Tổng tiền',
      cell: (r) => <MoneyText value={r.total_amount} />,
      footer: <MoneyText value={totalRevenue} />,
      className: 'text-right font-medium',
    },
    {
      header: 'Đã thu',
      cell: (r) => <MoneyText value={r.paid_amount} />,
      footer: <MoneyText value={totalPaid} />,
      className: 'text-right text-success',
    },
    {
      header: 'Còn nợ',
      cell: (r) => <MoneyText value={r.balance_due} />,
      footer: <MoneyText value={totalBalance} />,
      className: 'text-right font-bold text-warning',
    },
  ];

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area">
        <span className="font-bold text-lg">Phân tích dòng tiền</span>
      </div>

      <KpiGrid className="px-5 py-4">
        <KpiCard
          label="Tổng doanh thu"
          value={totalRevenue}
          formatMode="currency"
          icon="TrendingUp"
          variant="primary"
          isLoading={isLoading}
        />
        <KpiCard
          label="Đã thu"
          value={totalPaid}
          formatMode="currency"
          icon="CheckCircle"
          variant="success"
          isLoading={isLoading}
        />
        <KpiCard
          label="Còn nợ"
          value={totalBalance}
          formatMode="currency"
          icon="Wallet"
          variant={totalBalance > 0 ? 'warning' : 'success'}
          isLoading={isLoading}
        />
        <KpiCard
          label="Số đơn hàng"
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
                <p className="opacity-70">Tổng tiền</p>
                <p className="font-bold">
                  <MoneyText value={r.total_amount} />đ
                </p>
              </div>
              <div className="text-right">
                <p className="opacity-70">Còn nợ</p>
                <p className="font-bold text-warning">
                  <MoneyText value={r.balance_due} />đ
                </p>
              </div>
            </div>
          </div>
        )}
      />
    </div>
  );
}
