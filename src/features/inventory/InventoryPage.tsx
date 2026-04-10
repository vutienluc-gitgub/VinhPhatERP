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
} from './useInventory';
import type { InventoryBreakdownRow, AgingRoll } from './useInventory';

type AgingSeverity = 'critical' | 'warning' | 'caution';

type AgingConfig = {
  label: string;
  variant: 'danger' | 'warning' | 'gray';
};

const AGING_CONFIG: Record<AgingSeverity, AgingConfig> = {
  critical: {
    label: 'Nghiem trong',
    variant: 'danger',
  },
  warning: {
    label: 'Canh bao',
    variant: 'warning',
  },
  caution: {
    label: 'Luu y',
    variant: 'gray',
  },
};

function getAgingSeverity(days: number): AgingSeverity {
  if (days >= 90) return 'critical';
  if (days >= 60) return 'warning';
  return 'caution';
}

function fmt(val: number, decimals = 1): string {
  return val.toLocaleString('vi-VN', { maximumFractionDigits: decimals });
}

function fmtCurrency(val: number): string {
  return new Intl.NumberFormat('vi-VN').format(val);
}

const AGING_COLUMNS: DataTableColumn<AgingRoll>[] = [
  {
    header: 'Ma cuon',
    cell: (r) => (
      <span className="font-bold text-primary">{r.roll_number}</span>
    ),
  },
  {
    header: 'Loai',
    cell: (r) => (
      <span className="badge-outline">{r.source === 'raw' ? 'Moc' : 'TP'}</span>
    ),
  },
  {
    header: 'Loai vai',
    cell: (r) => <span className="font-medium">{r.fabric_type}</span>,
  },
  {
    header: 'Mau',
    cell: (r) => r.color_name ?? 'â€”',
    className: 'hide-mobile td-muted',
  },
  {
    header: 'Vi tri',
    cell: (r) => r.warehouse_location ?? 'â€”',
    className: 'hide-mobile td-muted',
  },
  {
    header: 'Ngay ton',
    cell: (r) => (
      <span className="font-bold tabular-nums">{r.age_days} ngay</span>
    ),
    className: 'text-right',
  },
  {
    header: 'Muc',
    cell: (r) => {
      const sev = getAgingSeverity(r.age_days);
      const cfg = AGING_CONFIG[sev];
      return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
    },
  },
];

const BREAKDOWN_COLUMNS: DataTableColumn<InventoryBreakdownRow>[] = [
  {
    header: 'Loai vai',
    cell: (r) => <span className="font-bold">{r.fabric_type ?? 'â€”'}</span>,
  },
  {
    header: 'Mau',
    cell: (r) => r.color_name ?? 'â€”',
    className: 'hide-mobile td-muted',
  },
  {
    header: 'Chat luong',
    cell: (r) =>
      r.quality_grade ? (
        <span className={`grade-badge grade-${r.quality_grade}`}>
          {r.quality_grade}
        </span>
      ) : (
        <span className="text-muted">â€”</span>
      ),
  },
  {
    header: 'Cuon',
    cell: (r) => r.roll_count ?? 0,
    className: 'text-right',
  },
  {
    header: 'Dai (m)',
    cell: (r) => fmt(r.total_length_m ?? 0),
    className: 'text-right hide-mobile font-medium',
  },
  {
    header: 'Nang (kg)',
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
        <span className="mobile-card-title">{roll.roll_number}</span>
        <Badge variant={cfg.variant}>{cfg.label}</Badge>
      </div>
      <div className="mobile-card-body space-y-1">
        <p className="font-bold">{roll.fabric_type}</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted">
            <Icon name="Layers" size={14} />
            <span>{roll.source === 'raw' ? 'Moc' : 'Thanh pham'}</span>
          </div>
          {roll.color_name && (
            <div className="flex items-center gap-2 text-muted">
              <Icon name="Palette" size={14} />
              <span>{roll.color_name}</span>
            </div>
          )}
        </div>
        <div className="flex justify-between items-center pt-2 mt-1 border-t border-border/10">
          <span className="text-xs text-muted">Ton kho</span>
          <span className="font-bold text-sm">{roll.age_days} ngay</span>
        </div>
      </div>
    </div>
  );
}

