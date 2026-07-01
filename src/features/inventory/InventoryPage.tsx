import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';

import {
  Icon,
  Badge,
  DataTable,
  TabSwitcher,
  Button,
  type DataTableColumn,
} from '@/shared/components';
import {
  useRawFabricInventory,
  useFinishedFabricInventory,
  useYarnInventory,
  useAgingStock,
} from '@/application/inventory';
import type { InventoryBreakdownRow, AgingRoll } from '@/application/inventory';
import type { YarnAvailability } from '@/api/yarn-reservation.api';
import { AGING_CONFIG, getAgingSeverity } from '@/domain/inventory';
import { WeightText, LengthText } from '@/shared/value';
import { formatQuantity } from '@/shared/value/core/formatter';
import { useContextualGuide } from '@/features/guide-system/hooks/useContextualGuide';
import { ContextualGuide } from '@/features/guide-system/components/ContextualGuide';

import { InventoryDataGrid } from './components/InventoryDataGrid';
import {
  YARN_INVENTORY_COLUMNS,
  YarnInventoryMobileCard,
} from './components/YarnInventoryColumns';
import { InventoryAdjustmentModal } from './components/InventoryAdjustmentModal';
import { InventoryAdjustmentHistory } from './components/InventoryAdjustmentHistory';

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
      <Badge variant="gray">{r.source === 'raw' ? 'Mộc' : 'TP'}</Badge>
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

