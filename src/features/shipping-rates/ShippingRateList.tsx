import { useState } from 'react';

import { useConfirm } from '@/shared/components/ConfirmDialog';
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
import { formatCurrency } from '@/shared/utils/format';
import {
  useDeleteShippingRate,
  useShippingRateList,
} from '@/application/shipments';

import type { ShippingRate, ShippingRateFilter } from './types';

type Props = {
  onEdit: (item: ShippingRate) => void;
  onNew: () => void;
};

function rateDescription(item: ShippingRate): string {
  const parts: string[] = [];
  if (item.rate_per_trip != null)
    parts.push(`${formatCurrency(item.rate_per_trip)}đ/chuyến`);
  if (item.rate_per_meter != null)
    parts.push(`${formatCurrency(item.rate_per_meter)}đ/m`);
  if (item.rate_per_kg != null)
    parts.push(`${formatCurrency(item.rate_per_kg)}đ/kg`);
  if (item.loading_fee > 0)
    parts.push(`Bốc xếp: ${formatCurrency(item.loading_fee)}đ`);
  return parts.length > 0 ? parts.join(' · ') : '—';
}

function getStatusVariant(isActive: boolean): BadgeVariant {
  return isActive ? 'success' : 'gray';
}

export function ShippingRateList({ onEdit, onNew }: Props) {
  const [filters, setFilters] = useState<ShippingRateFilter>({});

  const { data, isLoading, error } = useShippingRateList(filters);
  const rates = data ?? [];
  const deleteMutation = useDeleteShippingRate();
  const { confirm } = useConfirm();

  const filterSchema: FilterFieldConfig[] = [
    {
      key: 'query',
      type: 'search',
      label: 'Tìm kiếm',
      placeholder: 'Tên hoặc khu vực...',
    },
  ];

  function handleFilterChange(key: string, value: string | undefined) {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  }

  async function handleDelete(item: ShippingRate) {
    const ok = await confirm({
      message: `Xoá bảng giá "${item.name}"?`,
      variant: 'danger',
    });
    if (!ok) return;
    deleteMutation.mutate(item.id);
  }

  const hasFilter = !!filters.query;

  return (
    <div className="panel-card card-flush">
      {/* Header */}
      <div className="card-header-area card-header-premium">
        <div>
          <p className="eyebrow-premium">VẬN CHUYỂN</p>
          <h3 className="title-premium">Giá Cước Vận Chuyển</h3>
        </div>
        <AddButton onClick={onNew} label="Thêm bảng giá" />
      </div>

      {/* Filters */}
      <FilterBarPremium
        schema={filterSchema}
        value={filters}
        onChange={handleFilterChange}
        onClear={() => {
          setFilters({});
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
        data={rates}
        isLoading={isLoading}
        rowKey={(item) => item.id}
        onRowClick={(item) => onEdit(item)}
        emptyStateTitle={
          hasFilter
            ? 'Không tìm thấy bảng giá phù hợp'
            : 'Chưa có bảng giá cước nào'
        }
        emptyStateDescription={
          hasFilter
            ? 'Thử điều chỉnh bộ lọc.'
            : 'Bấm "+ Thêm bảng giá" để tạo giá cước vận chuyển.'
        }
        emptyStateIcon={hasFilter ? 'Search' : 'Truck'}
        emptyStateActionLabel={!hasFilter ? '+ Thêm bảng giá' : undefined}
        onEmptyStateAction={!hasFilter ? onNew : undefined}
        columns={[
          {
            header: 'Tên bảng giá',
            cell: (item) => (
              <span className="font-bold text-primary">{item.name}</span>
            ),
          },
          {
            header: 'Khu vực',
            cell: (item) => (
              <span className="font-medium">{item.destination_area}</span>
            ),
          },
          {
            header: 'Giá cước',
            cell: (item) => (
              <span className="text-sm text-muted">
                {rateDescription(item)}
              </span>
            ),
          },
          {
            header: 'Phí tối thiểu',
            cell: (item) => (
              <span className="font-medium">
                {item.min_charge > 0
                  ? `${formatCurrency(item.min_charge)}đ`
                  : '—'}
              </span>
            ),
          },
          {
            header: 'Trạng thái',
            cell: (item) => (
              <Badge variant={getStatusVariant(item.is_active)}>
                {item.is_active ? 'Đang dùng' : 'Ngừng'}
              </Badge>
            ),
          },
          {
            header: 'Thao tác',
            className: 'text-right',
            onCellClick: () => {},
            cell: (item) => (
              <ActionBar
                actions={[
                  {
                    icon: 'Pencil',
                    onClick: () => onEdit(item),
                    title: 'Sửa',
                  },
                  {
                    icon: 'Trash2',
                    onClick: () => {
                      void handleDelete(item);
                    },
                    title: 'Xoá',
                    variant: 'danger',
                    disabled: deleteMutation.isPending,
                  },
                ]}
              />
            ),
          },
        ]}
        renderMobileCard={(item) => (
          <div className="mobile-card">
            <div className="mobile-card-header">
              <span className="mobile-card-title">{item.name}</span>
              <Badge variant={getStatusVariant(item.is_active)}>
                {item.is_active ? 'Đang dùng' : 'Ngừng'}
              </Badge>
            </div>
            <div className="mobile-card-body space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex flex-col">
                  <span className="text-xs text-muted">Khu vực</span>
                  <span className="font-bold">{item.destination_area}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-xs text-muted">Phí tối thiểu</span>
                  <span className="font-medium">
                    {item.min_charge > 0
                      ? formatCurrency(item.min_charge)
                      : '—'}
                  </span>
                </div>
              </div>
              <div className="text-xs text-muted">{rateDescription(item)}</div>
              <div className="flex gap-2 pt-2 border-t border-border/10">
                <button
                  className="btn-secondary flex-1 text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(item);
                  }}
                >
                  <Icon name="Pencil" size={16} /> Sửa
                </button>
                <button
                  className="btn-secondary text-danger border-danger/20 px-3"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleDelete(item);
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
        <p className="error-inline-sm">
          Lỗi: {(deleteMutation.error as Error).message}
        </p>
      )}
    </div>
  );
}
