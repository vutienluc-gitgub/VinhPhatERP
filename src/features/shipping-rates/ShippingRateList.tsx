import { useState } from 'react';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import {
  Icon,
  Badge,
  type BadgeVariant,
  DataTablePremium,
} from '@/shared/components';
import { formatCurrency } from '@/shared/utils/format';

import type { ShippingRate, ShippingRateFilter } from './types';
import { useDeleteShippingRate, useShippingRateList } from './useShippingRates';

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
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<ShippingRateFilter>({});

  const { data, isLoading, error } = useShippingRateList(filters);
  const rates = data ?? [];
  const deleteMutation = useDeleteShippingRate();
  const { confirm } = useConfirm();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setFilters((prev) => ({
      ...prev,
      query: searchInput.trim() || undefined,
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
        <button
          className="btn-primary min-h-[42px] px-5"
          type="button"
          onClick={onNew}
        >
          <Icon name="Plus" size={18} className="mr-2" /> Thêm bảng giá
        </button>
      </div>

      {/* Filters */}
      <div className="filter-bar card-filter-section p-4 border-b border-border">
        <div className="filter-compact-premium">
          <div className="filter-field">
            <label htmlFor="filter-rate-search">Tìm kiếm</label>
            <form className="search-input-wrapper" onSubmit={handleSearch}>
              <input
                id="filter-rate-search"
                className="field-input"
                type="text"
                placeholder="Tên hoặc khu vực..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <button type="submit" className="hidden" />
              <Icon name="Search" size={16} className="search-input-icon" />
            </form>
          </div>

          {hasFilter && (
            <button
              className="btn-secondary text-danger border-danger/20 flex items-center gap-2"
              type="button"
              onClick={() => {
                setFilters({});
                setSearchInput('');
              }}
              style={{ marginBottom: '4px' }}
            >
              <Icon name="X" size={14} /> Xóa lọc
            </button>
          )}
        </div>
      </div>

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
        emptyStateIcon={hasFilter ? '🔍' : 'Truck'}
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
              <div className="flex justify-end gap-1">
                <button
                  className="btn-icon"
                  type="button"
                  onClick={() => onEdit(item)}
                  title="Sửa"
                >
                  <Icon name="Pencil" size={16} />
                </button>
                <button
                  className="btn-icon text-danger hover:bg-danger/10"
                  type="button"
                  onClick={() => {
                    void handleDelete(item);
                  }}
                  disabled={deleteMutation.isPending}
                  title="Xoá"
                >
                  <Icon name="Trash2" size={16} />
                </button>
              </div>
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
