import type { DebtAgingRow } from '@/api/reports.api';
import {
  KpiCardPremium,
  KpiGridPremium,
  DataTablePremium,
  type DataTableColumn,
} from '@/shared/components';
import { formatCurrency } from '@/shared/utils/format';

type DebtAgingSectionProps = {
  data: DebtAgingRow[];
  isLoading: boolean;
};

const BUCKET_ORDER = ['0-30', '31-60', '61-90', '90+'] as const;
const BUCKET_LABELS: Record<string, string> = {
  '0-30': '0–30 ngày',
  '31-60': '31–60 ngày',
  '61-90': '61–90 ngày',
  '90+': 'Trên 90 ngày',
};
type BucketVariant = 'success' | 'primary' | 'warning' | 'danger' | 'secondary';

const BUCKET_VARIANTS: Record<string, BucketVariant> = {
  '0-30': 'success',
  '31-60': 'primary',
  '61-90': 'warning',
  '90+': 'danger',
};
const BUCKET_COLORS: Record<string, string> = {
  '0-30': 'var(--success)',
  '31-60': 'var(--primary)',
  '61-90': 'var(--warning)',
  '90+': 'var(--danger)',
};

type BucketSummary = {
  bucket: string;
  label: string;
  variant: BucketVariant;
  color: string;
  count: number;
  total: number;
  percent: number;
};

function computeBuckets(data: DebtAgingRow[]): BucketSummary[] {
  const grandTotal = data.reduce((s, r) => s + r.balance_due, 0);
  return BUCKET_ORDER.map((bucket) => {
    const rows = data.filter((r) => r.aging_bucket === bucket);
    const total = rows.reduce((s, r) => s + r.balance_due, 0);
    return {
      bucket,
      label: BUCKET_LABELS[bucket] ?? bucket,
      variant: BUCKET_VARIANTS[bucket] ?? 'secondary',
      color: BUCKET_COLORS[bucket] ?? '#888',
      count: rows.length,
      total,
      percent: grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0,
    };
  });
}

export function DebtAgingSection({ data, isLoading }: DebtAgingSectionProps) {
  const totalDebt = data.reduce((s, r) => s + r.balance_due, 0);
  const buckets = computeBuckets(data);
  const criticalRows = data.filter((r) => r.aging_bucket === '90+');

  const columns: DataTableColumn<DebtAgingRow>[] = [
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
      header: 'Ngày đặt',
      cell: (r) => r.order_date,
      className: 'td-muted',
    },
    {
      header: 'Ngày nợ',
      cell: (r) => (
        <span className="text-danger font-bold">{r.days_since_order} ngày</span>
      ),
      className: 'text-right',
    },
    {
      header: 'Còn nợ',
      cell: (r) => formatCurrency(r.balance_due),
      className: 'text-right font-bold text-danger',
    },
  ];

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area card-header-premium">
        <div>
          <p className="eyebrow-premium">PHÂN TÍCH</p>
          <h3 className="title-premium">Tuổi nợ (Debt Aging)</h3>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-4">
          <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">
            Phân bổ tổng nợ: {formatCurrency(totalDebt)} đ
          </p>
          <div className="flex h-6 rounded-full overflow-hidden border border-border bg-surface shadow-inner">
            {buckets
              .filter((b) => b.percent > 0)
              .map((b) => (
                <div
                  key={b.bucket}
                  title={`${b.label}: ${formatCurrency(b.total)} đ (${b.percent}%)`}
                  style={{
                    width: `${b.percent}%`,
                    background: b.color,
                  }}
                  className="flex items-center justify-center text-[10px] text-white font-bold transition-all duration-500"
                >
                  {b.percent >= 8 ? `${b.percent}%` : ''}
                </div>
              ))}
          </div>
        </div>

        <KpiGridPremium>
          {buckets.map((b) => (
            <KpiCardPremium
              key={b.bucket}
              label={b.label}
              value={`${formatCurrency(b.total)} đ`}
              icon={b.bucket === '90+' ? 'AlertCircle' : 'Clock'}
              variant={b.variant}
              footer={`${b.percent}% tổng nợ`}
              isLoading={isLoading}
            />
          ))}
        </KpiGridPremium>
      </div>

      {criticalRows.length > 0 && (
        <div className="mt-2">
          <div className="px-5 py-2 bg-danger/5 border-y border-danger/10 text-danger text-xs font-bold uppercase tracking-widest">
            ⚠ Nợ trên 90 ngày — cần hành động gấp ({criticalRows.length} đơn)
          </div>
          <DataTablePremium
            data={criticalRows}
            columns={columns}
            isLoading={isLoading}
            rowKey={(r) => r.order_id}
            renderMobileCard={(r) => (
              <div className="mobile-card border-l-danger">
                <div className="flex justify-between items-start">
                  <span className="font-bold">{r.order_number}</span>
                  <span className="text-danger font-bold">
                    {r.days_since_order} ngày
                  </span>
                </div>
                <div className="text-xs text-muted mb-2">{r.customer_name}</div>
                <div className="text-right text-sm font-bold text-danger">
                  {formatCurrency(r.balance_due)} đ
                </div>
              </div>
            )}
          />
        </div>
      )}
    </div>
  );
}