function BreakdownMobileCard({ row }: { row: InventoryBreakdownRow }) {
  return (
    <div className="mobile-card">
      <div className="mobile-card-header">
        <span className="mobile-card-title">{row.fabric_type ?? 'â€”'}</span>
        {row.quality_grade && (
          <span className={`grade-badge grade-${row.quality_grade}`}>
            {row.quality_grade}
          </span>
        )}
      </div>
      <div className="mobile-card-body">
        <div className="grid grid-cols-3 gap-2 text-center mt-1">
          <div>
            <p className="text-[10px] uppercase text-muted">Cuon</p>
            <p className="font-bold">{row.roll_count ?? 0}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-muted">Dai</p>
            <p className="font-bold text-primary">
              {fmt(row.total_length_m ?? 0)} m
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-muted">Nang</p>
            <p className="font-medium">{fmt(row.total_weight_kg ?? 0)} kg</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InventoryBreakdownPanel({
  eyebrow,
  title,
  rows,
  isLoading,
}: {
  eyebrow: string;
  title: string;
  rows: InventoryBreakdownRow[];
  isLoading: boolean;
}) {
  return (
    <div className="panel-card card-flush">
      <div className="card-header-area card-header-premium">
        <div>
          <p className="eyebrow-premium">{eyebrow}</p>
          <h3 className="title-premium">{title}</h3>
        </div>
      </div>
      <DataTablePremium
        data={rows}
        columns={BREAKDOWN_COLUMNS}
        isLoading={isLoading}
        rowKey={(r) =>
          `${r.fabric_type ?? 'none'}-${r.color_name ?? 'none'}-${r.quality_grade ?? 'none'}`
        }
        emptyStateTitle="Khong co du lieu ton kho"
        emptyStateDescription="Chua co du lieu cho phan nay."
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

  const isLoading =
    rawQuery.isLoading || finishedQuery.isLoading || yarnQuery.isLoading;
  const hasError = rawQuery.error ?? finishedQuery.error ?? yarnQuery.error;

  const rawStats = rawQuery.data?.stats;
  const finishedStats = finishedQuery.data?.stats;
  const yarnStats = yarnQuery.data;

  const agingRolls = agingQuery.data ?? [];
  const criticalCount = agingRolls.filter((r) => r.age_days >= 90).length;
  const warningCount = agingRolls.filter(
    (r) => r.age_days >= 60 && r.age_days < 90,
  ).length;

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Dashboard Card */}
      <div className="panel-card card-flush">
        <div className="card-header-area card-header-premium">
          <div>
            <p className="eyebrow-premium">TON KHO</p>
            <h3 className="title-premium">Dashboard ton kho tong hop</h3>
          </div>
        </div>

        {hasError && (
          <div className="p-4">
            <p className="error-inline">
              Loi tai du lieu: {(hasError as Error).message}
            </p>
          </div>
        )}

        <div className="kpi-grid p-4 md:p-6 bg-surface-subtle border-b border-border">
          {/* Yarn KPIs */}
          <div className="kpi-card-premium kpi-primary">
            <div className="kpi-overlay" />
            <div className="kpi-content">
              <div className="kpi-info">
                <p className="kpi-label">Soi â€” Phieu nhap</p>
                <p className="kpi-value">{yarnStats?.totalReceipts ?? 0}</p>
              </div>
              <div className="kpi-icon-box">
                <Icon name="ScrollText" size={32} />
              </div>
            </div>
            <div className="kpi-footer text-xs opacity-80 italic">
              Phieu nhap kho soi
            </div>
          </div>

          <div className="kpi-card-premium kpi-secondary">
            <div className="kpi-overlay" />
            <div className="kpi-content">
              <div className="kpi-info">
                <p className="kpi-label">Soi â€” Gia tri</p>
                <p className="kpi-value">
                  {fmtCurrency(yarnStats?.totalAmount ?? 0)}
                  <span className="text-base font-semibold ml-1 opacity-80">
                    d
                  </span>
                </p>
              </div>
              <div className="kpi-icon-box">
                <Icon name="Wallet" size={32} />
              </div>
            </div>
            <div className="kpi-footer text-xs opacity-80 italic">
              Tong gia tri nhap soi
            </div>
          </div>

          {/* Raw fabric KPIs */}
          <div className="kpi-card-premium kpi-success">
            <div className="kpi-overlay" />
            <div className="kpi-content">
              <div className="kpi-info">
                <p className="kpi-label">Vai moc â€” Cuon</p>
                <p className="kpi-value">
                  {(rawStats?.totalRolls ?? 0).toLocaleString('vi-VN')}
                </p>
              </div>
              <div className="kpi-icon-box">
                <Icon name="Layers" size={32} />
              </div>
            </div>
            <div className="kpi-footer text-xs opacity-80 italic">
              San sang dua vao nhuom
            </div>
          </div>

          <div className="kpi-card-premium kpi-warning">
            <div className="kpi-overlay" />
            <div className="kpi-content">
              <div className="kpi-info">
                <p className="kpi-label">Vai moc â€” Tong dai</p>
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
              Chieu dai ton kho vai moc
            </div>
          </div>

          {/* Finished fabric KPIs */}
          <div className="kpi-card-premium kpi-primary">
            <div className="kpi-overlay" />
            <div className="kpi-content">
              <div className="kpi-info">
                <p className="kpi-label">Thanh pham â€” Cuon</p>
                <p className="kpi-value">
                  {(finishedStats?.totalRolls ?? 0).toLocaleString('vi-VN')}
                </p>
              </div>
              <div className="kpi-icon-box">
                <Icon name="Package" size={32} />
              </div>
            </div>
            <div className="kpi-footer text-xs opacity-80 italic">
              Da hoan tat cong doan nhuom
            </div>
          </div>

          <div className="kpi-card-premium kpi-success">
            <div className="kpi-overlay" />
            <div className="kpi-content">
              <div className="kpi-info">
                <p className="kpi-label">Thanh pham â€” Tong dai</p>
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
              Da kiem tra chat luong (QC)
            </div>
          </div>
        </div>
      </div>

      {!isLoading && !hasError && (
        <>
          {/* Raw Fabric Breakdown */}
          <InventoryBreakdownPanel
            eyebrow="VAI MOC"
            title="Chi tiet ton kho vai moc"
            rows={rawQuery.data?.breakdown ?? []}
            isLoading={rawQuery.isLoading}
          />

          {/* Finished Fabric Breakdown */}
          <InventoryBreakdownPanel
            eyebrow="THANH PHAM"
            title="Chi tiet ton kho thanh pham"
            rows={finishedQuery.data?.breakdown ?? []}
            isLoading={finishedQuery.isLoading}
          />

          {/* Aging Stock Panel */}
          <div className="panel-card card-flush">
            <div className="card-header-area card-header-premium">
              <div>
                <p className="eyebrow-premium">CANH BAO TON KHO</p>
                <h3 className="title-premium">
                  Cuon ton kho lau (Aging Stock)
                </h3>
              </div>
              {agingRolls.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {criticalCount > 0 && (
                    <span className="badge-outline text-danger border-danger/30 text-xs">
                      {criticalCount} cuon &gt; 90 ngay
                    </span>
                  )}
                  {warningCount > 0 && (
                    <span className="badge-outline text-warning border-warning/30 text-xs">
                      {warningCount} cuon 60â€“90 ngay
                    </span>
                  )}
                </div>
              )}
            </div>

            {agingQuery.error ? (
              <div className="p-4">
                <p className="error-inline">
                  Loi: {(agingQuery.error as Error).message}
                </p>
              </div>
            ) : (
              <DataTablePremium
                data={agingRolls}
                columns={AGING_COLUMNS}
                isLoading={agingQuery.isLoading}
                rowKey={(r) => r.id}
                emptyStateTitle="Khong co cuon nao ton kho qua 30 ngay"
                emptyStateDescription="Tat ca cuon dang o trang thai luu thong tot."
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
          <p className="text-muted text-sm">Dang tai du lieu ton kho...</p>
        </div>
      )}
    </div>
  );
}
