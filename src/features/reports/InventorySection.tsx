import type { InventorySummary } from '@/api/reports.api';
import {
  KpiCardPremium,
  KpiGridPremium,
  DataTablePremium,
  type DataTableColumn,
} from '@/shared/components';
import { sumBy } from '@/shared/utils/array.util';

type InventorySectionProps = {
  data: InventorySummary | undefined;
  isLoading: boolean;
};

export function InventorySection({ data, isLoading }: InventorySectionProps) {
  const rawRolls = sumBy(data?.raw, (r) => r.roll_count) ?? 0;
  const rawLength = sumBy(data?.raw, (r) => r.total_length_m) ?? 0;
  const finishedRolls = sumBy(data?.finished, (r) => r.roll_count) ?? 0;
  const finishedLength = sumBy(data?.finished, (r) => r.total_length_m) ?? 0;

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area">
        <span className="font-bold text-lg">Cơ cấu kho hiện tại</span>
      </div>

      <KpiGridPremium className="px-5 py-4">
        <KpiCardPremium
          label="Cuộn mộc"
          value={rawRolls}
          icon="Layers"
          variant="primary"
          isLoading={isLoading}
        />
        <KpiCardPremium
          label="Mét mộc"
          value={formatNumber(rawLength)}
          icon="Hash"
          variant="primary"
          isLoading={isLoading}
        />
        <KpiCardPremium
          label="Cuộn TP"
          value={finishedRolls}
          icon="Check"
          variant="success"
          isLoading={isLoading}
        />
        <KpiCardPremium
          label="Mét TP"
          value={formatNumber(finishedLength)}
          icon="Hash"
          variant="success"
          isLoading={isLoading}
        />
      </KpiGridPremium>

      <div className="space-y-4">
        <InventoryTable
          title="Vải mộc"
          eyebrow="RAW FABRIC"
          rows={data?.raw ?? []}
          isLoading={isLoading}
        />
        <InventoryTable
          title="Vải thành phẩm"
          eyebrow="FINISHED FABRIC"
          rows={data?.finished ?? []}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

type InventoryItem = {
  fabric_type: string;
  color_name: string | null;
  color_code: string | null;
  quality_grade: string | null;
  roll_count: number;
  total_length_m: number;
  total_weight_kg: number;
};

function InventoryTable({
  title,
  eyebrow,
  rows,
  isLoading,
}: {
  title: string;
  eyebrow: string;
  rows: InventoryItem[];
  isLoading: boolean;
}) {
  const totalRolls = sumBy(rows, (r) => r.roll_count);
  const totalLength = sumBy(rows, (r) => r.total_length_m);
  const totalWeight = sumBy(rows, (r) => r.total_weight_kg);

  const columns: DataTableColumn<InventoryItem>[] = [
    {
      header: 'Loại vải',
      cell: (r) => <span className="font-bold">{r.fabric_type}</span>,
      footer: 'Tổng cộng',
    },
    {
      header: 'Màu',
      cell: (r) => (
        <span>
          {r.color_name ?? '—'}
          {r.color_code && (
            <span className="text-[10px] ml-1 opacity-60">
              ({r.color_code})
            </span>
          )}
        </span>
      ),
      className: 'hide-mobile td-muted',
    },
    {
      header: 'Phân loại',
      cell: (r) => r.quality_grade ?? '—',
      className: 'td-muted hide-mobile',
    },
    {
      header: 'Cuộn',
      cell: (r) => r.roll_count,
      footer: totalRolls,
      className: 'text-right',
    },
    {
      header: 'Mét',
      cell: (r) => formatNumber(r.total_length_m),
      footer: formatNumber(totalLength),
      className: 'text-right font-medium',
    },
    {
      header: 'Kg',
      cell: (r) => formatNumber(r.total_weight_kg),
      footer: formatNumber(totalWeight),
      className: 'text-right hide-mobile td-muted',
    },
  ];

  return (
    <div className="mt-2 text-surface">
      <div className="px-5 py-2 bg-surface-subtle border-y border-border">
        <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
          {eyebrow}
        </p>
        <p className="text-xs font-bold">{title}</p>
      </div>
      <DataTablePremium
        data={rows}
        columns={columns}
        isLoading={isLoading}
        rowKey={(r) =>
          `${r.fabric_type}-${r.color_name ?? 'none'}-${r.quality_grade ?? 'none'}`
        }
        renderMobileCard={(r) => (
          <div className="mobile-card">
            <div className="flex justify-between items-start">
              <span className="font-bold">{r.fabric_type}</span>
              <span className="badge">{r.quality_grade ?? '—'}</span>
            </div>
            <div className="text-xs text-muted mb-2">{r.color_name ?? '—'}</div>
            <div className="grid grid-cols-2 gap-4 border-t pt-2">
              <div className="flex justify-between">
                <span className="text-[10px] text-muted">Cuộn:</span>
                <span className="font-bold">{r.roll_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] text-muted">Mét:</span>
                <span className="font-bold text-primary">
                  {formatNumber(r.total_length_m)}
                </span>
              </div>
            </div>
          </div>
        )}
      />
    </div>
  );
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(
    value,
  );
}
