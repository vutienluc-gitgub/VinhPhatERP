import type {
  MonthlyRevenueRow,
  RevenueByFabricRow,
  PaymentCollectionRow,
} from '@/api/reports.api';
import {
  KpiCardPremium,
  KpiGridPremium,
  DataTablePremium,
  MiniBarChart,
  type DataTableColumn,
} from '@/shared/components';
import { formatCurrency } from '@/shared/utils/format';

type RevenueTrendSectionProps = {
  monthlyData: MonthlyRevenueRow[];
  fabricData: RevenueByFabricRow[];
  paymentData: PaymentCollectionRow[];
  isLoading: boolean;
};

function formatShortCurrency(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}T`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}Tr`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

function computeGrowth(
  data: MonthlyRevenueRow[],
): { pct: number; label: string } | null {
  if (data.length < 2) return null;
  const current = data[0]!.total_revenue;
  const previous = data[1]!.total_revenue;
  if (previous === 0) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  return {
    pct,
    label: pct >= 0 ? `+${pct}%` : `${pct}%`,
  };
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  bank_transfer: 'Chuyển khoản',
  cash: 'Tiền mặt',
  card: 'Quẹt thẻ',
  debt: 'Ghi nợ',
};

export function RevenueTrendSection({
  monthlyData,
  fabricData,
  paymentData,
  isLoading,
}: RevenueTrendSectionProps) {
  const totalRevenue = monthlyData.reduce((s, r) => s + r.total_revenue, 0);
  const totalCollected = monthlyData.reduce((s, r) => s + r.total_collected, 0);
  const collectionRate =
    totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 0;
  const growth = computeGrowth(monthlyData);

  // Aggregate payment by method
  const methodMap = new Map<string, number>();
  for (const row of paymentData) {
    methodMap.set(
      row.payment_method,
      (methodMap.get(row.payment_method) ?? 0) + row.total_collected,
    );
  }
  const paymentMethods = Array.from(methodMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([method, total]) => ({
      label: PAYMENT_METHOD_LABELS[method.toLowerCase()] ?? method,
      value: total,
    }));

  const maxMonthlyRevenue =
    monthlyData.length > 0
      ? Math.max(...monthlyData.map((r) => r.total_revenue))
      : 0;
  const maxFabricRevenue =
    fabricData.length > 0
      ? Math.max(...fabricData.map((r) => r.total_revenue))
      : 0;

  const paymentColumns: DataTableColumn<{ label: string; value: number }>[] = [
    {
      header: 'Phương thức',
      cell: (m) => <span className="font-bold">{m.label}</span>,
    },
    {
      header: 'Số tiền thu',
      cell: (m) => `${formatCurrency(m.value)} đ`,
      className: 'text-right font-medium',
    },
    {
      header: 'Tỷ lệ',
      cell: (m) => (
        <span className="px-2 py-0.5 bg-surface-subtle border border-border rounded text-[10px] font-bold">
          {totalCollected > 0
            ? Math.round((m.value / totalCollected) * 100)
            : 0}
          %
        </span>
      ),
      className: 'text-right',
    },
  ];

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area card-header-premium">
        <div>
          <p className="eyebrow-premium">XU HƯỚNG</p>
          <h3 className="title-premium">Doanh thu & Thu tiền</h3>
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
          value={`${formatCurrency(totalCollected)} đ`}
          icon="CheckCircle"
          variant="success"
          footer={`${collectionRate}% tỷ lệ thu hồi`}
          isLoading={isLoading}
        />
        {growth && (
          <KpiCardPremium
            label="Tăng trưởng"
            value={growth.label}
            icon={growth.pct >= 0 ? 'ArrowUpCircle' : 'ArrowDownCircle'}
            variant={growth.pct >= 0 ? 'success' : 'danger'}
            isLoading={isLoading}
          />
        )}
        <KpiCardPremium
          label="Phải thu"
          value={`${formatCurrency(totalRevenue - totalCollected)} đ`}
          icon="Clock"
          variant="warning"
          isLoading={isLoading}
        />
      </KpiGridPremium>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-5">
        <div className="card-sub-section">
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-4 border-b pb-1">
            Doanh thu theo tháng
          </p>
          <MiniBarChart
            maxValue={maxMonthlyRevenue}
            valueFormatter={formatShortCurrency}
            data={[...monthlyData].reverse().map((r) => ({
              label: r.month,
              value: r.total_revenue,
              color: 'var(--primary)',
            }))}
          />
        </div>

        {fabricData.length > 0 && (
          <div className="card-sub-section">
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-4 border-b pb-1">
              Cơ cấu loại vải (Top 10)
            </p>
            <MiniBarChart
              maxValue={maxFabricRevenue}
              valueFormatter={formatShortCurrency}
              data={fabricData.slice(0, 10).map((r) => ({
                label: `${r.fabric_type}${r.color_name ? ` (${r.color_name})` : ''}`,
                value: r.total_revenue,
                color: 'var(--accent)',
              }))}
            />
          </div>
        )}
      </div>

      {paymentMethods.length > 0 && (
        <div className="mt-4">
          <div className="px-5 py-2 bg-surface-subtle border-y border-border">
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
              THU TIỀN
            </p>
            <p className="text-xs font-bold">Phân bổ phương thức thanh toán</p>
          </div>
          <DataTablePremium
            data={paymentMethods}
            columns={paymentColumns}
            isLoading={isLoading}
            rowKey={(m) => m.label}
            renderMobileCard={(m) => (
              <div className="mobile-card">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold">{m.label}</span>
                  <span className="font-bold text-success">
                    {formatCurrency(m.value)} đ
                  </span>
                </div>
                <div className="mt-1 text-right text-[10px] text-muted">
                  Chiếm{' '}
                  {totalCollected > 0
                    ? Math.round((m.value / totalCollected) * 100)
                    : 0}
                  % tổng thu
                </div>
              </div>
            )}
          />
        </div>
      )}
    </div>
  );
}
