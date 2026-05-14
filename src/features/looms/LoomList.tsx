import { useState, useMemo, useCallback } from 'react';
import type { ColumnDef } from '@tanstack/react-table';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import {
  DataTableAdvanced,
  AddButton,
  ActionMenu,
  FilterBar,
  type FilterFieldConfig,
  KpiCard,
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
import { SaaSBadge, LoomMobileCard } from './components/LoomMobileCard';

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
  const activeCount = useMemo(
    () => looms.filter((l) => l.status === 'active').length,
    [looms],
  );
  const maintenanceCount = useMemo(
    () => looms.filter((l) => l.status === 'maintenance').length,
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

  const columns = useMemo<ColumnDef<LoomWithSupplier>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Máy dệt',
        cell: ({ row }) => {
          const l = row.original;
          return (
            <div className="flex flex-col gap-1.5 items-start">
              <div className="flex items-center gap-2">
                <span className="text-foreground text-[0.9rem] font-bold tracking-tight">
                  {l.code}
                </span>
                <SaaSBadge status={l.status} />
              </div>
              <span className="text-muted-foreground text-[0.75rem] mt-0.5 line-clamp-1">
                <span className="font-medium text-foreground">{l.name}</span> •{' '}
                {LOOM_TYPE_LABELS[l.loom_type]}
              </span>
            </div>
          );
        },
      },
      {
        accessorFn: (l) => l.supplier?.name,
        id: 'supplier',
        header: 'Nhà dệt',
        cell: ({ row }) => (
          <span className="font-medium text-[0.85rem]">
            {row.original.supplier?.name ?? '—'}
          </span>
        ),
      },
      {
        accessorKey: 'daily_capacity_m',
        header: () => <div className="text-right w-full">Thông số</div>,
        meta: { className: 'text-right' },
        cell: ({ row }) => {
          const l = row.original;
          return (
            <div className="flex flex-col items-end text-right w-full gap-1.5">
              <span className="font-medium text-foreground text-[0.85rem]">
                {l.daily_capacity_m
                  ? `${l.daily_capacity_m.toLocaleString()} m/ngày`
                  : '—'}
              </span>
              <span className="text-muted-foreground text-[0.75rem]">
                {l.max_width_cm ? `Khổ: ${l.max_width_cm} cm` : ''}
                {l.max_width_cm && (l.diameter_inch || l.gauge) ? ' | ' : ''}
                {l.diameter_inch ? `${l.diameter_inch}"` : ''}
                {l.diameter_inch && l.gauge ? 'x' : ''}
                {l.gauge ? `${l.gauge}G` : ''}
              </span>
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        meta: { className: 'td-actions w-12' },
        cell: ({ row }) => {
          const l = row.original;
          return (
            <div className="flex justify-end pr-2">
              <ActionMenu
                items={[
                  {
                    label: 'Chỉnh sửa',
                    icon: 'Pencil',
                    onClick: () => onEdit(l),
                  },
                  {
                    label: 'Xóa máy dệt',
                    icon: 'Trash2',
                    onClick: () => handleDelete(l),
                    danger: true,
                    disabled: deleteMutation.isPending,
                  },
                ]}
              />
            </div>
          );
        },
      },
    ],
    [onEdit, handleDelete, deleteMutation.isPending],
  );

  return (
    <div className="panel-card card-flush">
      {/* Action bar */}
      <div className="card-header-area">
        <AddButton onClick={onNew} label="Thêm máy dệt" />
      </div>

      {/* KPI Dashboard */}
      <div className="kpi-section kpi-grid">
        <KpiCard
          label="Tổng số máy"
          value={data?.total ?? 0}
          icon="Cog"
          variant="primary"
          formatMode="number"
          footer="Toàn bộ danh mục"
        />
        <KpiCard
          label="Đang hoạt động"
          value={activeCount}
          icon="Activity"
          variant="success"
          formatMode="number"
          footer="Trên trang hiện tại"
        />
        <KpiCard
          label="Đang bảo trì"
          value={maintenanceCount}
          icon="Wrench"
          variant="warning"
          formatMode="number"
          footer="Cần theo dõi"
        />
      </div>

      {/* Filters (Config-Driven) */}
      <div className="flex flex-wrap items-start gap-3 px-4 py-3 border-b border-border/50 overflow-visible">
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

      {/* Table (DataTableAdvanced) */}
      <DataTableAdvanced
        data={looms}
        isLoading={isLoading}
        rowKey={(l) => l.id}
        onRowClick={onEdit}
        emptyStateTitle={
          hasActiveFilter
            ? 'Không tìm thấy máy dệt phù hợp'
            : 'Chưa có máy dệt nào'
        }
        emptyStateIcon={hasActiveFilter ? 'Search' : 'Cog'}
        emptyStateActionLabel={!hasActiveFilter ? '+ Thêm máy dệt' : undefined}
        onEmptyStateAction={!hasActiveFilter ? onNew : undefined}
        columns={columns}
        exportFileName="danh_sach_may_det"
        renderMobileCard={(l) => (
          <LoomMobileCard
            loom={l}
            onEdit={onEdit}
            onDelete={handleDelete}
            isDeleting={deleteMutation.isPending}
          />
        )}
        pagination={{
          result: data,
          onPageChange: setPage,
          itemLabel: 'máy dệt',
        }}
      />
    </div>
  );
}
