import type {
  ProductionEfficiencyRow,
  OnTimeDeliveryRow,
} from '@/api/reports.api';
import {
  KpiCardPremium,
  KpiGridPremium,
  DataTablePremium,
  type DataTableColumn,
} from '@/shared/components';

type ProductionSectionProps = {
  efficiencyData: ProductionEfficiencyRow[];
  onTimeData: OnTimeDeliveryRow[];
  isLoading: boolean;
};

function formatNum(n: number, decimals = 1): string {
  return n.toFixed(decimals).replace(/\.0$/, '');
}

type StageSummary = {
  stage: string;
  totalOrders: number;
  lateCount: number;
  onTimeCount: number;
  avgDeviation: number;
  latePct: number;
};

const STAGE_LABELS: Record<string, string> = {
  weaving: 'Dệt',
  dyeing: 'Nhuộm',
  finishing: 'Hoàn tất',
  quality_check: 'KCS',
  delivery: 'Giao hàng',
  greige_check: 'Kiểm tra mộc',
  gnriga_check: 'Kiểm tra mộc',
  final_check: 'KCS cuối',
  packing: 'Đóng gói',
  warping: 'Mắc sợi',
};

function computeStages(data: ProductionEfficiencyRow[]): StageSummary[] {
  const stageMap = new Map<string, ProductionEfficiencyRow[]>();
  for (const row of data) {
    const rows = stageMap.get(row.stage) ?? [];
    rows.push(row);
    stageMap.set(row.stage, rows);
  }

  return Array.from(stageMap.entries()).map(([stage, rows]) => {
    const withDeviation = rows.filter((r) => r.deviation_days !== null);
    const lateCount = rows.filter((r) => r.is_late === true).length;
    const onTimeCount = rows.filter((r) => r.is_late === false).length;
    const avgDeviation =
      withDeviation.length > 0
        ? withDeviation.reduce((s, r) => s + (r.deviation_days ?? 0), 0) /
          withDeviation.length
        : 0;

    return {
      stage,
      totalOrders: rows.length,
      lateCount,
      onTimeCount,
      avgDeviation,
      latePct:
        rows.length > 0 ? Math.round((lateCount / rows.length) * 100) : 0,
    };
  });
}

export function ProductionSection({
  efficiencyData,
  onTimeData,
  isLoading,
}: ProductionSectionProps) {
  const stages = computeStages(efficiencyData);

  const totalDeliveries = onTimeData.length;
  const onTimeCount = onTimeData.filter((r) => r.is_on_time === true).length;
  const onTimePct =
    totalDeliveries > 0 ? Math.round((onTimeCount / totalDeliveries) * 100) : 0;
  const worstStage =
    stages.length > 0
      ? stages.reduce((a, b) => (a.latePct > b.latePct ? a : b))
      : null;
  const avgOverallDeviation =
    stages.length > 0
      ? stages.reduce((s, st) => s + st.avgDeviation, 0) / stages.length
      : 0;

  const columns: DataTableColumn<StageSummary>[] = [
    {
      header: 'Công đoạn',
      cell: (st) => (
        <span className="font-bold">{STAGE_LABELS[st.stage] ?? st.stage}</span>
      ),
    },
    {
      header: 'Đơn',
      cell: (st) => st.totalOrders,
      className: 'text-right',
    },
    {
      header: 'Đúng hạn',
      cell: (st) => <span className="text-success">{st.onTimeCount}</span>,
      className: 'text-right',
    },
    {
      header: 'Trễ',
      cell: (st) => (
        <span className={st.lateCount > 0 ? 'text-danger' : ''}>
          {st.lateCount}
        </span>
      ),
      className: 'text-right',
    },
    {
      header: '% Trễ',
      cell: (st) => (
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
            st.latePct > 30
              ? 'bg-danger/10 text-danger border-danger/20'
              : st.latePct > 10
                ? 'bg-warning/10 text-warning border-warning/20'
                : 'bg-success/10 text-success border-success/20'
          }`}
        >
          {st.latePct}%
        </span>
      ),
      className: 'text-right',
    },
    {
      header: 'TB trễ (ngày)',
      cell: (st) => formatNum(st.avgDeviation),
      className: 'text-right hide-mobile',
    },
  ];

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area card-header-premium">
        <div>
          <p className="eyebrow-premium">HIỆU SUẤT</p>
          <h3 className="title-premium">Sản xuất & Giao hàng</h3>
        </div>
      </div>

      <KpiGridPremium className="px-5 py-4">
        <KpiCardPremium
          label="Giao đúng hạn"
          value={`${onTimePct}%`}
          icon="CheckCircle"
          variant={
            onTimePct >= 80 ? 'success' : onTimePct >= 60 ? 'warning' : 'danger'
          }
          isLoading={isLoading}
        />
        <KpiCardPremium
          label="TB trễ (ngày)"
          value={formatNum(avgOverallDeviation)}
          icon="Clock"
          variant={avgOverallDeviation <= 2 ? 'success' : 'danger'}
          isLoading={isLoading}
        />
        {worstStage && (
          <KpiCardPremium
            label="Mắc xích yếu"
            value={STAGE_LABELS[worstStage.stage] ?? worstStage.stage}
            icon="Search"
            variant="danger"
            footer={`${worstStage.latePct}% đơn bị trễ`}
            isLoading={isLoading}
          />
        )}
        <KpiCardPremium
          label="Đơn theo dõi"
          value={totalDeliveries}
          icon="List"
          variant="secondary"
          isLoading={isLoading}
        />
      </KpiGridPremium>

      <DataTablePremium
        data={stages}
        columns={columns}
        isLoading={isLoading}
        rowKey={(st) => st.stage}
        renderMobileCard={(st) => (
          <div className="mobile-card">
            <div className="flex justify-between items-start">
              <span className="font-bold">
                {STAGE_LABELS[st.stage] ?? st.stage}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  st.latePct > 30
                    ? 'bg-danger/10 text-danger border-danger/20'
                    : st.latePct > 10
                      ? 'bg-warning/10 text-warning border-warning/20'
                      : 'bg-success/10 text-success border-success/20'
                }`}
              >
                {st.latePct}% Trễ
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center mt-3 border-t pt-2 text-[10px] text-muted">
              <div>
                <p>Tổng đơn</p>
                <p className="font-bold text-text">{st.totalOrders}</p>
              </div>
              <div>
                <p>Đúng hạn</p>
                <p className="font-bold text-success">{st.onTimeCount}</p>
              </div>
              <div>
                <p>Trễ hạn</p>
                <p className="font-bold text-danger">{st.lateCount}</p>
              </div>
            </div>
          </div>
        )}
      />
    </div>
  );
}
