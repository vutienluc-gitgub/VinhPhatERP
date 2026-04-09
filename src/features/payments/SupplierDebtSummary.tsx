import { Icon, DataTablePremium } from '@/shared/components';

import { useSupplierDebt } from './useCashFlow';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value);
}

export function SupplierDebtSummary() {
  const { data: debts = [], isLoading, error } = useSupplierDebt();

  const totalDebt = debts.reduce((sum, d) => sum + d.balance_due, 0);
  const overdueCount = debts.filter((d) => d.balance_due > 0).length;

  if (error) {
    return (
      <div className="p-4">
        <p className="error-inline">Lỗi: {(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div>
      {/* KPI Summary */}
      {debts.length > 0 && (
        <div className="kpi-grid p-4 md:p-6 bg-surface-subtle border-b border-border">
          <div className="kpi-card-premium kpi-danger">
            <div className="kpi-overlay" />
            <div className="kpi-content">
              <div className="kpi-info">
                <p className="kpi-label">Tổng phải trả nhà cung cấp</p>
                <p className="kpi-value">{formatCurrency(totalDebt)}đ</p>
              </div>
              <div className="kpi-icon-box">
                <Icon name="TrendingDown" size={32} />
              </div>
            </div>
            <div className="kpi-footer text-xs opacity-80 italic">
              Cần thanh toán cho {overdueCount} nhà cung cấp
            </div>
          </div>

          <div className="kpi-card-premium kpi-warning">
            <div className="kpi-overlay" />
            <div className="kpi-content">
              <div className="kpi-info">
                <p className="kpi-label">Nhà cung cấp chờ thanh toán</p>
                <p className="kpi-value">{overdueCount}</p>
              </div>
              <div className="kpi-icon-box">
                <Icon name="Building2" size={32} />
              </div>
            </div>
            <div className="kpi-footer text-xs opacity-80 italic">
              Ưu tiên thanh toán sớm để duy trì quan hệ
            </div>
          </div>
        </div>
      )}

      {/* Table & Cards */}
      <DataTablePremium
        data={debts}
        isLoading={isLoading}
        rowKey={(d) => d.supplier_id}
        emptyStateTitle="Không có công nợ nhà cung cấp"
        emptyStateDescription="Tất cả phiếu nhập đã được thanh toán đầy đủ."
        emptyStateIcon="CheckCircle"
        columns={[
          {
            header: 'Nhà cung cấp',
            cell: (d) => (
              <div className="flex flex-col">
                <span className="font-bold">{d.supplier_name}</span>
                {d.supplier_code && (
                  <span className="text-xs text-muted">{d.supplier_code}</span>
                )}
              </div>
            ),
          },
          {
            header: 'Số phiếu',
            className: 'text-right',
            cell: (d) => (
              <span className="font-medium">{d.document_count}</span>
            ),
          },
          {
            header: 'Tổng mua',
            className: 'text-right',
            cell: (d) => (
              <span className="font-medium">
                {formatCurrency(d.total_purchased)}đ
              </span>
            ),
          },
          {
            header: 'Đã trả',
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
            d.total_purchased > 0
              ? Math.round((d.total_paid / d.total_purchased) * 100)
              : 0;

          return (
            <div className="mobile-card">
              <div className="mobile-card-header">
                <div className="flex flex-col">
                  <span className="mobile-card-title">{d.supplier_name}</span>
                  {d.supplier_code && (
                    <span className="text-xs text-muted">
                      {d.supplier_code}
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
                    <span className="text-xs text-muted">Tổng mua</span>
                    <span className="font-medium">
                      {formatCurrency(d.total_purchased)}đ
                    </span>
                  </div>
                  <div className="flex flex-col text-center">
                    <span className="text-xs text-muted">Đã trả</span>
                    <span className="font-medium text-success">
                      {formatCurrency(d.total_paid)}đ
                    </span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-xs text-muted">Số phiếu</span>
                    <span className="font-medium">
                      {d.document_count} phiếu
                    </span>
                  </div>
                </div>
                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs text-muted mb-1">
                    <span>Tiến độ thanh toán</span>
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
  );
}
