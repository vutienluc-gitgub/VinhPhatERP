import type { InventorySummary } from '@/api/reports.api';
import {
  KpiCard,
  KpiGrid,
  DataTable,
  Badge,
  type DataTableColumn,
} from '@/shared/components';
import { sumBy } from '@/shared/utils/array.util';

import { REPORT_LABELS } from './reports.constants';

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
        <span className="font-bold text-lg">
          {REPORT_LABELS.INVENTORY_SECTION_TITLE}
        </span>
      </div>

      <KpiGrid className="px-5 py-4">
        <KpiCard
          label={REPORT_LABELS.RAW_ROLLS}
          value={rawRolls}
          icon="Layers"
          variant="primary"
          isLoading={isLoading}
        />
        <KpiCard
          label={REPORT_LABELS.RAW_LENGTH}
          value={formatNumber(rawLength)}
          icon="Hash"
          variant="primary"
          isLoading={isLoading}
        />
        <KpiCard
          label={REPORT_LABELS.FINISH_ROLLS}
          value={finishedRolls}
          icon="Check"
          variant="success"
          isLoading={isLoading}
        />
        <KpiCard
          label={REPORT_LABELS.FINISH_LENGTH}
          value={formatNumber(finishedLength)}
          icon="Hash"
          variant="success"
          isLoading={isLoading}
        />
      </KpiGrid>

      <div className="space-y-4">
        <InventoryTable
          title={REPORT_LABELS.RAW_FABRIC_TITLE}
          eyebrow={REPORT_LABELS.RAW_FABRIC_EYEBROW}
          rows={data?.raw ?? []}
          isLoading={isLoading}
        />
        <InventoryTable
          title={REPORT_LABELS.FINISH_FABRIC_TITLE}
          eyebrow={REPORT_LABELS.FINISH_FABRIC_EYEBROW}
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
      header: REPORT_LABELS.COL_FABRIC_TYPE,
      cell: (r) => <span className="font-bold">{r.fabric_type}</span>,
      footer: REPORT_LABELS.TOTAL,
    },
    {
      header: REPORT_LABELS.COL_COLOR,
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
      className: 'max-sm:hidden text-muted-foreground text-sm',
    },
    {
      header: REPORT_LABELS.COL_QUALITY_GRADE,
      cell: (r) => r.quality_grade ?? '—',
      className: 'text-muted-foreground text-sm max-sm:hidden',
    },
    {
      header: REPORT_LABELS.COL_ROLL_COUNT,
      cell: (r) => r.roll_count,
      footer: totalRolls,
      className: 'text-right',
    },
    {
      header: REPORT_LABELS.COL_LENGTH_M,
      cell: (r) => formatNumber(r.total_length_m),
      footer: formatNumber(totalLength),
      className: 'text-right font-medium',
    },
    {
      header: REPORT_LABELS.COL_WEIGHT_KG,
      cell: (r) => formatNumber(r.total_weight_kg),
      footer: formatNumber(totalWeight),
      className: 'text-right max-sm:hidden text-muted-foreground text-sm',
    },
  ];

  return (
    <div className="mt-2 text-surface">
      <div className="px-5 py-2 bg-surface-subtle border-y border-border">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          {eyebrow}
        </p>
        <p className="text-xs font-bold">{title}</p>
      </div>
      <DataTable
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
              <Badge variant="gray">{r.quality_grade ?? '—'}</Badge>
            </div>
            <div className="text-xs text-muted-foreground mb-2">
              {r.color_name ?? '—'}
            </div>
            <div className="grid grid-cols-2 gap-4 border-t pt-2">
              <div className="flex justify-between">
                <span className="text-[10px] text-muted-foreground">Cuộn:</span>
                <span className="font-bold">{r.roll_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] text-muted-foreground">Mét:</span>
                <span className="font-bold text-foreground">
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
  // eslint-disable-next-line no-restricted-syntax
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(
    value,
  );
}
