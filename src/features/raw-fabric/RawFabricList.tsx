import { useMemo, useState } from 'react';

import { Pagination } from '@/shared/components/Pagination';
import {
  Button,
  Icon,
  Badge,
  type BadgeVariant,
  DataTablePremium,
  ViewToggle,
  type ViewMode,
} from '@/shared/components';
import { LotMatrixCard } from '@/shared/components/roll-grid';
import { AnomalyLegend } from '@/shared/components/roll-grid';
import {
  useRawFabricList,
  useRawFabricStats,
  useRawFabricAll,
} from '@/application/inventory';
import { useRawFabricExport } from '@/application/inventory';
import { StatWidget } from '@/shared/components/StatWidget';

import { ActionMenu } from './ActionMenu';
import { FilterBar } from './FilterBar';
import { ROLL_STATUS_LABELS } from './raw-fabric.module';
import type {
  QualityGrade,
  RawFabricFilter,
  RawFabricRoll,
  RollStatus,
} from './types';
import { DEFAULT_FILTER_STATE, type FilterState } from './helpers';

type RawFabricListProps = {
  onEdit: (roll: RawFabricRoll) => void;
  onNew: () => void;
  onBulkNew: () => void;
};

function getStatusVariant(status: RollStatus): BadgeVariant {
  switch (status) {
    case 'in_stock':
      return 'success';
    case 'reserved':
      return 'info';
    case 'in_process':
      return 'purple';
    case 'shipped':
      return 'gray';
    case 'damaged':
      return 'danger';
    case 'written_off':
      return 'gray';
    default:
      return 'gray';
  }
}

/** Derive RawFabricFilter from unified FilterState */
function toApiFilter(fs: FilterState): RawFabricFilter {
  return {
    fabric_type: fs.fabricType.trim() || undefined,
    roll_number: fs.rollCode.trim() || undefined,
    status: (fs.status as RollStatus) || undefined,
    quality_grade: (fs.quality as QualityGrade) || undefined,
  };
}

