import { useState } from 'react';

import { Combobox } from '@/shared/components/Combobox';
import { useConfirm } from '@/shared/components/ConfirmDialog';
import {
  Icon,
  Badge,
  type BadgeVariant,
  DataTablePremium,
  AddButton,
  ClearFilterButton,
  ActionBar,
} from '@/shared/components';
import { Pagination } from '@/shared/components/Pagination';
import { useDeleteLoom, useLoomList } from '@/application/settings';
import type { LoomStatus, LoomType } from '@/schema/loom.schema';

import { LOOM_STATUS_LABELS, LOOM_TYPE_LABELS } from './loom.module';
import type { LoomWithSupplier, LoomFilter } from './types';

type LoomListProps = {
  onEdit: (loom: LoomWithSupplier) => void;
  onNew: () => void;
};

function getStatusVariant(status: LoomStatus): BadgeVariant {
  switch (status) {
    case 'active':
      return 'success';
    case 'maintenance':
      return 'warning';
    case 'inactive':
      return 'gray';
    default:
      return 'gray';
  }
}

export function LoomList({ onEdit, onNew }: LoomListProps) {
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<LoomFilter>({});
  const [page, setPage] = useState(1);

  const { data, isLoading } = useLoomList(filters, page);
  const deleteMutation = useDeleteLoom();
  const { confirm } = useConfirm();

  const looms = data?.data ?? [];

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      search: searchInput.trim() || undefined,
    }));
  }

  async function handleDelete(loom: LoomWithSupplier) {
    const ok = await confirm({
      message: `Xóa máy dệt "${loom.name}"? Hành động này không thể hoàn tác.`,
      variant: 'danger',
    });
    if (!ok) return;
    deleteMutation.mutate(loom.id);
  }

  const hasFilter = !!(filters.search || filters.status || filters.loom_type);

  return (
    <div className="panel-card card-flush">
      {/* Action bar */}
      <div className="card-header-area">
        <AddButton onClick={onNew} label="Thêm máy dệt" />
      </div>

      {/* KPI Dashboard */}
      <div className="kpi-section kpi-grid">
        <div className="kpi-card-premium kpi-primary">
          <div className="kpi-overlay" />
          <div className="kpi-content">
            <div className="kpi-info">
              <p className="kpi-label">Tổng số máy</p>
              <p className="kpi-value">{data?.total ?? 0}</p>
            </div>
            <div className="kpi-icon-box">
              <Icon name="Cog" size={32} />
            </div>
          </div>
          <div className="kpi-footer text-xs opacity-80 italic">
            Toàn bộ danh mục
          </div>
        </div>

        <div className="kpi-card-premium kpi-success">
          <div className="kpi-overlay" />
          <div className="kpi-content">
            <div className="kpi-info">
              <p className="kpi-label">Đang hoạt động</p>
              <p className="kpi-value">
                {looms.filter((l) => l.status === 'active').length}
              </p>
            </div>
            <div className="kpi-icon-box">
              <Icon name="Activity" size={32} />
            </div>
          </div>
          <div className="kpi-footer text-xs opacity-80 italic">
            Trên trang hiện tại
          </div>
        </div>

        <div className="kpi-card-premium kpi-warning">
          <div className="kpi-overlay" />
          <div className="kpi-content">
            <div className="kpi-info">
              <p className="kpi-label">Đang bảo trì</p>
              <p className="kpi-value">
                {looms.filter((l) => l.status === 'maintenance').length}
              </p>
            </div>
            <div className="kpi-icon-box">
              <Icon name="Wrench" size={32} />
            </div>
          </div>
          <div className="kpi-footer text-xs opacity-80 italic">
            Cần theo dõi
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar card-filter-section p-4 border-b border-border">
        <div className="filter-compact-premium">
          <div className="filter-field">
            <label htmlFor="filter-loom-search">Tìm kiếm</label>
            <form className="search-input-wrapper" onSubmit={handleSearch}>
              <input
                id="filter-loom-search"
                className="field-input"
                type="text"
                placeholder="Mã, tên máy dệt..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <button type="submit" className="hidden" />
              <Icon name="Search" size={16} className="search-input-icon" />
            </form>
          </div>

          <div className="filter-field">
            <label>Trạng thái</label>
            <Combobox
              options={[
                { value: '', label: 'Tất cả trạng thái' },
                { value: 'active', label: 'Hoạt động' },
                { value: 'maintenance', label: 'Bảo trì' },
                { value: 'inactive', label: 'Ngừng dùng' },
              ]}
              value={filters.status ?? ''}
              onChange={(val) => {
                setPage(1);
                setFilters((prev) => ({
                  ...prev,
                  status: (val as LoomStatus) || undefined,
                }));
              }}
            />
          </div>

          <div className="filter-field">
            <label>Loại máy</label>
            <Combobox
              options={[
                { value: '', label: 'Tất cả loại máy' },
                ...Object.entries(LOOM_TYPE_LABELS).map(([value, label]) => ({
                  value,
                  label,
                })),
              ]}
              value={filters.loom_type ?? ''}
              onChange={(val) => {
                setPage(1);
                setFilters((prev) => ({
                  ...prev,
                  loom_type: (val as LoomType) || undefined,
                }));
              }}
            />
          </div>

          {hasFilter && (
            <ClearFilterButton
              onClick={() => {
                setFilters({});
                setSearchInput('');
                setPage(1);
              }}
            />
          )}
        </div>
      </div>

      {/* Table */}
      <DataTablePremium
        data={looms}
        isLoading={isLoading}
        rowKey={(l) => l.id}
        onRowClick={(l) => onEdit(l)}
        emptyStateTitle={
          hasFilter ? 'Không tìm thấy máy dệt phù hợp' : 'Chưa có máy dệt nào'
        }
        emptyStateIcon={hasFilter ? 'Search' : 'Cog'}
        emptyStateActionLabel={!hasFilter ? '+ Thêm máy dệt' : undefined}
        onEmptyStateAction={!hasFilter ? onNew : undefined}
        columns={[
          {
            header: 'Mã máy',
            id: 'code',
            sortable: true,
            cell: (l) => (
              <span className="font-bold text-primary">{l.code}</span>
            ),
          },
          {
            header: 'Tên máy dệt',
            id: 'name',
            sortable: true,
            cell: (l) => (
              <div className="flex flex-col">
                <span className="font-medium">{l.name}</span>
                <span className="text-xs text-muted">
                  {LOOM_TYPE_LABELS[l.loom_type]}
                </span>
              </div>
            ),
          },
          {
            header: 'Nhà dệt',
            id: 'supplier',
            sortable: true,
            accessor: (l) => l.supplier?.name,
            cell: (l) => (
              <span className="font-medium">{l.supplier?.name ?? '—'}</span>
            ),
          },
          {
            header: 'Công suất',
            id: 'daily_capacity_m',
            sortable: true,
            className: 'text-right',
            cell: (l) => (
              <div className="flex flex-col text-right">
                <span className="font-bold">
                  {l.daily_capacity_m
                    ? `${l.daily_capacity_m.toLocaleString()} m/ngày`
                    : '—'}
                </span>
                {l.max_width_cm && (
                  <span className="text-xs text-muted">
                    Khổ: {l.max_width_cm} cm
                  </span>
                )}
              </div>
            ),
          },
          {
            header: 'Trạng thái',
            id: 'status',
            sortable: true,
            cell: (l) => (
              <Badge variant={getStatusVariant(l.status)}>
                {LOOM_STATUS_LABELS[l.status]}
              </Badge>
            ),
          },
          {
            header: 'Thao tác',
            className: 'text-right',
            onCellClick: () => {},
            cell: (l) => (
              <ActionBar
                actions={[
                  {
                    icon: 'Pencil',
                    onClick: () => onEdit(l),
                    title: 'Chỉnh sửa',
                  },
                  {
                    icon: 'Trash2',
                    onClick: () => handleDelete(l),
                    title: 'Xóa',
                    variant: 'danger',
                    disabled: deleteMutation.isPending,
                  },
                ]}
              />
            ),
          },
        ]}
        renderMobileCard={(l) => (
          <div className="mobile-card">
            <div className="mobile-card-header">
              <span className="mobile-card-title">{l.code}</span>
              <Badge variant={getStatusVariant(l.status)}>
                {LOOM_STATUS_LABELS[l.status]}
              </Badge>
            </div>
            <div className="mobile-card-body space-y-2">
              <p className="font-bold text-sm">{l.name}</p>
              <p className="text-xs text-muted italic">
                {LOOM_TYPE_LABELS[l.loom_type]}
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex flex-col">
                  <span className="text-xs text-muted">Nhà dệt</span>
                  <span className="font-medium">{l.supplier?.name ?? '—'}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-xs text-muted">Công suất</span>
                  <span className="font-bold text-primary">
                    {l.daily_capacity_m
                      ? `${l.daily_capacity_m.toLocaleString()} m/ngày`
                      : '—'}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs text-muted pt-2 border-t border-border/10">
                <span>
                  {l.max_width_cm ? `Khổ: ${l.max_width_cm} cm` : ''}
                  {l.max_width_cm && l.year_manufactured ? ' | ' : ''}
                  {l.year_manufactured ? `Năm SX: ${l.year_manufactured}` : ''}
                </span>
                <div className="flex gap-2">
                  <button
                    className="btn-icon p-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(l);
                    }}
                  >
                    <Icon name="Pencil" size={16} />
                  </button>
                  <button
                    className="btn-icon p-1 text-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(l);
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Icon name="Trash2" size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      />

      <div className="p-4">
        <Pagination result={data} onPageChange={setPage} />
      </div>
    </div>
  );
}
