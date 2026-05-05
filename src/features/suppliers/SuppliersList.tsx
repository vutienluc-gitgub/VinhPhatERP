import { useState, useMemo, useCallback } from 'react';
import type { ColumnDef } from '@tanstack/react-table';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import {
  Icon,
  Badge,
  DataTableAdvanced,
  AddButton,
  ActionMenu,
  FilterBar,
  type FilterFieldConfig,
} from '@/shared/components';
import {
  useDeleteSupplier,
  useSuppliersList,
  useSupplierCategories,
  useSupplierStats,
} from '@/application/crm';
import {
  SUPPLIER_STATUSES,
  SUPPLIER_STATUS_LABELS,
} from '@/schema/supplier.schema';
import { useUrlFilterState } from '@/shared/hooks/useUrlFilterState';

import type { Supplier, SupplierFilter } from './types';

type SuppliersListProps = {
  onEdit: (supplier: Supplier) => void;
  onNew: () => void;
  onCreateContract: (supplier: Supplier) => void;
};

export function SuppliersList({
  onEdit,
  onNew,
  onCreateContract,
}: SuppliersListProps) {
  const { filters, setFilter, clearFilters } = useUrlFilterState(
    ['search', 'category', 'status'] as const,
    { status: 'active' }, // Default: chỉ hiện NCC đang giao dịch
  );
  const [page, setPage] = useState(1);

  const {
    data: result,
    isLoading,
    error,
  } = useSuppliersList(filters as SupplierFilter, page);
  const suppliers = result?.data ?? [];
  const { data: categories = [] } = useSupplierCategories();
  const { data: stats } = useSupplierStats();
  const deleteMutation = useDeleteSupplier();
  const { confirm } = useConfirm();

  // Handler để xóa status filter và hiện tất cả NCC
  const handleViewAll = () => {
    setFilter('status', ''); // Set thành empty string để hiện tất cả
    setPage(1);
  };

  const hasFilter = !!(filters.search || filters.category || filters.status);

  // Kiểm tra xem có phải đang dùng default filter không (status='active' từ default, không phải từ URL)
  const isDefaultActiveFilter =
    filters.status === 'active' &&
    !new URLSearchParams(window.location.search).has('status');

  const showViewAllChip = isDefaultActiveFilter;

  const filterSchema: FilterFieldConfig[] = [
    {
      key: 'search',
      type: 'search',
      label: 'Tìm kiếm',
      placeholder: 'Tên hoặc mã NCC...',
    },
    {
      key: 'category',
      type: 'combobox',
      label: 'Danh mục',
      options: categories.map((cat) => ({
        value: cat.code,
        label: cat.name,
      })),
    },
    {
      key: 'status',
      type: 'combobox',
      label: 'Trạng thái',
      options: SUPPLIER_STATUSES.map((st) => ({
        value: st,
        label: SUPPLIER_STATUS_LABELS[st],
      })),
    },
  ];

  function handleFilterChange(key: string, value: string | undefined) {
    setPage(1);
    setFilter(key, value);
  }

  const handleDelete = useCallback(
    async (supplier: Supplier) => {
      const ok = await confirm({
        message: `Xóa NCC "${supplier.name}"? Hành động này không thể hoàn tác.`,
        variant: 'danger',
      });
      if (!ok) return;
      deleteMutation.mutate(supplier.id);
    },
    [confirm, deleteMutation],
  );

  const columns = useMemo<ColumnDef<Supplier>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Mã NCC',
        cell: ({ row }) => (
          <span className="font-bold text-primary">{row.original.code}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Tên nhà cung cấp',
        cell: ({ row }) => {
          const s = row.original;
          return (
            <div className="flex flex-col">
              <span className="font-bold">{s.name}</span>
              {s.address && (
                <span className="text-xs text-muted truncate max-w-[250px]">
                  {s.address}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'category_name',
        header: 'Danh mục',
        cell: ({ row }) => (
          <span className="badge-outline">
            {row.original.category_name ?? row.original.category}
          </span>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Liên hệ',
        meta: { className: 'td-muted' },
        cell: ({ row }) => {
          const s = row.original;
          return (
            <div className="flex flex-col text-sm">
              {s.phone && <span>{s.phone}</span>}
              {s.contact_person && (
                <span className="text-xs">NLH: {s.contact_person}</span>
              )}
              {!s.phone && !s.contact_person && '—'}
            </div>
          );
        },
      },
      {
        accessorKey: 'performance',
        header: 'Hiệu suất (OTD / Đánh giá)',
        cell: ({ row }) => {
          const s = row.original;
          return (
            <div className="flex flex-col text-sm">
              <span className="font-medium text-emerald-600">
                OTD: {s.on_time_rate ?? 0}%
              </span>
              <span className="text-xs text-muted">
                Đánh giá: {s.rating ?? 0}/5.0
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'credit_limit',
        header: 'Hạn mức',
        cell: ({ row }) => {
          const limit = row.original.credit_limit;
          if (!limit || limit === 0)
            return <span className="text-muted">—</span>;
          // We can format it roughly
          return (
            <span className="font-semibold text-primary">
              {new Intl.NumberFormat('vi-VN').format(limit)}đ
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: ({ row }) => {
          const s = row.original;
          return (
            <Badge variant={s.status === 'active' ? 'success' : 'gray'}>
              {SUPPLIER_STATUS_LABELS[s.status]}
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Thao tác</div>,
        meta: { className: 'text-right' },
        cell: ({ row }) => {
          const s = row.original;
          return (
            <div className="flex justify-end">
              <ActionMenu
                items={[
                  {
                    icon: 'FileText',
                    onClick: () => onCreateContract(s),
                    label: 'Tạo hợp đồng',
                  },
                  {
                    icon: 'Pencil',
                    onClick: () => onEdit(s),
                    label: 'Sửa',
                  },
                  {
                    icon: 'Trash2',
                    onClick: () => handleDelete(s),
                    label: 'Xóa',
                    danger: true,
                    disabled: deleteMutation.isPending,
                    separated: true,
                  },
                ]}
              />
            </div>
          );
        },
      },
    ],
    [onCreateContract, onEdit, handleDelete, deleteMutation.isPending],
  );

  return (
    <div className="panel-card card-flush">
      {/* Action bar */}
      <div className="card-header-area">
        <AddButton onClick={onNew} label="Thêm NCC" />
      </div>

      {/* KPI Dashboard */}
      <div className="kpi-section kpi-grid">
        <div className="kpi-card-premium kpi-primary">
          <div className="kpi-overlay" />
          <div className="kpi-content">
            <div className="kpi-info">
              <p className="kpi-label">Tổng nhà cung cấp</p>
              <p className="kpi-value">{stats?.total ?? result?.total ?? 0}</p>
            </div>
            <div className="kpi-icon-box">
              <Icon name="Truck" size={32} />
            </div>
          </div>
          <div className="kpi-footer text-xs opacity-80 italic">
            Đối tác cung cấp vật tư
          </div>
        </div>

        <div className="kpi-card-premium kpi-success">
          <div className="kpi-overlay" />
          <div className="kpi-content">
            <div className="kpi-info">
              <p className="kpi-label">Đang giao dịch</p>
              <p className="kpi-value">{stats?.active ?? 0}</p>
            </div>
            <div className="kpi-icon-box">
              <Icon name="CheckCircle" size={32} />
            </div>
          </div>
          <div className="kpi-footer text-xs opacity-80 italic">
            Trạng thái hoạt động
          </div>
        </div>
      </div>

      {/* Filter (Config-Driven) + View All Chip */}
      <div className="flex flex-wrap items-start gap-3 px-4 py-3 border-b border-border/50 overflow-visible">
        <FilterBar
          variant="inline"
          schema={filterSchema}
          value={filters}
          onChange={handleFilterChange}
          onClear={() => {
            clearFilters();
            setPage(1);
          }}
        />
        {showViewAllChip && (
          <button
            onClick={handleViewAll}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors h-9"
            title="Hiển thị tất cả nhà cung cấp"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium">Đang giao dịch</span>
            <span className="mx-1 text-emerald-300">|</span>
            <span className="text-emerald-600 hover:text-emerald-800 underline underline-offset-2">
              Xem tất cả
            </span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4">
          <p className="error-inline">
            Lỗi: {error instanceof Error ? error.message : String(error)}
          </p>
        </div>
      )}

      {/* Table & Cards */}
      <DataTableAdvanced
        data={suppliers}
        isLoading={isLoading}
        rowKey={(s) => s.id}
        onRowClick={onEdit}
        emptyStateTitle={
          isDefaultActiveFilter
            ? 'Không có nhà cung cấp đang giao dịch'
            : hasFilter
              ? 'Không tìm thấy nhà cung cấp'
              : 'Chưa có nhà cung cấp'
        }
        emptyStateDescription={
          isDefaultActiveFilter
            ? 'Tất cả nhà cung cấp hiện đang ở trạng thái không hoạt động. Bạn có thể xem tất cả hoặc thêm mới.'
            : hasFilter
              ? 'Vui lòng thử điều chỉnh lại bộ lọc.'
              : 'Nhấn nút thêm nhà cung cấp mới để lưu trữ thông tin liên hệ.'
        }
        emptyStateIcon={isDefaultActiveFilter || hasFilter ? 'Search' : 'Truck'}
        emptyStateActionLabel={
          isDefaultActiveFilter
            ? 'Xem tất cả'
            : !hasFilter
              ? '+ Thêm NCC mới'
              : undefined
        }
        onEmptyStateAction={
          isDefaultActiveFilter ? handleViewAll : !hasFilter ? onNew : undefined
        }
        columns={columns}
        exportFileName="danh_sach_ncc"
        renderMobileCard={(s) => (
          <div className="mobile-card">
            <div className="mobile-card-header">
              <span className="mobile-card-title">{s.code}</span>
              <Badge variant={s.status === 'active' ? 'success' : 'gray'}>
                {SUPPLIER_STATUS_LABELS[s.status]}
              </Badge>
            </div>
            <div className="mobile-card-body space-y-2">
              <p className="font-bold text-lg">{s.name}</p>

              <div className="grid grid-cols-2 gap-2 text-sm">
                {s.phone && (
                  <div className="flex items-center gap-2 text-muted">
                    <Icon name="Phone" size={16} />
                    <span>{s.phone}</span>
                  </div>
                )}
                {s.contact_person && (
                  <div className="flex items-center gap-2 text-muted">
                    <Icon name="User" size={16} />
                    <span>{s.contact_person}</span>
                  </div>
                )}
              </div>

              {s.address && (
                <div className="flex items-start gap-2 text-xs text-muted mt-1">
                  <Icon
                    name="MapPin"
                    size={16}
                    className="mt-0.5 flex-shrink-0"
                  />
                  <span className="truncate">{s.address}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 mt-2 border-t border-border/10">
                <span className="text-[10px] uppercase font-bold text-muted bg-surface-subtle px-1.5 py-0.5 rounded">
                  {s.category_name ?? s.category}
                </span>
                <Icon name="ChevronRight" size={16} className="text-muted" />
              </div>
            </div>
          </div>
        )}
        pagination={{
          result,
          onPageChange: setPage,
          itemLabel: 'nhà cung cấp',
        }}
      />
    </div>
  );
}
