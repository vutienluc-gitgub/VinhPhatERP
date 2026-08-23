import { useState, useMemo, useCallback } from 'react';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import {
  Icon,
  DataTableAdvanced,
  ViewToggle,
  type ViewMode,
  AddButton,
  FilterBar,
  type FilterFieldConfig,
  KpiCard,
  PageHeader,
  TableSection,
  ActionBar,
} from '@/shared/components';
import { TableSkeleton } from '@/shared/components/TableSkeleton';
import { useUrlFilterState } from '@/shared/hooks/useUrlFilterState';
import { useViewModePreference } from '@/shared/hooks';
import { LotMatrixCard } from '@/shared/components/roll-grid';
import {
  useDeleteFinishedFabric,
  useFinishedFabricList,
  useFinishedFabricStats,
} from '@/application/inventory';
import { useFinishedFabricExport } from '@/application/inventory';
import { formatQuantity } from '@/shared/value/core/formatter';
import {
  QUALITY_GRADE_LABELS,
  QUALITY_GRADES,
  ROLL_STATUS_LABELS,
  ROLL_STATUSES,
} from '@/schema/finished-fabric.schema';
import type {
  FinishedFabricFilter,
  FinishedFabricRoll,
} from '@/domain/inventory/finished-fabric.types';

import { canDeleteRoll, canEditRoll } from './transitions';
import {
  getFinishedFabricColumns,
  renderFinishedFabricMobileCard,
} from './FinishedFabricColumns';
import { groupRollsByLot } from './finished-fabric.utils';
import {
  FINISHED_FABRIC_PAGE_LABELS as MSG,
  FINISHED_FABRIC_LIST_LABELS as LIST_MSG,
} from './finished-fabric.constants';

type FinishedFabricListProps = {
  onEdit: (roll: FinishedFabricRoll) => void;
  onNew: () => void;
  onBulkNew: () => void;
  onTrace: (roll: FinishedFabricRoll) => void;
};

const FILTER_KEYS = ['fabric_type', 'status', 'quality_grade'] as const;

const FILTER_SCHEMA: FilterFieldConfig[] = [
  {
    key: 'fabric_type',
    type: 'search',
    label: LIST_MSG.FILTER_FABRIC_LABEL,
    placeholder: LIST_MSG.FILTER_FABRIC_PLACEHOLDER,
  },
  {
    key: 'status',
    type: 'combobox',
    label: LIST_MSG.FILTER_STATUS_LABEL,
    options: ROLL_STATUSES.map((s) => ({
      value: s,
      label: ROLL_STATUS_LABELS[s],
    })),
  },
  {
    key: 'quality_grade',
    type: 'combobox',
    label: LIST_MSG.FILTER_QUALITY_LABEL,
    options: QUALITY_GRADES.map((g) => ({
      value: g,
      label: QUALITY_GRADE_LABELS[g],
    })),
  },
];

