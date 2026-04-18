import { useState } from 'react';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import { Pagination } from '@/shared/components/Pagination';
import {
  Icon,
  Badge,
  type BadgeVariant,
  DataTablePremium,
  AddButton,
  ActionBar,
  FilterBarPremium,
  type FilterFieldConfig,
} from '@/shared/components';
import {
  useDeleteYarnCatalog,
  useYarnCatalogList,
} from '@/application/settings';

import type {
  YarnCatalog,
  YarnCatalogFilter,
  YarnCatalogStatus,
} from './types';
import { YARN_CATALOG_STATUS_LABELS } from './yarn-catalog.module';

type YarnCatalogListProps = {
  onEdit: (catalog: YarnCatalog) => void;
  onNew: () => void;
};

function getStatusVariant(status: YarnCatalogStatus): BadgeVariant {
  return status === 'active' ? 'success' : 'gray';
}

export function YarnCatalogList({ onEdit, onNew }: YarnCatalogListProps) {
  const [filters, setFilters] = useState<YarnCatalogFilter>({});
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useYarnCatalogList(filters, page);
  const deleteMutation = useDeleteYarnCatalog();
  const { confirm } = useConfirm();

  const catalogs = data?.data ?? [];
  const activeCount = catalogs.filter((c) => c.status === 'active').length;
  const inactiveCount = catalogs.filter((c) => c.status === 'inactive').length;

  async function handleDelete(catalog: YarnCatalog) {
    const ok = await confirm({
      message: `Xoa loai soi "${catalog.name}"? Hanh dong nay khong the hoan tac.`,
      variant: 'danger',
    });
    if (!ok) return;
    deleteMutation.mutate(catalog.id);
  }

  const hasFilter = !!(filters.search || filters.status);

  const filterSchema: FilterFieldConfig[] = [
    {
      key: 'search',
      type: 'search',
      label: 'Tìm kiếm',
      placeholder: 'Tên, mã, thành phần...',
    },
    {
      key: 'status',
      type: 'combobox',
      label: 'Trạng thái',
      options: [
        {
          value: 'active',
          label: 'Đang dùng',
        },
        {
          value: 'inactive',
          label: 'Ngừng dùng',
        },
      ],
    },
  ];

  function handleFilterChange(key: string, value: string | undefined) {
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  }

  return (
    <div className="panel-card card-flush">
      {/* Header */}
      <div className="card-header-area card-header-premium">
        <div>
          <p className="eyebrow-premium">MASTER DATA</p>
          <h3 className="title-premium">Danh Mục Loại Sợi</h3>
        </div>
        <AddButton onClick={onNew} label="Thêm loại sợi" />
      </div>

      {/* 📊 KPI Dashboard - Premium Visuals */}
      <div className="kpi-grid p-4 md:p-6 bg-surface-subtle border-b border-border">
        <div className="kpi-card-premium kpi-primary">
          <div className="kpi-overlay" />
          <div className="kpi-content">
            <div className="kpi-info">
              <p className="kpi-label">Tổng loại sợi</p>
              <p className="kpi-value">{data?.total ?? 0}</p>
            </div>
            <div className="kpi-icon-box">
              <Icon name="Layers" size={32} />
            </div>
          </div>
          <div className="kpi-footer text-xs opacity-80 italic">
            Tổng số lượng danh mục
          </div>
        </div>

        <div className="kpi-card-premium kpi-success">
          <div className="kpi-overlay" />
          <div className="kpi-content">
            <div className="kpi-info">
              <p className="kpi-label">Đang dùng</p>
              <p className="kpi-value">{activeCount}</p>
            </div>
            <div className="kpi-icon-box">
              <Icon name="CheckCircle2" size={32} />
            </div>
          </div>
          <div className="kpi-footer text-xs opacity-80 italic">
            Thuộc trang hiện tại
          </div>
        </div>

        <div className="kpi-card-premium kpi-danger">
          <div className="kpi-overlay" />
          <div className="kpi-content">
            <div className="kpi-info">
              <p className="kpi-label">Ngừng dùng</p>
              <p className="kpi-value">{inactiveCount}</p>
            </div>
            <div className="kpi-icon-box">
              <Icon name="XCircle" size={32} strokeWidth={2} />
            </div>
          </div>
          <div className="kpi-footer text-xs opacity-80 italic">
            Thuộc trang hiện tại
          </div>
        </div>
      </div>

      {/* Filters (Config-Driven) */}
      <FilterBarPremium
        schema={filterSchema}
        value={filters}
        onChange={handleFilterChange}
        onClear={() => {
          setFilters({});
          setPage(1);
        }}
      />

      {/* Error */}
      {error && (
        <div className="p-4">
          <p className="error-inline">
            Lỗi tải dữ liệu: {(error as Error).message}
          </p>
        </div>
      )}

      {/* Table & Cards */}
      <DataTablePremium
        data={catalogs}
        isLoading={isLoading}
        rowKey={(c) => c.id}
        onRowClick={(c) => onEdit(c)}
        emptyStateTitle={
          hasFilter ? 'Không tìm thấy loại sợi phù hợp' : 'Chưa có loại sợi nào'
        }
        emptyStateDescription={
          hasFilter
            ? 'Thử điều chỉnh bộ lọc.'
            : 'Nhấn "+ Thêm loại sợi" để bắt đầu quản lý danh mục sợi.'
        }
        emptyStateIcon={hasFilter ? 'Search' : 'Layers'}
        emptyStateActionLabel={!hasFilter ? '+ Thêm loại sợi' : undefined}
        onEmptyStateAction={!hasFilter ? onNew : undefined}
        columns={[
          {
            header: 'Mã / Tên',
            id: 'code',
            sortable: true,
            cell: (c) => (
              <div className="flex flex-col">
                <span className="font-bold text-primary">{c.code}</span>
                <span className="text-sm">{c.name}</span>
                {c.color_name && (
                  <span className="text-xs text-muted">
                    Màu: {c.color_name}
                  </span>
                )}
              </div>
            ),
          },
          {
            header: 'Thành phần',
            id: 'composition',
            sortable: true,
            cell: (c) => (
              <span className="text-sm text-muted">{c.composition ?? '—'}</span>
            ),
          },
          {
            header: 'Xuất xứ',
            id: 'origin',
            sortable: true,
            cell: (c) => <span className="text-sm">{c.origin ?? '—'}</span>,
          },
          {
            header: 'Đơn vị',
            id: 'unit',
            sortable: true,
            className: 'font-medium',
            cell: (c) => c.unit,
          },
          {
            header: 'Trạng thái',
            id: 'status',
            sortable: true,
            cell: (c) => (
              <Badge variant={getStatusVariant(c.status)}>
                {YARN_CATALOG_STATUS_LABELS[c.status]}
              </Badge>
            ),
          },
          {
            header: 'Thao tác',
            className: 'text-right',
            onCellClick: () => {},
            cell: (c) => (
              <ActionBar
                actions={[
                  {
                    icon: 'Pencil',
                    onClick: () => onEdit(c),
                    title: 'Sửa',
                  },
                  {
                    icon: 'Trash2',
                    onClick: () => handleDelete(c),
                    title: 'Xóa',
                    variant: 'danger',
                    disabled: deleteMutation.isPending,
                  },
                ]}
              />
            ),
          },
        ]}
        renderMobileCard={(c) => (
          <div className="mobile-card">
            <div className="mobile-card-header">
              <div className="flex flex-col">
                <span className="mobile-card-title">{c.code}</span>
                <span className="text-sm font-medium">{c.name}</span>
              </div>
              <Badge variant={getStatusVariant(c.status)}>
                {YARN_CATALOG_STATUS_LABELS[c.status]}
              </Badge>
            </div>
            <div className="mobile-card-body space-y-2">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="flex flex-col">
                  <span className="text-xs text-muted">Thành phần</span>
                  <span className="font-medium">{c.composition ?? '—'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted">Xuất xứ</span>
                  <span className="font-medium">{c.origin ?? '—'}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-xs text-muted">Đơn vị</span>
                  <span className="font-medium">{c.unit}</span>
                </div>
              </div>
              {c.color_name && (
                <div className="text-xs text-muted">Màu: {c.color_name}</div>
              )}
              <div className="flex gap-2 pt-2 border-t border-border/10">
                <button
                  className="btn-secondary flex-1 text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(c);
                  }}
                >
                  <Icon name="Pencil" size={16} /> Sửa
                </button>
                <button
                  className="btn-secondary text-danger px-3"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(c);
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Icon name="Trash2" size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      />

      {deleteMutation.error && (
        <p className="error-inline-sm p-4">
          Lỗi: {(deleteMutation.error as Error).message}
        </p>
      )}

      <Pagination result={data} onPageChange={setPage} />
    </div>
  );
}
