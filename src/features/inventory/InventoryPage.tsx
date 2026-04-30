import {
  Icon,
  Badge,
  DataTablePremium,
  type DataTableColumn,
} from '@/shared/components';
import {
  useRawFabricInventory,
  useFinishedFabricInventory,
  useYarnInventory,
  useAgingStock,
} from '@/application/inventory';
import type { InventoryBreakdownRow, AgingRoll } from '@/application/inventory';
import { AGING_CONFIG, getAgingSeverity } from '@/domain/inventory';
import { useContextualGuide } from '@/features/guide-system/hooks/useContextualGuide';
import { ContextualGuide } from '@/features/guide-system/components/ContextualGuide';

function fmt(val: number, decimals = 1): string {
  return val.toLocaleString('vi-VN', { maximumFractionDigits: decimals });
}

function fmtCurrency(val: number): string {
  return new Intl.NumberFormat('vi-VN').format(val);
}

const AGING_COLUMNS: DataTableColumn<AgingRoll>[] = [
  {
    header: 'Mã cuộn',
    cell: (r) => (
      <span className="font-bold text-primary">{r.roll_number}</span>
    ),
  },
  {
    header: 'Loại',
    cell: (r) => (
      <span className="badge-outline">{r.source === 'raw' ? 'Mộc' : 'TP'}</span>
    ),
  },
  {
    header: 'Loại vải',
    cell: (r) => <span className="font-medium">{r.fabric_type}</span>,
  },
  {
    header: 'Màu',
    cell: (r) => r.color_name ?? '—',
    className: 'hide-mobile td-muted',
  },
  {
    header: 'Vị trí',
    cell: (r) => r.warehouse_location ?? '—',
    className: 'hide-mobile td-muted',
  },
  {
    header: 'Ngày tồn',
    cell: (r) => (
      <span className="font-bold tabular-nums">{r.age_days} ngày</span>
    ),
    className: 'text-right',
  },
  {
    header: 'Mức',
    cell: (r) => {
      const sev = getAgingSeverity(r.age_days);
      const cfg = AGING_CONFIG[sev];
      return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
    },
  },
];

const BREAKDOWN_COLUMNS: DataTableColumn<InventoryBreakdownRow>[] = [
  {
    header: 'Loại vải',
    cell: (r) => <span className="font-bold">{r.fabric_type ?? '—'}</span>,
  },
  {
    header: 'Màu',
    cell: (r) => r.color_name ?? '—',
    className: 'hide-mobile td-muted',
  },
  {
    header: 'Chất lượng',
    cell: (r) =>
      r.quality_grade ? (
        <span className={`grade-badge grade-${r.quality_grade}`}>
          {r.quality_grade}
        </span>
      ) : (
        <span className="text-muted">—</span>
      ),
  },
  {
    header: 'Cuộn',
    cell: (r) => r.roll_count ?? 0,
    className: 'text-right',
  },
  {
    header: 'Dài (m)',
    cell: (r) => fmt(r.total_length_m ?? 0),
    className: 'text-right hide-mobile font-medium',
  },
  {
    header: 'Nặng (kg)',
    cell: (r) => fmt(r.total_weight_kg ?? 0),
    className: 'text-right',
  },
];