export function FinishedFabricList({
  onEdit,
  onNew,
  onBulkNew,
  onTrace,
}: FinishedFabricListProps) {
  const { filters, setFilter, clearFilters, hasActiveFilter } =
    useUrlFilterState(FILTER_KEYS);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useViewModePreference<ViewMode>(
    'finished-fabric',
    'grid',
  );

  const {
    data: result,
    isLoading,
    error,
  } = useFinishedFabricList(filters as FinishedFabricFilter, page);
  const rolls = useMemo(() => result?.data ?? [], [result?.data]);
  const { data: stats, isLoading: isStatsLoading } = useFinishedFabricStats();
  const deleteMutation = useDeleteFinishedFabric();
  const { confirm } = useConfirm();
  const { exportExcel } = useFinishedFabricExport();
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleDelete = useCallback(
    async (roll: FinishedFabricRoll) => {
      if (!canDeleteRoll(roll.status)) return;
      const ok = await confirm({
        message: LIST_MSG.CONFIRM_DELETE_MSG.replace('{num}', roll.roll_number),
        variant: 'danger',
      });
      if (!ok) return;
      deleteMutation.mutate(roll.id);
    },
    [confirm, deleteMutation],
  );

  const handleExportExcel = useCallback(async () => {
    setIsExporting(true);
    setExportError(null);
    try {
      await exportExcel(filters as FinishedFabricFilter);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsExporting(false);
    }
  }, [exportExcel, filters]);

  const groupedRolls = useMemo(() => groupRollsByLot(rolls), [rolls]);

  const columns = useMemo(
    () =>
      getFinishedFabricColumns({
        onTrace,
        onEdit,
        handleDelete,
        isDeleting: deleteMutation.isPending,
      }),
    [onTrace, onEdit, handleDelete, deleteMutation.isPending],
  );

  function handleFilterChange(key: string, value: string | undefined) {
    setPage(1);
    setFilter(key, value);
  }

  return (
    <>
      <PageHeader
        title={MSG.PAGE_TITLE}
        subtitle={MSG.PAGE_SUBTITLE}
        actions={
          <div className="flex items-center gap-4">
            <ViewToggle value={viewMode} onChange={setViewMode} />

            <div className="flex items-center gap-2 flex-wrap">
              <AddButton onClick={onNew} label={LIST_MSG.BTN_NEW} />

              <ActionBar
                actions={[
                  {
                    icon: 'Zap',
                    title: LIST_MSG.BTN_BULK_NEW,
                    onClick: onBulkNew,
                  },
                  {
                    icon: 'FileSpreadsheet',
                    title: isExporting ? 'Đang xuất...' : LIST_MSG.BTN_EXPORT,
                    onClick: handleExportExcel,
                    disabled: isExporting,
                  },
                ]}
              />
            </div>
          </div>
        }
      />

      {/* KPI Dashboard */}
      {(stats || isStatsLoading) && (
        <div className="kpi-section kpi-grid px-4 sm:px-6 lg:px-8 mt-4">
          <KpiCard
            label={MSG.STAT_TOTAL_ROLLS}
            value={stats?.totalRolls ?? 0}
            icon="Package"
            variant="primary"
            formatMode="number"
            footer={MSG.STAT_TOTAL_ROLLS_DESC}
            isLoading={isStatsLoading}
          />
          <KpiCard
            label={MSG.STAT_TOTAL_LENGTH}
            value={stats ? `${formatQuantity(stats.totalLengthM, 1)} m` : ''}
            icon="Ruler"
            variant="success"
            footer={MSG.STAT_TOTAL_LENGTH_DESC}
            isLoading={isStatsLoading}
          />
          <KpiCard
            label={MSG.STAT_TOTAL_WEIGHT}
            value={stats ? `${formatQuantity(stats.totalWeightKg, 1)} kg` : ''}
            icon="Weight"
            variant="warning"
            footer={MSG.STAT_TOTAL_WEIGHT_DESC}
            isLoading={isStatsLoading}
          />
        </div>
      )}

      {/* Filters */}
      <FilterBar
        schema={FILTER_SCHEMA}
        value={filters}
        onChange={handleFilterChange}
        onClear={
          hasActiveFilter
            ? () => {
                clearFilters();
                setPage(1);
              }
            : undefined
        }
      />

      {error && (
        <div className="px-4 sm:px-6 lg:px-8 mt-4">
          <p className="error-inline">
            {LIST_MSG.ERR_LOAD}{' '}
            {error instanceof Error ? error.message : String(error)}
          </p>
        </div>
      )}
      {exportError && (
        <div className="px-4 sm:px-6 lg:px-8 mt-4 pt-0">
          <p className="error-inline">
            {LIST_MSG.ERR_EXPORT} {exportError}
          </p>
        </div>
      )}

      {/* Main Content View */}
      <TableSection>
        {viewMode === 'grid' ? (
          <div className="p-4 flex flex-col gap-6">
            {isLoading ? (
              <TableSkeleton columns={5} rows={5} />
            ) : rolls.length === 0 ? (
              <div className="empty-state py-20">
                <div className="empty-icon">
                  <Icon name="Package" size={48} />
                </div>
                <p>{LIST_MSG.EMPTY_STATE_DEFAULT_TITLE}</p>
              </div>
            ) : (
              groupedRolls.map((group) => (
                <LotMatrixCard
                  key={group.lot}
                  title={group.lot}
                  lotNumber={
                    group.lot !== LIST_MSG.LBL_NO_LOT ? group.lot : undefined
                  }
                  colorName={group.colorName || undefined}
                  expectedRollsCount={group.rolls.length}
                  rolls={group.rolls.map((r) => ({
                    id: r.id,
                    roll_number: r.roll_number,
                    weight_kg: r.weight_kg ?? undefined,
                    status: r.status,
                    raw_roll_number: r.raw_roll_number ?? undefined,
                    image_url: r.image_url ?? undefined,
                  }))}
                  standardWeightKg={group.standardWeightKg}
                  mode="view"
                  onRollPress={(roll) => {
                    const original = rolls.find((r) => r.id === roll.id);
                    if (original) onEdit(original);
                  }}
                />
              ))
            )}
          </div>
        ) : (
          <DataTableAdvanced
            data={rolls}
            isLoading={isLoading}
            rowKey={(r) => r.id}
            onRowClick={(r) => {
              if (canEditRoll(r.status)) onEdit(r);
            }}
            emptyStateTitle={
              hasActiveFilter
                ? LIST_MSG.EMPTY_STATE_FILTER_TITLE
                : LIST_MSG.EMPTY_STATE_DEFAULT_TITLE
            }
            emptyStateIcon="Package"
            emptyStateDescription={
              !hasActiveFilter ? LIST_MSG.EMPTY_STATE_DEFAULT_DESC : undefined
            }
            emptyStateActionLabel={
              !hasActiveFilter ? `+ ${LIST_MSG.BTN_NEW}` : undefined
            }
            onEmptyStateAction={!hasActiveFilter ? onNew : undefined}
            columns={columns}
            exportFileName="danh_sach_thanh_pham"
            renderMobileCard={(r) =>
              renderFinishedFabricMobileCard(r, {
                onTrace,
                onEdit,
                handleDelete,
              })
            }
            pagination={{
              result,
              onPageChange: setPage,
              itemLabel: 'cuộn',
            }}
          />
        )}
      </TableSection>
    </>
  );
}