const BREAKDOWN_COLUMNS: ColumnDef<InventoryBreakdownRow, unknown>[] = [
  {
    header: 'Loại vải',
    id: 'fabric_type',
    accessorKey: 'fabric_type',
    cell: ({ row }) => (
      <span className="font-bold">{row.original.fabric_type ?? '—'}</span>
    ),
  },
  {
    header: 'Màu',
    id: 'color_name',
    accessorKey: 'color_name',
    cell: ({ row }) => row.original.color_name ?? '—',
    meta: { className: 'hide-mobile td-muted' },
  },
  {
    header: 'Chất lượng',
    id: 'quality_grade',
    accessorKey: 'quality_grade',
    cell: ({ row }) =>
      row.original.quality_grade ? (
        <span className={`grade-badge grade-${row.original.quality_grade}`}>
          {row.original.quality_grade}
        </span>
      ) : (
        <span className="text-muted">—</span>
      ),
  },
  {
    header: 'Cuộn',
    id: 'roll_count',
    accessorKey: 'roll_count',
    cell: ({ row }) => row.original.roll_count ?? 0,
    meta: { className: 'text-right' },
  },
  {
    header: 'Dài (m)',
    id: 'total_length_m',
    accessorKey: 'total_length_m',
    cell: ({ row }) => <LengthText value={row.original.total_length_m ?? 0} />,
    meta: { className: 'text-right hide-mobile font-medium' },
  },
  {
    header: 'Nặng (kg)',
    id: 'total_weight_kg',
    accessorKey: 'total_weight_kg',
    cell: ({ row }) => <WeightText value={row.original.total_weight_kg ?? 0} />,
    meta: { className: 'text-right' },
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
            <LengthText
              value={row.total_length_m ?? 0}
              className="text-sm font-black text-primary"
              suffix=""
            />
            <span className="text-[10px] ml-0.5 font-black text-primary">
              m
            </span>
          </div>
          <div>
            <p className="text-[9px] uppercase text-muted font-bold mb-0.5">
              Trọng lượng
            </p>
            <WeightText
              value={row.total_weight_kg ?? 0}
              className="text-sm font-black text-slate-700"
              suffix=""
            />
            <span className="text-[10px] ml-0.5 font-black text-slate-700">
              kg
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

type InventoryTab = 'yarn' | 'raw' | 'finished' | 'aging' | 'history';

const INVENTORY_TABS: { key: InventoryTab; label: string }[] = [
  { key: 'yarn', label: 'Sợi (Yarn)' },
  { key: 'raw', label: 'Vải mộc' },
  { key: 'finished', label: 'Thành phẩm' },
  { key: 'aging', label: 'Tồn lâu (Aging)' },
  { key: 'history', label: 'Lịch sử điều chỉnh' },
];

function InventoryBreakdownTabs({
  yarnData,
  yarnLoading,
  rawData,
  rawLoading,
  finishedData,
  finishedLoading,
  agingRolls,
  agingLoading,
  agingError,
  criticalCount,
  warningCount,
}: {
  yarnData: YarnAvailability[];
  yarnLoading: boolean;
  rawData: InventoryBreakdownRow[];
  rawLoading: boolean;
  finishedData: InventoryBreakdownRow[];
  finishedLoading: boolean;
  agingRolls: AgingRoll[];
  agingLoading: boolean;
  agingError: Error | null;
  criticalCount: number;
  warningCount: number;
}) {
  const [activeTab, setActiveTab] = useState<InventoryTab>('yarn');

  const tabs = INVENTORY_TABS.map((t) => {
    let badge = 0;
    if (t.key === 'yarn') badge = yarnData.length;
    else if (t.key === 'raw') badge = rawData.length;
    else if (t.key === 'finished') badge = finishedData.length;
    else if (t.key === 'aging') badge = agingRolls.length;
    return { ...t, badge };
  });

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area flex-col sm:flex-row items-start sm:items-center gap-4">
        <TabSwitcher
          tabs={tabs}
          active={activeTab}
          onChange={setActiveTab}
          variant="premium"
        />

        {activeTab === 'aging' && agingRolls.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {criticalCount > 0 && (
              <Badge variant="danger" className="text-[10px]">
                {criticalCount} cuộn &gt; 90 ngày
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="warning" className="text-[10px]">
                {warningCount} cuộn 60–90 ngày
              </Badge>
            )}
          </div>
        )}
      </div>

      {activeTab === 'yarn' && (
        <InventoryDataGrid
          title=""
          data={yarnData}
          columns={YARN_INVENTORY_COLUMNS}
          isLoading={yarnLoading}
          rowKey={(r) => r.id}
          emptyStateTitle="Không có dữ liệu sợi"
          renderMobileCard={(r) => <YarnInventoryMobileCard row={r} />}
        />
      )}

      {activeTab === 'raw' && (
        <InventoryDataGrid
          title=""
          data={rawData}
          columns={BREAKDOWN_COLUMNS}
          isLoading={rawLoading}
          rowKey={(r) =>
            `${r.fabric_type ?? 'none'}-${r.color_name ?? 'none'}-${r.quality_grade ?? 'none'}`
          }
          renderMobileCard={(r) => <BreakdownMobileCard row={r} />}
        />
      )}

      {activeTab === 'finished' && (
        <InventoryDataGrid
          title=""
          data={finishedData}
          columns={BREAKDOWN_COLUMNS}
          isLoading={finishedLoading}
          rowKey={(r) =>
            `${r.fabric_type ?? 'none'}-${r.color_name ?? 'none'}-${r.quality_grade ?? 'none'}`
          }
          renderMobileCard={(r) => <BreakdownMobileCard row={r} />}
        />
      )}

      {activeTab === 'aging' && (
        <>
          {agingError ? (
            <div className="p-4">
              <p className="error-inline">
                Lỗi:{' '}
                {agingError instanceof Error
                  ? agingError.message
                  : String(agingError)}
              </p>
            </div>
          ) : (
            <DataTable
              data={agingRolls}
              columns={AGING_COLUMNS}
              isLoading={agingLoading}
              rowKey={(r) => r.id}
              emptyStateTitle="Không có cuộn nào tồn kho quá 30 ngày"
              emptyStateDescription="Tất cả cuộn đang ở trạng thái lưu thông tốt."
              emptyStateIcon="CheckCircle"
              renderMobileCard={(r) => <AgingMobileCard roll={r} />}
            />
          )}
        </>
      )}

      {activeTab === 'history' && <InventoryAdjustmentHistory />}
    </div>
  );
}

