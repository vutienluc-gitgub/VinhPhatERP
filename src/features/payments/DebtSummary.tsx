import { Icon, DataTablePremium } from '@/shared/components';
import { formatCurrency } from '@/shared/utils/format';
import {
  calculateTotalDebt,
  countOverdueDebts,
  isDebtRisky,
} from '@/domain/payments';

import { useDebtSummary } from './usePayments';

export function DebtSummary() {
  const { data: debts = [], isLoading, error } = useDebtSummary();

  const totalDebt = calculateTotalDebt(debts);
  const overdueCount = countOverdueDebts(debts);

  if (error) {
    return (
      <div className="p-4">
        <p className="error-inline">Lỗi: {(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="panel-card card-flush">
      {/* KPI Summary */}
      {debts.length > 0 && (
        <div className="kpi-grid p-4 md:p-6 bg-surface-subtle border-b border-border">
          <div className="kpi-card-premium kpi-danger">
            <div className="kpi-overlay" />
            <div className="kpi-content">
              <div className="kpi-info">
                <p className="kpi-label">Tổng công nợ phải thu</p>
                <p className="kpi-value">
                  {formatCurrency(totalDebt)}
                  <span className="text-xs font-normal ml-1">đ</span>
                </p>
              </div>
              <div className="kpi-icon-box">
                <Icon name="TrendingUp" size={32} />
              </div>
            </div>
            <div className="kpi-footer text-xs opacity-80 italic">
              Từ {overdueCount} khách hàng còn nợ
            </div>
          </div>

          <div className="kpi-card-premium kpi-warning">
            <div className="kpi-overlay" />
            <div className="kpi-content">
              <div className="kpi-info">
                <p className="kpi-label">Số khách hàng đang nợ</p>
                <p className="kpi-value">{overdueCount}</p>
              </div>
              <div className="kpi-icon-box">
                <Icon name="Users" size={32} />
              </div>
            </div>
            <div className="kpi-footer text-xs opacity-80 italic">
              Cần theo dõi và đôn đốc thu hồi
            </div>
          </div>
        </div>
      )}

      {/* Table & Cards */}
      <div className="card-table-section">
        <DataTablePremium
          data={debts}
          isLoading={isLoading}
          rowKey={(d) => d.customer_id}
          emptyStateTitle="Không có công nợ khách hàng"
          emptyStateDescription="Tất cả đơn hàng đã được thanh toán đầy đủ."
          emptyStateIcon="CheckCircle"
          columns={[
            {
              header: 'Khách hàng',
              cell: (d) => (
                <div className="flex flex-col">
                  <span className="font-bold">{d.customer_name}</span>
                  {d.customer_code && (
                    <span className="text-xs text-muted">
                      {d.customer_code}
                    </span>
                  )}
                  {isDebtRisky(d.balance_due) && (
                    <span className="text-xs text-danger border border-danger/30 rounded px-1 mt-1">
                      Nợ rủi ro
                    </span>
                  )}
                </div>
              ),
            },
            {
              header: 'Số đơn',
              className: 'text-right',
              cell: (d) => <span className="font-medium">{d.order_count}</span>,
            },
            {
              header: 'Tổng đặt',
              className: 'text-right',
              cell: (d) => (
                <span className="font-medium">
                  {formatCurrency(d.total_ordered)}đ
                </span>
              ),
            },
            {
              header: 'Đã thu',
              className: 'text-right',
              cell: (d) => (
                <span className="font-medium text-success">
                  {formatCurrency(d.total_paid)}đ
                </span>
              ),
            },
            {
              header: 'Còn nợ',
              className: 'text-right',
              cell: (d) => (
                <span className="font-bold text-danger">
                  {formatCurrency(d.balance_due)}đ
                </span>
              ),
            },
          ]}
          renderMobileCard={(d) => {
            const paidPercent =
              d.total_ordered > 0
                ? Math.round((d.total_paid / d.total_ordered) * 100)
                : 0;

            return (
              <div className="mobile-card">
                <div className="mobile-card-header">
                  <div className="flex flex-col">
                    <span className="mobile-card-title">{d.customer_name}</span>
                    {d.customer_code && (
                      <span className="text-xs text-muted">
                        {d.customer_code}
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-danger text-lg">
                    -{formatCurrency(d.balance_due)}đ
                  </span>
                </div>
                <div className="mobile-card-body space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted">Tổng đặt</span>
                      <span className="font-medium">
                        {formatCurrency(d.total_ordered)}đ
                      </span>
                    </div>
                    <div className="flex flex-col text-center">
                      <span className="text-xs text-muted">Đã thu</span>
                      <span className="font-medium text-success">
                        {formatCurrency(d.total_paid)}đ
                      </span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-xs text-muted">Số đơn</span>
                      <span className="font-medium">{d.order_count} đơn</span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-xs text-muted mb-1">
                      <span>Tiến độ thu tiền</span>
                      <span>{paidPercent}%</span>
                    </div>
                    <div className="w-full bg-border rounded-full h-1.5">
                      <div
                        className="bg-success rounded-full h-1.5 transition-all"
                        style={{ width: `${paidPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}
