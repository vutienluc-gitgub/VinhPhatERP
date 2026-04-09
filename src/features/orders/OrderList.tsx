import { useState } from 'react';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import { EmptyState } from '@/shared/components/EmptyState';
import { Pagination } from '@/shared/components/Pagination';
import { TableSkeleton } from '@/shared/components/TableSkeleton';
import { Icon } from '@/shared/components/Icon';
import { formatCurrency } from '@/shared/utils/format';

import { ORDER_STATUS_LABELS } from './orders.module';
import type { Order, OrdersFilter, OrderStatus } from './types';
import { useDeleteOrder, useOrderList } from './useOrders';

type OrderListProps = {
  onEdit: (order: Order) => void;
  onNew: () => void;
  onView: (order: Order) => void;
};

function statusClass(status: OrderStatus): string {
  switch (status) {
    case 'confirmed':
      return 'reserved';
    case 'in_progress':
      return 'in_process';
    case 'completed':
      return 'in_stock';
    case 'cancelled':
      return 'damaged';
    default:
      return 'shipped';
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

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value as OrderStatus | '';
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      status: val || undefined,
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

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <button
            className="btn-primary"
            type="button"
            onClick={onNew}
            style={{
              minHeight: '42px',
              padding: '0 1.25rem',
            }}
          >
            + Tạo đơn hàng
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="stats-grid-premium">
        <div className="stat-item-premium">
          <div
            className="stat-icon-wrapper"
            style={{
              background: 'rgba(11, 107, 203, 0.1)',
              color: 'var(--primary)',
            }}
          >
            <Icon name="ShoppingCart" size={24} />
          </div>
          <div className="stat-content-premium">
            <p>Đơn hàng (Trang hiện tại)</p>
            <p>{orders.length}</p>
          </div>
        </div>

        <div className="stat-item-premium">
          <div
            className="stat-icon-wrapper"
            style={{
              background: 'rgba(10, 128, 92, 0.1)',
              color: 'var(--success)',
            }}
          >
            <Icon name="Banknote" size={24} />
          </div>
          <div className="stat-content-premium">
            <p>Doanh số trang</p>
            <p>
              {formatCurrency(
                orders.reduce((sum, o) => sum + o.total_amount, 0),
              ).replace(' đ', '')}
              <span
                style={{
                  fontSize: '1rem',
                  fontWeight: 500,
                  marginLeft: '0.2rem',
                }}
              >
                đ
              </span>
            </p>
          </div>
        </div>

        <div className="stat-item-premium">
          <div
            className="stat-icon-wrapper"
            style={{
              background: 'rgba(225, 29, 72, 0.1)',
              color: '#e11d48',
            }}
          >
            <Icon name="AlertCircle" size={24} />
          </div>
          <div className="stat-content-premium">
            <p>Công nợ trang</p>
            <p style={{ color: '#be123c' }}>
              {formatCurrency(
                orders.reduce(
                  (sum, o) => sum + Math.max(0, o.total_amount - o.paid_amount),
                  0,
                ),
              ).replace(' đ', '')}
              <span
                style={{
                  fontSize: '1rem',
                  fontWeight: 500,
                  marginLeft: '0.2rem',
                }}
              >
                đ
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="filter-bar card-filter-section">
        <div className="filter-grid-premium">
          <div className="filter-field">
            <label>Tìm kiếm</label>
            <form className="search-input-wrapper" onSubmit={handleSearch}>
              <input
                className="field-input"
                type="text"
                placeholder="Số đơn hàng..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onBlur={handleSearch}
              />
              <button type="submit" style={{ display: 'none' }}></button>
              <Icon name="Search" size={16} className="search-input-icon" />
            </form>
          </div>

          <div className="filter-field">
            <label>Trạng thái</label>
            <select
              className="field-select"
              value={filters.status ?? ''}
              onChange={handleStatusChange}
            >
              <option value="">Tất cả</option>
              <option value="draft">Nháp</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="in_progress">Đang xử lý</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancelled">Đã huỷ</option>
            </select>
          </div>
        </div>

        {hasFilter && (
          <button
            className="btn-secondary"
            type="button"
            onClick={() => {
              setFilters({});
              setSearchInput('');
              setPage(1);
            }}
            style={{
              marginTop: '1rem',
              color: 'var(--danger)',
              borderColor: 'rgba(192, 57, 43, 0.2)',
            }}
          >
            <Icon name="X" size={14} /> Xóa lọc nhanh
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="error-inline">
          Lỗi tải dữ liệu: {(error as Error).message}
        </p>
      )}

      {/* Table */}
      <div
        className="data-table-wrap card-table-section"
        style={
          isLoading || orders.length === 0 ? { border: 'none' } : undefined
        }
      >
        {isLoading ? (
          <TableSkeleton rows={5} columns={7} />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={hasFilter ? '🔍' : '📦'}
            title={
              hasFilter ? 'Không tìm thấy đơn hàng' : 'Chưa có đơn hàng nào'
            }
            description={
              hasFilter
                ? 'Hãy thử thay đổi điều kiện lọc.'
                : 'Nhấn nút tạo đơn để bắt đầu quy trình bán hàng mới.'
            }
            actionLabel={!hasFilter ? '+ Tạo đơn hàng' : undefined}
            actionClick={!hasFilter ? onNew : undefined}
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Khách hàng</th>
                <th>Ngày đặt</th>
                <th className="hide-mobile">Giao hàng</th>
                <th className="text-right hide-mobile">Tổng tiền</th>
                <th className="text-right">Còn nợ</th>
                <th className="hide-mobile">Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const due = daysUntilDelivery(order.delivery_date);
                const balanceDue = order.total_amount - order.paid_amount;
                return (
                  <tr
                    key={order.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onView(order)}
                  >
                    <td>
                      <strong>{order.order_number}</strong>
                      <div>
                        {order.customers?.name ?? '—'}
                        {order.customers?.code && (
                          <span
                            className="td-muted"
                            style={{
                              fontSize: '0.8rem',
                              marginLeft: '0.3rem',
                            }}
                          >
                            {order.customers.code}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="td-muted">{order.order_date}</td>
                    <td className="hide-mobile">
                      {order.delivery_date ?? '—'}
                      {due && (
                        <div
                          style={{
                            fontSize: '0.78rem',
                            color: due.urgent ? '#c0392b' : 'var(--muted)',
                          }}
                        >
                          {due.text}
                        </div>
                      )}
                    </td>
                    <td className="numeric-cell hide-mobile">
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td
                      className={
                        balanceDue > 0 ? 'numeric-debt' : 'numeric-paid'
                      }
                    >
                      {formatCurrency(balanceDue)}
                    </td>
                    <td className="hide-mobile">
                      <span
                        className={`roll-status ${statusClass(order.status)}`}
                      >
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td
                      className="td-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.25rem',
                          justifyContent: 'flex-end',
                        }}
                      >
                        {order.status === 'draft' ? (
                          <>
                            <button
                              className="btn-icon"
                              type="button"
                              title="Sửa"
                              onClick={() => onEdit(order)}
                            >
                              <Icon name="Edit3" size={16} />
                            </button>
                            <button
                              className="btn-icon danger"
                              type="button"
                              title="Xóa"
                              onClick={() => handleDelete(order)}
                              disabled={deleteMutation.isPending}
                            >
                              <Icon name="Trash2" size={16} />
                            </button>
                          </>
                        ) : (
                          <button
                            className="btn-icon"
                            type="button"
                            title="Xem chi tiết"
                            onClick={() => onView(order)}
                          >
                            <Icon name="Eye" size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Pagination result={result} onPageChange={setPage} />
    </div>
  );
}
