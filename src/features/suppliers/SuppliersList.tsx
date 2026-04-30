import { useState } from 'react';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import {
  Icon,
  Badge,
  DataTablePremium,
  AddButton,
  ActionBar,
  FilterBarPremium,
  type FilterFieldConfig,
} from '@/shared/components';
import { useDeleteSupplier, useSuppliersList } from '@/application/crm';
import {
  SUPPLIER_CATEGORIES,
  SUPPLIER_CATEGORY_LABELS,
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
  const { filters, setFilter, clearFilters } = useUrlFilterState([
    'search',
    'category',
    'status',
  ]);
  const [page, setPage] = useState(1);

  const {
    data: result,
    isLoading,
    error,
  } = useSuppliersList(filters as SupplierFilter, page);
  const suppliers = result?.data ?? [];
  const deleteMutation = useDeleteSupplier();
  const { confirm } = useConfirm();

  const hasFilter = !!(filters.search || filters.category || filters.status);

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
      options: SUPPLIER_CATEGORIES.map((cat) => ({
        value: cat,
        label: SUPPLIER_CATEGORY_LABELS[cat],
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

  async function handleDelete(supplier: Supplier) {
    const ok = await confirm({
      message: `Xóa NCC "${supplier.name}"? Hành động này không thể hoàn tác.`,
      variant: 'danger',
    });
    if (!ok) return;
    deleteMutation.mutate(supplier.id);
  }

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
              <p className="kpi-value">{result?.total ?? 0}</p>
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
              <p className="kpi-value">
                {suppliers.filter((s) => s.status === 'active').length}
              </p>
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

      {/* Filter (Config-Driven) */}
      <FilterBarPremium
        schema={filterSchema}
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
            Lỗi: {error instanceof Error ? error.message : String(error)}
          </p>
        </div>
      )}

      {/* Table & Cards */}
      <DataTablePremium
        data={suppliers}
        isLoading={isLoading}
        rowKey={(s) => s.id}
        onRowClick={onEdit}
        emptyStateTitle={
          hasFilter ? 'Không tìm thấy nhà cung cấp' : 'Chưa có nhà cung cấp'
        }
        emptyStateDescription={
          hasFilter
            ? 'Vui lòng thử điều chỉnh lại bộ lọc.'
            : 'Nhấn nút thêm nhà cung cấp mới để lưu trữ thông tin liên hệ.'
        }
        emptyStateIcon={hasFilter ? 'Search' : 'Truck'}
        emptyStateActionLabel={!hasFilter ? '+ Thêm NCC mới' : undefined}
        onEmptyStateAction={!hasFilter ? onNew : undefined}
        columns={[
          {
            header: 'Mã NCC',
            id: 'code',
            sortable: true,
            cell: (s) => (
              <span className="font-bold text-primary">{s.code}</span>
            ),
          },
          {
            header: 'Tên nhà cung cấp',
            id: 'name',
            sortable: true,
            cell: (s) => (
              <div className="flex flex-col">
                <span className="font-bold">{s.name}</span>
                {s.address && (
                  <span className="text-xs text-muted truncate max-w-[250px]">
                    {s.address}
                  </span>
                )}
              </div>
            ),
          },
          {
            header: 'Danh mục',
            id: 'category',
            sortable: true,
            cell: (s) => (
              <span className="badge-outline">
                {SUPPLIER_CATEGORY_LABELS[s.category]}
              </span>
            ),
          },
          {
            header: 'Liên hệ',
            id: 'phone',
            sortable: true,
            className: 'td-muted',
            cell: (s) => (
              <div className="flex flex-col text-sm">
                {s.phone && <span>{s.phone}</span>}
                {s.contact_person && (
                  <span className="text-xs">NLH: {s.contact_person}</span>
                )}
                {!s.phone && !s.contact_person && '—'}
              </div>
            ),
          },
          {
            header: 'Trạng thái',
            id: 'status',
            sortable: true,
            cell: (s) => (
              <Badge variant={s.status === 'active' ? 'success' : 'gray'}>
                {SUPPLIER_STATUS_LABELS[s.status]}
              </Badge>
            ),
          },
          {
            header: 'Thao tác',
            className: 'text-right',
            onCellClick: () => {},
            cell: (s) => (
              <ActionBar
                actions={[
                  {
                    icon: 'FileText',
                    onClick: () => onCreateContract(s),
                    title: 'Tạo hợp đồng',
                  },
                  {
                    icon: 'Pencil',
                    onClick: () => onEdit(s),
                    title: 'Sửa',
                  },
                  {
                    icon: 'Trash2',
                    onClick: () => handleDelete(s),
                    title: 'Xóa',
                    variant: 'danger',
                    disabled: deleteMutation.isPending,
                  },
                ]}
              />
            ),
          },
        ]}
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
                  {SUPPLIER_CATEGORY_LABELS[s.category]}
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
