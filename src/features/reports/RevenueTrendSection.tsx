import type {
  MonthlyRevenueRow,
  RevenueByFabricRow,
  PaymentCollectionRow,
} from '@/api/reports.api';
import { KpiCard, KpiGrid } from '@/shared/components';
import { RevenueBarChart } from '@/features/reports/RevenueBarChart';
import { FabricRevenueChart } from '@/features/reports/FabricRevenueChart';
import { PaymentMethodChart } from '@/features/reports/PaymentMethodChart';
import { sumBy } from '@/shared/utils/array.util';

import { REPORT_LABELS } from './reports.constants';

type RevenueTrendSectionProps = {
  monthlyData: MonthlyRevenueRow[];
  fabricData: RevenueByFabricRow[];
  paymentData: PaymentCollectionRow[];
  isLoading: boolean;
};

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

export function RevenueTrendSection({
  monthlyData,
  fabricData,
  paymentData,
  isLoading,
}: RevenueTrendSectionProps) {
  const totalRevenue = sumBy(monthlyData, (r) => r.total_revenue);
  const totalCollected = sumBy(monthlyData, (r) => r.total_collected);
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
      label:
        REPORT_LABELS.PAYMENT_METHOD_LABELS[method.toLowerCase()] ?? method,
      value: total,
    }));

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area">
        <span className="font-bold text-lg">
          {REPORT_LABELS.TREND_SECTION_TITLE}
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
          value={totalCollected}
          formatMode="currency"
          icon="CheckCircle"
          variant="success"
          footer={`${collectionRate}% ${REPORT_LABELS.TREND_RECOVERY_RATE}`}
          isLoading={isLoading}
        />
        {growth && (
          <KpiCard
            label={REPORT_LABELS.TREND_GROWTH}
            value={growth.label}
            icon={growth.pct >= 0 ? 'ArrowUpCircle' : 'ArrowDownCircle'}
            variant={growth.pct >= 0 ? 'success' : 'danger'}
            isLoading={isLoading}
          />
        )}
        <KpiCard
          label={REPORT_LABELS.TREND_RECEIVABLE}
          value={totalRevenue - totalCollected}
          formatMode="currency"
          icon="Clock"
          variant="warning"
          isLoading={isLoading}
        />
      </KpiGrid>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-5">
        <div className="card-sub-section">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 border-b pb-1">
            {REPORT_LABELS.TREND_MONTHLY_CHART}
          </p>
          <RevenueBarChart data={monthlyData} isLoading={isLoading} />
        </div>

        {fabricData.length > 0 && (
          <div className="card-sub-section">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 border-b pb-1">
              {REPORT_LABELS.TREND_FABRIC_CHART}
            </p>
            <FabricRevenueChart data={fabricData} isLoading={isLoading} />
          </div>
        )}
      </div>

      {paymentMethods.length > 0 && (
        <div className="mt-4">
          <div className="px-5 py-2 bg-surface-subtle border-y border-border">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {REPORT_LABELS.TREND_COLLECTION_EYEBROW}
            </p>
            <p className="text-xs font-bold">
              {REPORT_LABELS.TREND_COLLECTION_TITLE}
            </p>
          </div>
          <div className="px-5 py-4">
            <PaymentMethodChart data={paymentMethods} isLoading={isLoading} />
          </div>
        </div>
      )}
    </div>
  );
}
