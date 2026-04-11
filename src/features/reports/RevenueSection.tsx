import type { RevenueRow } from '@/api/reports.api';
import {
  KpiCardPremium,
  KpiGridPremium,
  DataTablePremium,
  type DataTableColumn,
} from '@/shared/components';
import { formatCurrency } from '@/shared/utils/format';

type RevenueSectionProps = {
  data: RevenueRow[];
  isLoading: boolean;
};

export function RevenueSection({ data, isLoading }: RevenueSectionProps) {
  const totalRevenue = data.reduce((sum, r) => sum + r.total_amount, 0);
  const totalPaid = data.reduce((sum, r) => sum + r.paid_amount, 0);
  const totalBalance = data.reduce((sum, r) => sum + r.balance_due, 0);

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
      cell: (r) => `${formatCurrency(r.total_amount)}đ`,
      footer: `${formatCurrency(totalRevenue)}đ`,
      className: 'text-right font-medium',
    },
    {
      header: 'Đã thu',
      cell: (r) => `${formatCurrency(r.paid_amount)}đ`,
      footer: `${formatCurrency(totalPaid)}đ`,
      className: 'text-right text-success',
    },
    {
      header: 'Còn nợ',
      cell: (r) => `${formatCurrency(r.balance_due)}đ`,
      footer: `${formatCurrency(totalBalance)}đ`,
      className: 'text-right font-bold text-warning',
    },
  ];

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area card-header-premium">
        <div>
          <p className="eyebrow-premium">DOANH THU</p>
          <h3 className="title-premium">Phân tích dòng tiền</h3>
        </div>
      </div>

      <KpiGridPremium className="px-5 py-4">
        <KpiCardPremium
          label="Tổng doanh thu"
          value={`${formatCurrency(totalRevenue)} đ`}
          icon="TrendingUp"
          variant="primary"
          isLoading={isLoading}
        />
        <KpiCardPremium
          label="Đã thu"
          value={`${formatCurrency(totalPaid)} đ`}
          icon="CheckCircle"
          variant="success"
          isLoading={isLoading}
        />
        <KpiCardPremium
          label="Còn nợ"
          value={`${formatCurrency(totalBalance)} đ`}
          icon="Wallet"
          variant={totalBalance > 0 ? 'warning' : 'success'}
          isLoading={isLoading}
        />
        <KpiCardPremium
          label="Số đơn hàng"
          value={data.length}
          icon="Package"
          variant="secondary"
          isLoading={isLoading}
        />
      </KpiGridPremium>

      <DataTablePremium
        data={data}
        columns={columns}
        isLoading={isLoading}
        rowKey={(r) => r.id}
        renderMobileCard={(r) => (
          <div className="mobile-card">
            <div className="flex justify-between items-start">
              <span className="font-bold">{r.order_number}</span>
              <span className="badge badge-info">{r.order_date}</span>
            </div>
            <div className="text-sm text-muted mb-2">{r.customer_name}</div>
            <div className="grid grid-cols-2 gap-2 text-xs border-t pt-2">
              <div>
                <p className="opacity-70">Tổng tiền</p>
                <p className="font-bold">{formatCurrency(r.total_amount)}đ</p>
              </div>
              <div className="text-right">
                <p className="opacity-70">Còn nợ</p>
                <p className="font-bold text-warning">
                  {formatCurrency(r.balance_due)}đ
                </p>
              </div>
            </div>
          </div>
        )}
      />
    </div>
  );
}
