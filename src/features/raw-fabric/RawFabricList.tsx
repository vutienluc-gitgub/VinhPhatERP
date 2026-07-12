import { useMemo, useState } from 'react';

import {
  Icon,
  DataTableAdvanced,
  ViewToggle,
  type ViewMode,
  PageLayout,
  PageHeader,
  TableSection,
} from '@/shared/components';
import { LotMatrixCard } from '@/shared/components/roll-grid';
import { AnomalyLegend } from '@/shared/components/roll-grid';
import {
  useRawFabricList,
  useRawFabricStats,
  useRawFabricAll,
} from '@/application/inventory';
import { formatQuantity } from '@/shared/value/core/formatter';
import { useRawFabricExport } from '@/application/inventory';
import { StatWidget } from '@/shared/components/StatWidget';

import { ActionMenu } from './ActionMenu';
import { FilterBar } from './FilterBar';
import type {
  QualityGrade,
  RawFabricFilter,
  RawFabricRoll,
  RollStatus,
} from './types';
import { DEFAULT_FILTER_STATE, type FilterState } from './helpers';
import { RAW_FABRIC_MESSAGES as MSG } from './raw-fabric.constants';
import { RawFabricMobileCard } from './components/RawFabricMobileCard';
import { useRawFabricColumns } from './hooks/useRawFabricColumns';

type RawFabricListProps = {
  onEdit: (roll: RawFabricRoll) => void;
  onNew: () => void;
  onBulkNew: () => void;
};

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
  const [exportError, setExportError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const filters = useMemo(() => toApiFilter(filterState), [filterState]);

  const { data: result, isLoading, error } = useRawFabricList(filters, page);
  const rolls = useMemo(() => result?.data ?? [], [result?.data]);
  const { data: stats } = useRawFabricStats();
  const { refetch: fetchAllExport } = useRawFabricAll(filters);
  const { exportExcel } = useRawFabricExport();

  async function handleExportExcel() {
    setIsExporting(true);
    setExportError(null);
    try {
      const resp = await fetchAllExport();
      if (resp.data) {
        await exportExcel(resp.data);
      }
    } catch (err) {
      setExportError(err instanceof Error ? err.message : String(err));
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
      const key = roll.lot_number || MSG.LBL_NO_LOT;
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

  const columns = useRawFabricColumns({ onEdit });

  return (
    <PageLayout>
      <PageHeader
        title={MSG.PAGE_TITLE}
        subtitle={MSG.PAGE_SUBTITLE}
        actions={
          <div className="flex items-center gap-4">
            <ViewToggle value={viewMode} onChange={setViewMode} />
            <ActionMenu
              onNew={onNew}
              onBulkNew={onBulkNew}
              onExport={() => void handleExportExcel()}
              isExporting={isExporting}
            />
          </div>
        }
      />

      {/* KPI Dashboard */}
      {stats && (
        <div className="kpi-section kpi-grid px-4 sm:px-6 lg:px-8 mt-4">
          <StatWidget
            title={MSG.STAT_TOTAL_ROLLS}
            icon="Box"
            value={formatQuantity(stats.totalRolls, 0)}
            subtitle={MSG.STAT_TOTAL_ROLLS_DESC}
            color="primary"
            onClick={() => {
              handleClearFilter();
            }}
          />
          <StatWidget
            title={MSG.STAT_TOTAL_LENGTH}
            icon="Ruler"
            value={`${formatQuantity(stats.totalLengthM, 0)}m`}
            subtitle={MSG.STAT_TOTAL_LENGTH_DESC}
            color="success"
            onClick={() => {
              handleFilterChange({
                ...DEFAULT_FILTER_STATE,
                status: 'in_stock',
              });
            }}
          />
          <StatWidget
            title={MSG.STAT_TOTAL_WEIGHT}
            icon="Scale"
            value={`${formatQuantity(stats.totalWeightKg, 0)}kg`}
            subtitle={MSG.STAT_TOTAL_WEIGHT_DESC}
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
      <div className="w-full px-4 sm:px-6 lg:px-8 mt-2 pb-4 border-b border-border">
        <FilterBar
          value={filterState}
          onChange={handleFilterChange}
          fabricTypeOptions={fabricTypeOptions}
          resultCount={result?.total}
        />
      </div>

      {error && (
        <div className="px-4 sm:px-6 lg:px-8 mt-4">
          <p className="error-inline">
            {MSG.ERR_LOAD}{' '}
            {error instanceof Error ? error.message : String(error)}
          </p>
        </div>
      )}
      {exportError && (
        <div className="px-4 sm:px-6 lg:px-8 mt-4 pt-0">
          <p className="error-inline">
            {MSG.ERR_EXPORT} {exportError}
          </p>
        </div>
      )}

      {/* Main Content View */}
      <TableSection>
        {viewMode === 'table' ? (
          <DataTableAdvanced
            data={rolls}
            isLoading={isLoading}
            rowKey={(r) => r.id}
            columns={columns}
            onRowClick={(r) => onEdit(r)}
            renderMobileCard={(r) => <RawFabricMobileCard roll={r} />}
            emptyStateTitle={
              hasFilter
                ? MSG.EMPTY_STATE_FILTER_TITLE
                : MSG.EMPTY_STATE_DEFAULT_TITLE
            }
            emptyStateDescription={
              hasFilter
                ? MSG.EMPTY_STATE_FILTER_DESC
                : MSG.EMPTY_STATE_DEFAULT_DESC
            }
            emptyStateIcon={hasFilter ? 'Search' : 'Layers'}
            emptyStateActionLabel={hasFilter ? MSG.LBL_CLEAR_FILTER : undefined}
            onEmptyStateAction={hasFilter ? handleClearFilter : undefined}
            pagination={{
              result,
              onPageChange: setPage,
            }}
          />
        ) : (
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
                    ? MSG.EMPTY_STATE_FILTER_DESC
                    : MSG.EMPTY_STATE_DEFAULT_DESC}
                </p>
                {hasFilter && (
                  <button
                    className="btn-secondary mt-4 flex items-center gap-2"
                    onClick={handleClearFilter}
                  >
                    <Icon name="X" size={16} />
                    {MSG.LBL_CLEAR_FILTER}
                  </button>
                )}
              </div>
            ) : (
              groupedRolls.map((group, index) => (
                <LotMatrixCard
                  key={group.lot}
                  title={group.lot}
                  lotNumber={
                    group.lot !== MSG.LBL_NO_LOT ? group.lot : undefined
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
      </TableSection>
    </PageLayout>
  );
}
