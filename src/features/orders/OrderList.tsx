import { useState } from 'react';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import { Pagination } from '@/shared/components/Pagination';
import { Combobox } from '@/shared/components/Combobox';
import {
  Icon,
  Badge,
  type BadgeVariant,
  DataTablePremium,
} from '@/shared/components';
import { formatCurrency } from '@/shared/utils/format';

import { ORDER_STATUS_LABELS } from './orders.module';
import type { Order, OrdersFilter, OrderStatus } from './types';
import { useDeleteOrder, useOrderList } from './useOrders';

type OrderListProps = {
  onEdit: (order: Order) => void;
  onNew: () => void;
  onView: (order: Order) => void;
};

function getVariant(status: OrderStatus): BadgeVariant {
  switch (status) {
    case 'confirmed':
      return 'info';
    case 'in_progress':
      return 'purple';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'danger';
    default:
      return 'gray';
  }
}

function daysUntilDelivery(
  deliveryDate: string | null,
): { text: string; urgent: boolean } | null {
  if (!deliveryDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const delivery = new Date(deliveryDate);
  const diff = Math.ceil(
    (delivery.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diff < 0)
    return {
      text: `Trễ ${Math.abs(diff)} ngày`,
      urgent: true,
    };
  if (diff === 0)
    return {
      text: 'Hôm nay',
      urgent: true,
    };
  if (diff <= 3)
    return {
      text: `Còn ${diff} ngày`,
      urgent: true,
    };
  return {
    text: `Còn ${diff} ngày`,
    urgent: false,
  };
}

export function OrderList({ onEdit, onNew, onView }: OrderListProps) {
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<OrdersFilter>({});
  const [page, setPage] = useState(1);

  const { data: result, isLoading, error } = useOrderList(filters, page);
  const orders = result?.data ?? [];
  const deleteMutation = useDeleteOrder();
  const { confirm, alert: showAlert } = useConfirm();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      search: searchInput.trim() || undefined,
    }));
  }

  async function handleDelete(order: Order) {
    if (order.status !== 'draft') {
      await showAlert('Chỉ có thể xoá đơn hàng ở trạng thái Nháp.');
      return;
    }
    const ok = await confirm({
      message: `Xóa đơn hàng "${order.order_number}"? Hành động này không thể hoàn tác.`,
      variant: 'danger',
    });
    if (!ok) return;
    deleteMutation.mutate(order.id);
  }

  const hasFilter = !!(filters.search || filters.status);

  return (
    <div className="panel-card card-flush">
      {/* Header Area */}
      <div className="card-header-area card-header-premium">
        <div>
          <p className="eyebrow-premium">BÁN HÀNG</p>
          <h3 className="title-premium">Quản lý Đơn hàng</h3>
        </div>

        <button
          className="btn-primary"
          type="button"
          onClick={onNew}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            minHeight: 42,
            padding: '0 1.25rem',
          }}
        >
          <Icon name="Plus" size={18} /> Tạo đơn hàng
        </button>
      </div>

      {/* 📊 KPI Dashboard - Premium Visuals */}
      <div className="kpi-grid p-4 md:p-6 bg-surface-subtle border-b border-border">
        <div className="kpi-card-premium kpi-primary">
          <div className="kpi-overlay" />
          <div className="kpi-content">
            <div className="kpi-info">
              <p className="kpi-label">Đơn hàng mới</p>
              <p className="kpi-value">{orders.length}</p>
            </div>
            <div className="kpi-icon-box">
              <Icon name="ShoppingCart" size={32} />
            </div>
          </div>
          <div className="kpi-footer text-xs opacity-80 italic">
            Đơn hàng trong kỳ hiện tại
          </div>
        </div>

        <div className="kpi-card-premium kpi-success">
          <div className="kpi-overlay" />
          <div className="kpi-content">
            <div className="kpi-info">
              <p className="kpi-label">Doanh thu dự kiến</p>
              <div className="flex items-baseline gap-1">
                <p className="kpi-value">
                  {formatCurrency(
                    orders.reduce((sum, o) => sum + o.total_amount, 0),
                  ).replace(' đ', '')}
                </p>
                <span className="text-lg font-bold opacity-80">đ</span>
              </div>
            </div>
            <div className="kpi-icon-box">
              <Icon name="Banknote" size={32} />
            </div>
          </div>
          <div className="kpi-footer text-xs opacity-80 italic">
            Tổng giá trị đơn hiển thị
          </div>
        </div>

        <div className="kpi-card-premium kpi-danger">
          <div className="kpi-overlay" />
          <div className="kpi-content">
            <div className="kpi-info">
              <p className="kpi-label">Tổng công nợ</p>
              <div className="flex items-baseline gap-1">
                <p className="kpi-value">
                  {formatCurrency(
                    orders.reduce(
                      (sum, o) =>
                        sum + Math.max(0, o.total_amount - o.paid_amount),
                      0,
                    ),
                  ).replace(' đ', '')}
                </p>
                <span className="text-lg font-bold opacity-80">đ</span>
              </div>
            </div>
            <div className="kpi-icon-box">
              <Icon name="AlertCircle" size={32} strokeWidth={2} />
            </div>
          </div>
          <div className="kpi-footer text-xs opacity-80 italic">
            Số tiền khách còn nợ
          </div>
        </div>
      </div>

      {/* 🔍 Filter Bar */}
      <div className="filter-bar card-filter-section p-4 border-b border-border">
        <div className="filter-compact-premium">
          <div className="filter-field">
            <label>Tìm kiếm khách hàng / Số đơn</label>
            <form className="search-input-wrapper" onSubmit={handleSearch}>
              <input
                className="field-input"
                type="text"
                placeholder="Nhập mã đơn hoặc tên khách..."
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
                {
                  value: '',
                  label: 'Tất cả trạng thái',
                },
                ...Object.entries(ORDER_STATUS_LABELS).map(
                  ([value, label]) => ({
                    value,
                    label,
                  }),
                ),
              ]}
              value={filters.status ?? ''}
              onChange={(val) => {
                setPage(1);
                setFilters((prev) => ({
                  ...prev,
                  status: (val as OrderStatus) || undefined,
                }));
              }}
            />
          </div>

          {hasFilter && (
            <button
              className="btn-secondary text-danger flex items-center gap-2"
              type="button"
              onClick={() => {
                setFilters({});
                setSearchInput('');
                setPage(1);
              }}
              style={{ marginBottom: 4 }}
            >
              <Icon name="X" size={14} /> Xóa lọc
            </button>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4">
          <p className="error-inline">
            Lỗi tải dữ liệu: {(error as Error).message}
          </p>
        </div>
      )}

      {/* 📑 Data Table / List */}
      <DataTablePremium
        data={orders}
        isLoading={isLoading}
        rowKey={(o) => o.id}
        onRowClick={onView}
        emptyStateTitle={
          hasFilter ? 'Không tìm thấy đơn hàng' : 'Chưa có đơn hàng nào'
        }
        emptyStateDescription={
          hasFilter
            ? 'Hãy thử thay đổi điều kiện lọc.'
            : 'Nhấn nút tạo đơn để bắt đầu.'
        }
        emptyStateIcon={hasFilter ? '🔍' : '📦'}
        emptyStateActionLabel={!hasFilter ? '+ Tạo đơn hàng' : undefined}
        onEmptyStateAction={!hasFilter ? onNew : undefined}
        columns={[
          {
            header: 'Số đơn / Khách hàng',
            cell: (order) => (
              <div className="flex flex-col">
                <span className="font-bold text-primary">
                  {order.order_number}
                </span>
                <span className="text-sm">
                  {order.customers?.name ?? '—'}
                  {order.customers?.code && (
                    <span className="text-xs text-muted ml-1 italic">
                      ({order.customers.code})
                    </span>
                  )}
                </span>
              </div>
            ),
          },
          {
            header: 'Ngày đặt',
            className: 'text-muted text-sm',
            cell: (order) => order.order_date,
          },
          {
            header: 'Dự kiến giao',
            cell: (order) => {
              const due = daysUntilDelivery(order.delivery_date);
              return (
                <div className="flex flex-col">
                  <span className="text-sm">{order.delivery_date ?? '—'}</span>
                  {due && (
                    <span
                      className={`text-[10px] font-bold uppercase ${due.urgent ? 'text-danger animate-pulse' : 'text-muted'}`}
                    >
                      {due.text}
                    </span>
                  )}
                </div>
              );
            },
          },
          {
            header: 'Tổng tiền',
            className: 'text-right numeric-cell font-medium',
            cell: (order) => formatCurrency(order.total_amount),
          },
          {
            header: 'Còn nợ',
            className: 'text-right numeric-cell font-bold',
            cell: (order) => {
              const balanceDue = order.total_amount - order.paid_amount;
              return (
                <span
                  className={balanceDue > 0 ? 'text-danger' : 'text-success'}
                >
                  {formatCurrency(balanceDue)}
                </span>
              );
            },
          },
          {
            header: 'Trạng thái',
            cell: (order) => (
              <Badge variant={getVariant(order.status)}>
                {ORDER_STATUS_LABELS[order.status]}
              </Badge>
            ),
          },
          {
            header: 'Thao tác',
            className: 'text-right',
            onCellClick: () => {}, // prevent row click
            cell: (order) => (
              <div className="flex justify-end gap-1">
                {order.status === 'draft' ? (
                  <>
                    <button className="btn-icon" onClick={() => onEdit(order)}>
                      <Icon name="Edit3" size={16} />
                    </button>
                    <button
                      className="btn-icon text-danger"
                      onClick={() => handleDelete(order)}
                    >
                      <Icon name="Trash2" size={16} />
                    </button>
                  </>
                ) : (
                  <button className="btn-icon" onClick={() => onView(order)}>
                    <Icon name="Eye" size={16} />
                  </button>
                )}
              </div>
            ),
          },
        ]}
        renderMobileCard={(order) => {
          const due = daysUntilDelivery(order.delivery_date);
          const balanceDue = order.total_amount - order.paid_amount;
          return (
            <div className="mobile-card">
              <div className="mobile-card-header border-b border-border/10 pb-2 mb-2">
                <span className="font-bold text-primary">
                  {order.order_number}
                </span>
                <Badge variant={getVariant(order.status)}>
                  {ORDER_STATUS_LABELS[order.status]}
                </Badge>
              </div>
              <div className="mobile-card-body space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-bold">
                    {order.customers?.name}
                  </span>
                  <span className="text-xs text-muted">{order.order_date}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-muted">
                      Tổng tiền
                    </span>
                    <span className="text-sm font-medium">
                      {formatCurrency(order.total_amount)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-muted">
                      Còn nợ
                    </span>
                    <span
                      className={`text-sm font-bold ${balanceDue > 0 ? 'text-danger' : 'text-success'}`}
                    >
                      {formatCurrency(balanceDue)}
                    </span>
                  </div>
                </div>
                {due && (
                  <div
                    className={`mt-2 p-1.5 rounded text-[10px] font-bold text-center uppercase ${due.urgent ? 'bg-danger/10 text-danger' : 'bg-surface-subtle text-muted'}`}
                  >
                    Giao hàng: {due.text} ({order.delivery_date})
                  </div>
                )}
              </div>
            </div>
          );
        }}
      />

      <Pagination result={result} onPageChange={setPage} />
    </div>
  );
}
