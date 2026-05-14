import { useState, useMemo, useCallback } from 'react';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import {
  Icon,
  DataTableAdvanced,
  ViewToggle,
  type ViewMode,
  AddButton,
  Button,
  FilterBar,
  type FilterFieldConfig,
  KpiCard,
} from '@/shared/components';
import { TableSkeleton } from '@/shared/components/TableSkeleton';
import { useUrlFilterState } from '@/shared/hooks/useUrlFilterState';
import { LotMatrixCard } from '@/shared/components/roll-grid';
import {
  useDeleteFinishedFabric,
  useFinishedFabricList,
  useFinishedFabricStats,
} from '@/application/inventory';
import { useFinishedFabricExport } from '@/application/inventory';
import {
  QUALITY_GRADE_LABELS,
  QUALITY_GRADES,
  ROLL_STATUS_LABELS,
  ROLL_STATUSES,
} from '@/schema/finished-fabric.schema';

import { canDeleteRoll, canEditRoll } from './transitions';
import {
  getFinishedFabricColumns,
  renderFinishedFabricMobileCard,
} from './FinishedFabricColumns';
import type { FinishedFabricFilter, FinishedFabricRoll } from './types';
import { groupRollsByLot } from './finished-fabric.utils';

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
    label: 'Loại vải',
    placeholder: 'Tìm loại vải...',
  },
  {
    key: 'status',
    type: 'combobox',
    label: 'Trạng thái',
    options: ROLL_STATUSES.map((s) => ({
      value: s,
      label: ROLL_STATUS_LABELS[s],
    })),
  },
  {
    key: 'quality_grade',
    type: 'combobox',
    label: 'Chất lượng',
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
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

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
        message: `Xóa cuộn "${roll.roll_number}"? Hành động này không thể hoàn tác.`,
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
    <div className="panel-card card-flush">
      {/* Action bar */}
      <div className="card-header-area">
        <div className="flex items-center gap-4">
          <ViewToggle value={viewMode} onChange={setViewMode} />

          <div className="flex gap-2">
            <AddButton onClick={onNew} label="Nhập mới" />
            <Button
              variant="secondary"
              leftIcon="Zap"
              className="btn-standard"
              type="button"
              onClick={onBulkNew}
            >
              Nhập mẻ
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button
              variant="secondary"
              leftIcon="FileSpreadsheet"
              className="btn-standard"
              type="button"
              onClick={handleExportExcel}
              disabled={isExporting}
            >
              {isExporting ? 'Đang xuất...' : 'Xuất Excel'}
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Dashboard */}
      {(stats || isStatsLoading) && (
        <div className="kpi-section kpi-grid">
          <KpiCard
            label="Tổng thành phẩm"
            value={stats?.totalRolls ?? 0}
            icon="Package"
            variant="primary"
            formatMode="number"
            footer="Cuộn đã hoàn tất công đoạn nhuộm"
            isLoading={isStatsLoading}
          />
          <KpiCard
            label="Tổng chiều dài"
            value={
              stats
                ? `${stats.totalLengthM.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} m`
                : ''
            }
            icon="Ruler"
            variant="success"
            footer="Đã kiểm tra chất lượng (QC)"
            isLoading={isStatsLoading}
          />
          <KpiCard
            label="Tổng khối lượng"
            value={
              stats
                ? `${stats.totalWeightKg.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} kg`
                : ''
            }
            icon="Weight"
            variant="warning"
            footer="Trọng lượng tịnh xuất kho"
            isLoading={isStatsLoading}
          />
        </div>
      )}

      {/* Filters (Config-Driven) */}
      <FilterBar
        schema={FILTER_SCHEMA}
        value={filters}
        onChange={handleFilterChange}
        onClear={() => {
          clearFilters();
          setPage(1);
        }}
      />

      {error && (
        <div className="p-4">
          <p className="error-inline">
            Lỗi tải dữ liệu:{' '}
            {error instanceof Error ? error.message : String(error)}
          </p>
        </div>
      )}
      {exportError && (
        <div className="p-4 pt-0">
          <p className="error-inline">Lỗi xuất Excel: {exportError}</p>
        </div>
      )}

      {/* Main Content View */}
      {viewMode === 'grid' ? (
        <div className="card-table-section p-4 flex flex-col gap-6">
          {isLoading ? (
            <TableSkeleton columns={5} rows={5} />
          ) : rolls.length === 0 ? (
            <div className="empty-state py-20">
              <div className="empty-icon">
                <Icon name="Package" size={48} />
              </div>
              <p>Chưa có cuộn thành phẩm nào.</p>
            </div>
          ) : (
            groupedRolls.map((group) => (
              <LotMatrixCard
                key={group.lot}
                title={group.lot}
                lotNumber={group.lot !== 'KHÔNG CÓ LÔ' ? group.lot : undefined}
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
              ? 'Không tìm thấy cuộn thành phẩm'
              : 'Chưa có cuộn thành phẩm nào'
          }
          emptyStateIcon="Package"
          emptyStateActionLabel={!hasActiveFilter ? '+ Nhập mới' : undefined}
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
    </div>
  );
}