function AgingMobileCard({ roll }: { roll: AgingRoll }) {
  const sev = getAgingSeverity(roll.age_days);
  const cfg = AGING_CONFIG[sev];
  return (
    <div className="mobile-card">
      <div className="mobile-card-header">
        <div className="flex flex-col">
          <span className="mobile-card-title">{roll.roll_number}</span>
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
            {roll.source === 'raw' ? 'Vải mộc' : 'Thành phẩm'}
          </span>
        </div>
        <Badge variant={cfg.variant}>{cfg.label}</Badge>
      </div>
      <div className="mobile-card-body space-y-3">
        <div className="flex justify-between items-start">
          <p className="font-bold text-slate-800">{roll.fabric_type}</p>
          {roll.warehouse_location && (
            <div className="flex items-center gap-1 text-xs text-muted">
              <Icon name="MapPin" size={14} />
              <span>{roll.warehouse_location}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {roll.color_name && (
            <div className="flex items-center gap-1.5 text-xs bg-surface-subtle px-2 py-1 rounded border border-border/50">
              <Icon name="Palette" size={14} className="text-primary/70" />
              <span className="font-medium">{roll.color_name}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs bg-surface-subtle px-2 py-1 rounded border border-border/50">
            <Icon name="Clock" size={14} className="text-orange-500/70" />
            <span className="font-bold">{roll.age_days} ngày</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function BreakdownMobileCard({ row }: { row: InventoryBreakdownRow }) {
  return (
    <div className="mobile-card">
      <div className="mobile-card-header">
        <div className="flex flex-col">
          <span className="mobile-card-title">{row.fabric_type ?? '—'}</span>
          {row.color_name && (
            <span className="text-[10px] text-muted font-bold uppercase">
              {row.color_name}
            </span>
          )}
        </div>
        {row.quality_grade && (
          <span className={`grade-badge grade-${row.quality_grade}`}>
            {row.quality_grade}
          </span>
        )}
      </div>
      <div className="mobile-card-body">
        <div className="grid grid-cols-3 gap-2 text-center bg-surface-subtle/50 p-2 rounded-lg border border-border/30">
          <div>
            <p className="text-[9px] uppercase text-muted font-bold mb-0.5">
              Cuộn
            </p>
            <p className="text-sm font-black text-slate-700">
              {row.roll_count ?? 0}
            </p>
          </div>
          <div>
            <p className="text-[9px] uppercase text-muted font-bold mb-0.5">
              Tổng dài
            </p>
            <p className="text-sm font-black text-primary">
              {fmt(row.total_length_m ?? 0)}
              <span className="text-[10px] ml-0.5">m</span>
            </p>
          </div>
          <div>
            <p className="text-[9px] uppercase text-muted font-bold mb-0.5">
              Trọng lượng
            </p>
            <p className="text-sm font-black text-slate-700">
              {fmt(row.total_weight_kg ?? 0)}
              <span className="text-[10px] ml-0.5">kg</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InventoryBreakdownPanel({
  title,
  rows,
  isLoading,
}: {
  title: string;
  rows: InventoryBreakdownRow[];
  isLoading: boolean;
}) {
  return (
    <div className="panel-card card-flush">
      <div className="card-header-area">
        <span className="font-bold text-lg">{title}</span>
      </div>
      <DataTablePremium
        data={rows}
        columns={BREAKDOWN_COLUMNS}
        isLoading={isLoading}
        rowKey={(r) =>
          `${r.fabric_type ?? 'none'}-${r.color_name ?? 'none'}-${r.quality_grade ?? 'none'}`
        }
        emptyStateTitle="Không có dữ liệu tồn kho"
        emptyStateDescription="Chưa có dữ liệu cho phần này."
        emptyStateIcon="Layers"
        renderMobileCard={(r) => <BreakdownMobileCard row={r} />}
      />
    </div>
  );
}

export function InventoryPage() {
  const rawQuery = useRawFabricInventory();
  const finishedQuery = useFinishedFabricInventory();
  const yarnQuery = useYarnInventory();
  const agingQuery = useAgingStock();
  const { activeGuides } = useContextualGuide('Inventory');

  const isLoading =
    rawQuery.isLoading || finishedQuery.isLoading || yarnQuery.isLoading;
  const hasError = rawQuery.error ?? finishedQuery.error ?? yarnQuery.error;

  const rawStats = rawQuery.data?.stats;
  const finishedStats = finishedQuery.data?.stats;
  const yarnStats = yarnQuery.data;

  const agingRolls = agingQuery.data?.rolls ?? [];
  const criticalCount = agingQuery.data?.stats.criticalCount ?? 0;
  const warningCount = agingQuery.data?.stats.warningCount ?? 0;

  return (
    <div className="page-container">
      <div className="flex flex-col gap-6">
        {/* KPI Dashboard Card */}
        <div className="panel-card card-flush">
          {hasError && (
            <div className="p-4">
              <p className="error-inline">
                Lỗi tải dữ liệu: {(hasError as Error).message}
              </p>
            </div>
          )}

          <div className="kpi-section kpi-grid">
            {/* Yarn KPIs */}
            <div className="kpi-card-premium kpi-primary">
              <div className="kpi-overlay" />
              <div className="kpi-content">
                <div className="kpi-info">
                  <p className="kpi-label">Sợi — Phiếu nhập</p>
                  <p className="kpi-value">{yarnStats?.totalReceipts ?? 0}</p>
                </div>
                <div className="kpi-icon-box">
                  <Icon name="ScrollText" size={32} />
                </div>
              </div>
              <div className="kpi-footer text-xs opacity-80 italic">
                Phiếu nhập kho sợi
              </div>
            </div>

            <div className="kpi-card-premium kpi-secondary">
              <div className="kpi-overlay" />
              <div className="kpi-content">
                <div className="kpi-info">
                  <p className="kpi-label">Sợi — Giá trị</p>
                  <p className="kpi-value">
                    {fmtCurrency(yarnStats?.totalAmount ?? 0)}
                    <span className="text-base font-semibold ml-1 opacity-80">
                      đ
                    </span>
                  </p>
                </div>
                <div className="kpi-icon-box">
                  <Icon name="Wallet" size={32} />
                </div>
              </div>
              <div className="kpi-footer text-xs opacity-80 italic">
                Tổng giá trị nhập sợi
              </div>
            </div>

            {/* Raw fabric KPIs */}
            <div className="kpi-card-premium kpi-success">
              <div className="kpi-overlay" />
              <div className="kpi-content">
                <div className="kpi-info">
                  <p className="kpi-label">Vải mộc — Cuộn</p>
                  <p className="kpi-value">
                    {(rawStats?.totalRolls ?? 0).toLocaleString('vi-VN')}
                  </p>
                </div>
                <div className="kpi-icon-box">
                  <Icon name="Layers" size={32} />
                </div>
              </div>
              <div className="kpi-footer text-xs opacity-80 italic">
                Sẵn sàng đưa vào nhuộm
              </div>
            </div>

            <div className="kpi-card-premium kpi-warning">
              <div className="kpi-overlay" />
              <div className="kpi-content">
                <div className="kpi-info">
                  <p className="kpi-label">Vải mộc — Tổng dài</p>
                  <div className="flex items-baseline gap-1">
                    <p className="kpi-value">
                      {fmt(rawStats?.totalLengthM ?? 0)}
                    </p>
                    <span className="text-base font-bold opacity-80 uppercase">
                      m
                    </span>
                  </div>
                </div>
                <div className="kpi-icon-box">
                  <Icon name="Ruler" size={32} />
                </div>
              </div>
              <div className="kpi-footer text-xs opacity-80 italic">
                Chiều dài tồn kho vải mộc
              </div>
            </div>

            {/* Finished fabric KPIs */}
            <div className="kpi-card-premium kpi-primary">
              <div className="kpi-overlay" />
              <div className="kpi-content">
                <div className="kpi-info">
                  <p className="kpi-label">Thành phẩm — Cuộn</p>
                  <p className="kpi-value">
                    {(finishedStats?.totalRolls ?? 0).toLocaleString('vi-VN')}
                  </p>
                </div>
                <div className="kpi-icon-box">
                  <Icon name="Package" size={32} />
                </div>
              </div>
              <div className="kpi-footer text-xs opacity-80 italic">
                Đã hoàn tất công đoạn nhuộm
              </div>
            </div>

            <div className="kpi-card-premium kpi-success">
              <div className="kpi-overlay" />
              <div className="kpi-content">
                <div className="kpi-info">
                  <p className="kpi-label">Thành phẩm — Tổng dài</p>
                  <div className="flex items-baseline gap-1">
                    <p className="kpi-value">
                      {fmt(finishedStats?.totalLengthM ?? 0)}
                    </p>
                    <span className="text-base font-bold opacity-80 uppercase">
                      m
                    </span>
                  </div>
                </div>
                <div className="kpi-icon-box">
                  <Icon name="CheckCheck" size={32} />
                </div>
              </div>
              <div className="kpi-footer text-xs opacity-80 italic">
                Đã kiểm tra chất lượng (QC)
              </div>
            </div>
          </div>
        </div>

        {!isLoading && !hasError && (
          <>
            {/* Raw Fabric Breakdown */}
            <InventoryBreakdownPanel
              title="Chi tiết tồn kho vải mộc"
              rows={rawQuery.data?.breakdown ?? []}
              isLoading={rawQuery.isLoading}
            />

            {/* Finished Fabric Breakdown */}
            <InventoryBreakdownPanel
              title="Chi tiết tồn kho thành phẩm"
              rows={finishedQuery.data?.breakdown ?? []}
              isLoading={finishedQuery.isLoading}
            />

            {/* Aging Stock Panel */}
            <div className="panel-card card-flush">
              <div className="card-header-area flex-col sm:flex-row items-start sm:items-center gap-4">
                <span className="font-bold text-lg">
                  Cuộn tồn kho lâu (Aging Stock)
                </span>
                {agingRolls.length > 0 && (
                  <div className="flex gap-2 flex-wrap w-full sm:w-auto">
                    {criticalCount > 0 && (
                      <span className="badge-outline text-danger border-danger/30 text-[10px] py-0.5 px-2 bg-danger/5">
                        {criticalCount} cuộn &gt; 90 ngày
                      </span>
                    )}
                    {warningCount > 0 && (
                      <span className="badge-outline text-warning border-warning/30 text-[10px] py-0.5 px-2 bg-warning/5">
                        {warningCount} cuộn 60–90 ngày
                      </span>
                    )}
                  </div>
                )}
              </div>

              {agingQuery.error ? (
                <div className="p-4">
                  <p className="error-inline">
                    Lỗi: {(agingQuery.error as Error).message}
                  </p>
                </div>
              ) : (
                <DataTablePremium
                  data={agingRolls}
                  columns={AGING_COLUMNS}
                  isLoading={agingQuery.isLoading}
                  rowKey={(r) => r.id}
                  emptyStateTitle="Không có cuộn nào tồn kho quá 30 ngày"
                  emptyStateDescription="Tất cả cuộn đang ở trạng thái lưu thông tốt."
                  emptyStateIcon="CheckCircle"
                  renderMobileCard={(r) => <AgingMobileCard roll={r} />}
                />
              )}
            </div>
          </>
        )}

        {isLoading && (
          <div className="panel-card p-12 flex flex-col items-center gap-3">
            <div className="spinner" />
            <p className="text-muted text-sm">Đang tải dữ liệu tồn kho...</p>
          </div>
        )}
      </div>
      <ContextualGuide activeGuides={activeGuides} />
    </div>
  );
}
