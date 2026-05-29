import { useState, useMemo, useCallback } from 'react';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import {
  AddButton,
  FilterBar,
  type FilterFieldConfig,
  KpiCard,
  Pagination,
  EmptyState,
} from '@/shared/components';
import { useDeleteLoom, useLoomList } from '@/application/settings';
import type { LoomStatus, LoomType } from '@/schema/loom.schema';
import {
  LOOM_STATUS_LABELS,
  LOOM_STATUSES,
  LOOM_TYPE_LABELS,
  LOOM_TYPES,
} from '@/schema/loom.schema';
import { useUrlFilterState } from '@/shared/hooks/useUrlFilterState';

import type { LoomWithSupplier, LoomFilter } from './types';
import { LoomCompactCard } from './components/LoomCompactCard';

type LoomListProps = {
  onEdit: (loom: LoomWithSupplier) => void;
  onNew: () => void;
};

const FILTER_KEYS = ['search', 'status', 'loom_type'] as const;

const FILTER_SCHEMA: FilterFieldConfig[] = [
  {
    key: 'search',
    type: 'search',
    label: 'Tìm kiếm',
    placeholder: 'Mã, tên máy dệt...',
  },
  {
    key: 'status',
    type: 'combobox',
    label: 'Trạng thái',
    options: LOOM_STATUSES.map((st) => ({
      value: st,
      label: LOOM_STATUS_LABELS[st],
    })),
  },
  {
    key: 'loom_type',
    type: 'combobox',
    label: 'Loại máy',
    options: LOOM_TYPES.map((t) => ({
      value: t,
      label: LOOM_TYPE_LABELS[t],
    })),
  },
];

export function LoomList({ onEdit, onNew }: LoomListProps) {
  const { filters, setFilter, clearFilters, hasActiveFilter } =
    useUrlFilterState(FILTER_KEYS);
  const [page, setPage] = useState(1);

  const apiFilters: LoomFilter = useMemo(
    () => ({
      search: filters.search,
      status: filters.status as LoomStatus | undefined,
      loom_type: filters.loom_type as LoomType | undefined,
    }),
    [filters.search, filters.status, filters.loom_type],
  );

  const { data, isLoading } = useLoomList(apiFilters, page);
  const deleteMutation = useDeleteLoom();
  const { confirm } = useConfirm();

  const looms = useMemo(() => data?.data ?? [], [data?.data]);
  const runningCount = useMemo(
    () => looms.filter((l) => l.status === 'running').length,
    [looms],
  );
  const idleCount = useMemo(
    () => looms.filter((l) => l.status === 'idle').length,
    [looms],
  );
  const breakdownCount = useMemo(
    () => looms.filter((l) => l.status === 'breakdown').length,
    [looms],
  );

  function handleFilterChange(key: string, value: string | undefined) {
    setPage(1);
    setFilter(key, value);
  }

  const handleDelete = useCallback(
    async (loom: LoomWithSupplier) => {
      const ok = await confirm({
        message: `Xóa máy dệt "${loom.name}"? Hành động này không thể hoàn tác.`,
        variant: 'danger',
      });
      if (!ok) return;
      deleteMutation.mutate(loom.id);
    },
    [confirm, deleteMutation],
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Action bar & Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Máy dệt (MES)</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý hiệu suất, trạng thái thời gian thực và thông số kỹ thuật.
          </p>
        </div>
        <AddButton onClick={onNew} label="Thêm máy dệt" />
      </div>

      {/* KPI Dashboard */}
      <div className="kpi-grid">
        <KpiCard
          label="Tổng số máy"
          value={data?.total ?? 0}
          icon="Cog"
          variant="primary"
          formatMode="number"
        />
        <KpiCard
          label="Đang chạy (Running)"
          value={runningCount}
          icon="Activity"
          variant="success"
          formatMode="number"
        />
        <KpiCard
          label="Chờ việc (Idle)"
          value={idleCount}
          icon="Coffee"
          variant="secondary"
          formatMode="number"
        />
        <KpiCard
          label="Lỗi/Hỏng (Breakdown)"
          value={breakdownCount}
          icon="AlertTriangle"
          variant="danger"
          formatMode="number"
        />
      </div>

      <div className="panel-card card-flush overflow-visible">
        {/* Filters */}
        <div className="flex flex-wrap items-start gap-3 px-4 py-3 border-b border-border/50">
          <FilterBar
            variant="inline"
            schema={FILTER_SCHEMA}
            value={filters}
            onChange={handleFilterChange}
            onClear={() => {
              clearFilters();
              setPage(1);
            }}
          />
        </div>

        {/* Content */}
        <div className="p-4">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-48 rounded-xl bg-surface-subtle animate-pulse border border-border/40"
                ></div>
              ))}
            </div>
          ) : looms.length === 0 ? (
            <div className="py-20 border border-border/50 rounded-xl">
              <EmptyState
                icon={hasActiveFilter ? 'Search' : 'Cog'}
                title={
                  hasActiveFilter
                    ? 'Không tìm thấy máy dệt phù hợp'
                    : 'Chưa có máy dệt nào'
                }
                actionLabel={!hasActiveFilter ? '+ Thêm máy dệt' : undefined}
                actionClick={!hasActiveFilter ? onNew : undefined}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {looms.map((loom) => (
                <LoomCompactCard
                  key={loom.id}
                  loom={loom}
                  onEdit={onEdit}
                  onDelete={handleDelete}
                  isDeleting={deleteMutation.isPending}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-border/50">
            <Pagination
              result={data}
              onPageChange={setPage}
              itemLabel="máy dệt"
            />
          </div>
        )}
      </div>
    </div>
  );
}
