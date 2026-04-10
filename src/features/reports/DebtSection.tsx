import type { DebtByCustomerRow } from '@/api/reports.api';
import {
  KpiCardPremium,
  KpiGridPremium,
  DataTablePremium,
  type DataTableColumn,
} from '@/shared/components';
import { formatCurrency } from '@/shared/utils/format';

type DebtSectionProps = {
  data: DebtByCustomerRow[];
  isLoading: boolean;
};

export function DebtSection({ data, isLoading }: DebtSectionProps) {
  const totalDebt = data.reduce((sum, r) => sum + r.balance_due, 0);
  const totalAmount = data.reduce((sum, r) => sum + r.total_amount, 0);
  const totalPaid = data.reduce((sum, r) => sum + r.paid_amount, 0);
  const customerCount = data.length;

  const columns: DataTableColumn<DebtByCustomerRow>[] = [
    {
      header: 'Khách hàng',
      cell: (r) => <span className="font-bold">{r.customer_name}</span>,
      footer: `Tổng (${customerCount})`,
    },
    {
      header: 'Mã KH',
      cell: (r) => r.customer_code || '—',
      className: 'hide-mobile td-muted',
    },
    {
      header: 'Số đơn',
      cell: (r) => r.total_orders,
      className: 'text-right hide-mobile',
    },
    {
      header: 'Tổng tiền',
      cell: (r) => formatCurrency(r.total_amount),
      footer: formatCurrency(totalAmount),
      className: 'text-right hide-mobile font-medium',
    },
    {
      header: 'Đã thu',
      cell: (r) => formatCurrency(r.paid_amount),
      footer: formatCurrency(totalPaid),
      className: 'text-right hide-mobile text-success',
    },
    {
      header: 'Còn nợ',
      cell: (r) => formatCurrency(r.balance_due),
      footer: formatCurrency(totalDebt),
      className: 'text-right font-bold text-danger',
    },
  ];

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area card-header-premium">
        <div>
          <p className="eyebrow-premium">CÔNG NỢ</p>
          <h3 className="title-premium">Dư nợ khách hàng</h3>
        </div>
      </div>

      <KpiGridPremium className="px-5 py-4">
        <KpiCardPremium
          label="Tổng công nợ"
          value={`${formatCurrency(totalDebt)} đ`}
          icon="Wallet"
          variant={totalDebt > 0 ? 'danger' : 'success'}
          isLoading={isLoading}
        />
        <KpiCardPremium
          label="Khách còn nợ"
          value={customerCount}
          icon="Users"
          variant="warning"
          isLoading={isLoading}
        />
      </KpiGridPremium>

      <DataTablePremium
        data={data}
        columns={columns}
        isLoading={isLoading}
        rowKey={(r) => r.customer_id}
        renderMobileCard={(r) => (
          <div className="mobile-card">
            <div className="flex justify-between items-start">
              <span className="font-bold">{r.customer_name}</span>
              <span className="badge badge-error">
                {formatCurrency(r.balance_due)}
              </span>
            </div>
            <div className="text-sm text-muted mb-2">
              {r.customer_code || '—'}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs border-t pt-2">
              <div>
                <p className="opacity-70">Tổng tiền</p>
                <p className="font-medium">{formatCurrency(r.total_amount)}</p>
              </div>
              <div className="text-right">
                <p className="opacity-70">Số đơn</p>
                <p className="font-medium">{r.total_orders}</p>
              </div>
            </div>
          </div>
        )}
      />
    </div>
  );
}
