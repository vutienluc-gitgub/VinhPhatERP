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
import { useColorOptions } from '@/shared/hooks/useColorOptions';
import { getColorHex } from '@/schema/color.schema';
import { YARN_CATALOG_STATUS_LABELS } from '@/schema/yarn-catalog.schema';

import type {
  YarnCatalog,
  YarnCatalogFilter,
  YarnCatalogStatus,
} from './types';

type YarnCatalogListProps = {
  onEdit: (catalog: YarnCatalog) => void;
  onNew: () => void;
};

function getStatusVariant(status: YarnCatalogStatus): BadgeVariant {
  return status === 'active' ? 'success' : 'gray';
}

function YarnColorBadge({ colorName }: { colorName: string | null }) {
  const { data: colorOptions = [] } = useColorOptions();
  if (!colorName) return null;

  const option = colorOptions.find((c) => c.name === colorName);
  const hex = getColorHex(option ? option.code : colorName);

  return (
    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted">
      <span>Màu:</span>
      <span
        title={colorName}
        className="inline-block w-3 h-3 rounded-full border border-border shrink-0 shadow-sm"
        style={{ background: hex }}
      />
      <span>{colorName}</span>
    </div>
  );
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
    {
      key: 'lot_no',
      type: 'search',
      label: 'Mã lô',
      placeholder: 'Tìm theo lô...',
    },
    {
      key: 'grade',
      type: 'search',
      label: 'Phân loại',
      placeholder: 'Loại A, B...',
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
      {/* Action bar */}
      <div className="card-header-area">
        <AddButton onClick={onNew} label="Thêm loại sợi" />
      </div>

      {/* 📊 KPI Dashboard - Premium Visuals */}
      <div className="kpi-section kpi-grid">
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
                <YarnColorBadge colorName={c.color_name} />
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
            header: 'Mã lô',
            id: 'lot_no',
            sortable: true,
            cell: (c) => (
              <span className="text-sm font-mono text-primary">
                {c.lot_no ?? '—'}
              </span>
            ),
          },
          {
            header: 'Loại',
            id: 'grade',
            sortable: true,
            className: 'text-center',
            cell: (c) => (
              <Badge
                variant="gray"
                className="min-w-[40px] justify-center"
                showDot={false}
              >
                {c.grade ?? '—'}
              </Badge>
            ),
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
            header: 'Ghi chú',
            id: 'notes',
            cell: (c) => (
              <span className="text-sm text-muted italic truncate max-w-[200px] block">
                {c.notes ?? '—'}
              </span>
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
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="flex flex-col">
                  <span className="text-xs text-muted">Thành phần</span>
                  <span className="font-medium">{c.composition ?? '—'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted">Xuất xứ</span>
                  <span className="font-medium">{c.origin ?? '—'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted">Mã lô / Loại</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-primary">{c.lot_no}</span>
                    {c.grade && (
                      <span className="text-xs bg-muted px-1.5 rounded">
                        {c.grade}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted">Đơn vị</span>
                  <span className="font-medium">{c.unit}</span>
                </div>
              </div>
              {c.notes && (
                <div className="bg-surface-subtle p-2 rounded text-[11px] text-muted-foreground border-l-2 border-primary/30 italic">
                  {c.notes}
                </div>
              )}
              <YarnColorBadge colorName={c.color_name} />
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