export function RawFabricList({
  onEdit,
  onNew,
  onBulkNew,
}: RawFabricListProps) {
  const [filterState, setFilterState] =
    useState<FilterState>(DEFAULT_FILTER_STATE);
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const filters = useMemo(() => toApiFilter(filterState), [filterState]);

  const { data: result, isLoading, error } = useRawFabricList(filters, page);
  const rolls = useMemo(() => result?.data ?? [], [result?.data]);
  const { data: stats } = useRawFabricStats();
  const { refetch: fetchAllExport } = useRawFabricAll(filters);
  const { exportExcel } = useRawFabricExport();

  async function handleExportExcel() {
    setIsExporting(true);
    try {
      const resp = await fetchAllExport();
      if (resp.data) {
        await exportExcel(resp.data);
      }
    } finally {
      setIsExporting(false);
    }
  }

  function handleFilterChange(next: FilterState) {
    setFilterState(next);
    setPage(1);
  }

  function handleClearFilter() {
    setFilterState(DEFAULT_FILTER_STATE);
    setPage(1);
  }

  const hasFilter = !!(
    filterState.fabricType ||
    filterState.rollCode ||
    filterState.status ||
    filterState.quality
  );

  // Derive unique fabric_type options from current rolls data
  const fabricTypeOptions = useMemo(() => {
    const seen = new Set<string>();
    rolls.forEach((r) => {
      if (r.fabric_type) seen.add(r.fabric_type);
    });
    return Array.from(seen).sort();
  }, [rolls]);

  const groupedRolls = useMemo(() => {
    const map = new Map<string, RawFabricRoll[]>();
    rolls.forEach((roll) => {
      const key = roll.lot_number || 'KHÔNG CÓ LÔ';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(roll);
    });
    return Array.from(map.entries()).map(([lot, items]) => {
      const weights = items
        .map((r) => r.weight_kg)
        .filter((w): w is number => !!w && w > 0)
        .sort((a, b) => a - b);
      let median: number | undefined;
      if (weights.length > 0) {
        median = weights[Math.floor(weights.length / 2)];
      }

      return {
        lot,
        rolls: items,
        fabricType: items[0]?.fabric_type,
        colorName: items[0]?.color_name,
        medianWeight: median,
      };
    });
  }, [rolls]);

  return (
    <div className="panel-card card-flush">
      {/* Header Area */}
      <div className="card-header-area card-header-premium">
        <div>
          <p className="eyebrow-premium">KHO VẢI MỘC</p>
          <h3 className="title-premium">Quản lý cuộn vải mộc</h3>
        </div>

        <div className="flex items-center gap-4">
          <ViewToggle value={viewMode} onChange={setViewMode} />
          <ActionMenu
            onNew={onNew}
            onBulkNew={onBulkNew}
            onExport={() => void handleExportExcel()}
            isExporting={isExporting}
          />
        </div>
      </div>

      {/* KPI Dashboard */}
      {stats && (
        <div className="kpi-grid p-4 md:p-6 bg-surface-subtle border-b border-border grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
          <StatWidget
            title="Tổng số cuộn"
            icon="Box"
            value={stats.totalRolls.toLocaleString()}
            subtitle="Cuộn đang trong kho"
            color="primary"
            onClick={() => {
              handleClearFilter();
            }}
          />
          <StatWidget
            title="Tổng chiều dài"
            icon="Ruler"
            value={`${stats.totalLengthM.toLocaleString()}m`}
            subtitle="Cuộn đang trong kho"
            color="success"
            onClick={() => {
              handleFilterChange({
                ...DEFAULT_FILTER_STATE,
                status: 'in_stock',
              });
            }}
          />
          <StatWidget
            title="Trọng lượng tịnh"
            icon="Scale"
            value={`${stats.totalWeightKg.toLocaleString()}kg`}
            subtitle="Trọng lượng tịnh thực tế"
            color="amber"
            legend={
              viewMode === 'grid' && rolls.length > 0 ? (
                <AnomalyLegend />
              ) : undefined
            }
            onClick={() => {
              handleFilterChange({
                ...DEFAULT_FILTER_STATE,
                status: 'in_stock',
              });
            }}
          />
        </div>
      )}

      {/* Filters */}
      <div className="card-filter-section p-4 border-b border-border">
        <FilterBar
          value={filterState}
          onChange={handleFilterChange}
          fabricTypeOptions={fabricTypeOptions}
          resultCount={result?.total}
        />
      </div>

      {error && (
        <div className="p-4">
          <p className="error-inline">
            Lỗi tải dữ liệu: {(error as Error).message}
          </p>
        </div>
      )}

      {/* Main Content View */}
      <div className="card-table-section min-h-[400px]">
        {viewMode === 'table' ? (
          <DataTablePremium
            data={rolls}
            isLoading={isLoading}
            rowKey={(r) => r.id}
            onRowClick={(r) => onEdit(r)}
            emptyStateTitle={
              hasFilter
                ? 'Không tìm thấy cuộn vải phù hợp'
                : 'Chưa có cuộn vải nào'
            }
            emptyStateIcon={hasFilter ? 'Search' : 'Layers'}
            columns={[
              {
                header: 'Mã cuộn',
                cell: (r) => (
                  <span className="font-bold text-primary">
                    {r.roll_number}
                  </span>
                ),
              },
              {
                header: 'Số lô',
                cell: (r) => (
                  <span className="font-medium text-muted">
                    {r.lot_number || '—'}
                  </span>
                ),
              },
              {
                header: 'Loại vải / Màu',
                cell: (r) => (
                  <div className="flex flex-col">
                    <span className="font-medium">{r.fabric_type}</span>
                    <span className="text-xs text-muted">{r.color_name}</span>
                  </div>
                ),
              },
              {
                header: 'Khối lượng',
                className: 'text-right',
                cell: (r) => (
                  <span className="font-medium">
                    {r.weight_kg?.toLocaleString()}
                    <span className="text-xs ml-1 text-muted">kg</span>
                  </span>
                ),
              },
              {
                header: 'Chiều dài',
                className: 'text-right',
                cell: (r) => (
                  <span className="font-medium text-success">
                    {r.length_m?.toLocaleString()}
                    <span className="text-xs ml-1 text-muted">m</span>
                  </span>
                ),
              },
              {
                header: 'Trạng thái',
                cell: (r) => (
                  <Badge variant={getStatusVariant(r.status)}>
                    {ROLL_STATUS_LABELS[r.status]}
                  </Badge>
                ),
              },
              {
                header: 'Thao tác',
                className: 'text-right',
                onCellClick: () => {},
                cell: (r) => (
                  <button className="btn-icon" onClick={() => onEdit(r)}>
                    <Icon name="Pencil" size={16} />
                  </button>
                ),
              },
            ]}
            renderMobileCard={(r) => (
              <div className="mobile-card">
                <div className="mobile-card-header">
                  <span className="mobile-card-title">{r.roll_number}</span>
                  <Badge variant={getStatusVariant(r.status)}>
                    {ROLL_STATUS_LABELS[r.status]}
                  </Badge>
                </div>
                <div className="mobile-card-body">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{r.fabric_type}</span>
                    <span className="text-xs text-muted">
                      Lô: {r.lot_number || '—'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase text-muted">
                        Khối lượng
                      </span>
                      <span className="font-bold text-sm">
                        {r.weight_kg} kg
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase text-muted">
                        Chiều dài
                      </span>
                      <span className="font-bold text-sm text-success">
                        {r.length_m} m
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          />
        ) : (
          // overflow-x-hidden to prevent horizontal scroll on mobile (Requirement 6.3)
          <div className="p-4 flex flex-col gap-6 overflow-x-hidden">
            {isLoading ? (
              <div className="flex-center py-20">
                <div className="spinner" />
              </div>
            ) : rolls.length === 0 ? (
              <div className="empty-state py-20">
                <div className="empty-icon">
                  <Icon name={hasFilter ? 'Search' : 'Layers'} size={48} />
                </div>
                <p>
                  {hasFilter
                    ? 'Không tìm thấy cuộn vải phù hợp.'
                    : 'Chưa có cuộn vải nào.'}
                </p>
                {/* Requirement 4.5: show clear filter button in empty state when filter is active */}
                {hasFilter && (
                  <Button
                    variant="secondary"
                    leftIcon="X"
                    className="btn mt-4"
                    onClick={handleClearFilter}
                  >
                    Xóa bộ lọc
                  </Button>
                )}
              </div>
            ) : (
              groupedRolls.map((group, index) => (
                <LotMatrixCard
                  key={group.lot}
                  title={group.lot}
                  lotNumber={
                    group.lot !== 'KHÔNG CÓ LÔ' ? group.lot : undefined
                  }
                  colorName={group.colorName || undefined}
                  expectedRollsCount={group.rolls.length}
                  standardWeightKg={group.medianWeight}
                  lotIndex={index + 1}
                  totalLots={groupedRolls.length}
                  rolls={group.rolls.map((r) => ({
                    id: r.id,
                    roll_number: r.roll_number,
                    weight_kg: r.weight_kg ?? undefined,
                    status: r.status,
                  }))}
                  mode="view"
                  onRollPress={(roll) => {
                    const original = rolls.find((r) => r.id === roll.id);
                    if (original) onEdit(original);
                  }}
                />
              ))
            )}
          </div>
        )}
      </div>

      <div className="p-4">
        <Pagination result={result} onPageChange={setPage} />
      </div>
    </div>
  );
}