export function InventoryPage() {
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

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
  const yarnStats = yarnQuery.data?.stats;

  const agingRolls = agingQuery.data?.rolls ?? [];
  const criticalCount = agingQuery.data?.stats.criticalCount ?? 0;
  const warningCount = agingQuery.data?.stats.warningCount ?? 0;

  return (
    <div className="page-container relative">
      {activeGuides.length > 0 && (
        <ContextualGuide activeGuides={activeGuides} />
      )}
      <div className="flex justify-between items-end mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight m-0">Tồn kho</h1>
          <p className="text-muted-foreground m-0">
            Quản lý kho nguyên phụ liệu và thành phẩm
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="primary" onClick={() => setIsAdjustModalOpen(true)}>
            <Icon name="Settings2" size={16} className="mr-2" />
            Điều chỉnh tồn kho
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* KPI Dashboard Card */}
        <div className="panel-card card-flush">
          {hasError && (
            <div className="p-4">
              <p className="error-inline">
                Lỗi tải dữ liệu:{' '}
                {hasError instanceof Error
                  ? hasError.message
                  : String(hasError)}
              </p>
            </div>
          )}

          <div className="kpi-section kpi-grid">
            {/* Yarn KPIs */}
            <div className="kpi-card-premium kpi-success col-span-full md:col-span-2">
              <div className="kpi-overlay" />
              <div className="kpi-content flex-col w-full h-full justify-between items-start">
                <div className="kpi-info w-full">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="Box" size={20} className="opacity-80" />
                    <p className="kpi-label m-0">Sợi — Khả dụng</p>
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <WeightText
                      value={yarnStats?.totalAvailableKg ?? 0}
                      className="kpi-value text-4xl tracking-tight"
                      suffix=""
                    />
                    <span className="text-sm font-bold opacity-80 uppercase">
                      kg
                    </span>
                  </div>
                </div>

                <div className="w-full mt-4 pt-3 border-t border-white/20 text-sm space-y-1.5 font-medium">
                  <div className="flex justify-between items-center opacity-90">
                    <span>Tổng kho (Total):</span>
                    <span className="font-bold">
                      <WeightText
                        value={yarnStats?.totalStockKg ?? 0}
                        suffix="kg"
                      />
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-red-100">
                    <span>Đã giữ (Reserved):</span>
                    <span>
                      -{' '}
                      <WeightText
                        value={yarnStats?.totalReservedKg ?? 0}
                        suffix="kg"
                      />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Raw fabric KPIs */}
            <div className="kpi-card-premium kpi-success">
              <div className="kpi-overlay" />
              <div className="kpi-content">
                <div className="kpi-info">
                  <p className="kpi-label">Vải mộc — Cuộn</p>
                  <p className="kpi-value">
                    {formatQuantity(rawStats?.totalRolls ?? 0, 0)}
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
                    <LengthText
                      value={rawStats?.totalLengthM ?? 0}
                      className="kpi-value"
                      suffix=""
                    />
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
                    {formatQuantity(finishedStats?.totalRolls ?? 0, 0)}
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
                    <LengthText
                      value={finishedStats?.totalLengthM ?? 0}
                      className="kpi-value"
                      suffix=""
                    />
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
          <InventoryBreakdownTabs
            yarnData={yarnQuery.data?.breakdownList ?? []}
            yarnLoading={yarnQuery.isLoading}
            rawData={rawQuery.data?.breakdown ?? []}
            rawLoading={rawQuery.isLoading}
            finishedData={finishedQuery.data?.breakdown ?? []}
            finishedLoading={finishedQuery.isLoading}
            agingRolls={agingRolls}
            agingLoading={agingQuery.isLoading}
            agingError={agingQuery.error}
            criticalCount={criticalCount}
            warningCount={warningCount}
          />
        )}

        {isLoading && (
          <div className="panel-card p-12 flex flex-col items-center gap-3">
            <div className="spinner" />
            <p className="text-muted text-sm">Đang tải dữ liệu tồn kho...</p>
          </div>
        )}
      </div>
      <ContextualGuide activeGuides={activeGuides} />

      <InventoryAdjustmentModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
      />
    </div>
  );
}
