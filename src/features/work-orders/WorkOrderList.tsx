import { useState } from 'react';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import { EmptyState } from '@/shared/components/EmptyState';
import { TableSkeleton } from '@/shared/components/TableSkeleton';

import type { WorkOrderFilter, WorkOrderStatus } from './types';
import { useWorkOrders, useStartWorkOrder } from './useWorkOrders';
import { WORK_ORDER_STATUSES } from './work-orders.module';

interface WorkOrderListProps {
  onView: (id: string) => void;
  onEdit: (wo: any) => void;
  onCreate: () => void;
}

export function WorkOrderList({
  onView,
  onEdit,
  onCreate,
}: WorkOrderListProps) {
  const [filter, setFilter] = useState<WorkOrderFilter>({
    status: 'all',
    search: '',
  });
  const [page, setPage] = useState(1);

  const { data, isLoading } = useWorkOrders(filter, page, 20);
  const startMutation = useStartWorkOrder();
  const { confirm } = useConfirm();

  const orders = data?.data ?? [];
  const hasFilter = !!(
    filter.search ||
    (filter.status && filter.status !== 'all')
  );

  const handleStart = async (id: string) => {
    const ok = await confirm({
      message: 'Bắt đầu lệnh dệt này?',
      variant: 'danger',
    });
    if (ok) startMutation.mutate(id);
  };

  return (
    <div className="panel-card card-flush">
      {/* Header */}
      <div className="card-header-area">
        <div className="page-header">
          <div>
            <p className="eyebrow">Dây chuyền sản xuất</p>
            <h3>Quản Lý Lệnh Sản Xuất</h3>
            <p
              style={{
                fontSize: '0.82rem',
                color: 'var(--muted)',
                marginTop: '0.25rem',
              }}
            >
              Điều phối quy trình dệt mộc và tự động cấp phát định mức nguyên
              liệu theo BOM
            </p>
          </div>
          <button
            className="primary-button btn-standard"
            type="button"
            onClick={onCreate}
          >
            + Kiến tạo Lệnh Sản Xuất
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar card-filter-section">
        <div className="filter-field" style={{ flex: '1 1 220px' }}>
          <label htmlFor="wo-search">Tìm theo mã lệnh</label>
          <input
            id="wo-search"
            className="field-input"
            type="text"
            placeholder="Nhập mã lệnh dệt để tìm..."
            value={filter.search}
            onChange={(e) =>
              setFilter((f) => ({
                ...f,
                search: e.target.value,
              }))
            }
          />
        </div>

        <div className="filter-field">
          <label htmlFor="wo-status">Lọc trạng thái</label>
          <select
            id="wo-status"
            className="field-select"
            value={filter.status || 'all'}
            onChange={(e) =>
              setFilter((f) => ({
                ...f,
                status: e.target.value as WorkOrderStatus | 'all',
              }))
            }
          >
            <option value="all">Tất cả</option>
            <option value="draft">Bản nháp</option>
            <option value="in_progress">Đang sản xuất</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>

        {hasFilter && (
          <button
            className="btn-secondary"
            type="button"
            onClick={() =>
              setFilter({
                status: 'all',
                search: '',
              })
            }
            style={{ alignSelf: 'flex-end' }}
          >
            ✕ Xóa lọc
          </button>
        )}
      </div>

      {/* Table */}
      <div
        className="data-table-wrap card-table-section"
        style={
          isLoading || orders.length === 0 ? { border: 'none' } : undefined
        }
      >
        {isLoading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={hasFilter ? '🔍' : '🏭'}
            title={
              hasFilter
                ? 'Không tìm thấy lệnh sản xuất'
                : 'Chưa có lệnh sản xuất nào'
            }
            description={
              hasFilter
                ? 'Thử thay đổi điều kiện lọc.'
                : 'Nhấn nút "Kiến tạo" để bắt đầu.'
            }
            actionLabel={!hasFilter ? '+ Kiến tạo Lệnh SX' : undefined}
            actionClick={!hasFilter ? onCreate : undefined}
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã Lệnh</th>
                <th className="hide-mobile">Công Thức (BOM)</th>
                <th>Đối tác dệt</th>
                <th className="text-right">Mục Tiêu</th>
                <th>Trạng Thái</th>
                <th className="hide-mobile">Bắt Đầu</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((wo) => {
                const statusConfig = WORK_ORDER_STATUSES[wo.status];
                return (
                  <tr
                    key={wo.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onView(wo.id)}
                  >
                    <td>
                      <strong>{wo.work_order_number}</strong>
                      {wo.order && (
                        <div
                          className="td-muted"
                          style={{ fontSize: '0.78rem' }}
                        >
                          {wo.order.order_number}
                        </div>
                      )}
                    </td>
                    <td className="hide-mobile">
                      <strong>{wo.bom_template?.code}</strong>
                      <div className="td-muted" style={{ fontSize: '0.78rem' }}>
                        V{wo.bom_version}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{wo.supplier?.name}</div>
                      <div className="td-muted" style={{ fontSize: '0.78rem' }}>
                        {wo.weaving_unit_price.toLocaleString()}đ/m
                      </div>
                    </td>
                    <td
                      className="text-right"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      <strong>{wo.target_quantity_m.toLocaleString()} m</strong>
                      {wo.target_weight_kg && (
                        <div
                          className="td-muted"
                          style={{ fontSize: '0.78rem' }}
                        >
                          ~{wo.target_weight_kg.toLocaleString()} kg
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`roll-status ${wo.status}`}>
                        {statusConfig?.label || wo.status}
                      </span>
                    </td>
                    <td className="hide-mobile td-muted">
                      {wo.start_date
                        ? new Date(wo.start_date).toLocaleDateString('vi-VN')
                        : '—'}
                    </td>
                    <td
                      className="td-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="btn-icon"
                        type="button"
                        onClick={() => onView(wo.id)}
                        title="Chi tiết"
                      >
                        👁
                      </button>
                      {wo.status === 'draft' && (
                        <button
                          className="btn-icon"
                          type="button"
                          onClick={() => onEdit(wo)}
                          title="Sửa lệnh"
                        >
                          ✏️
                        </button>
                      )}
                      {wo.status === 'draft' && (
                        <button
                          className="btn-icon"
                          type="button"
                          style={{ color: 'var(--accent)' }}
                          onClick={() => handleStart(wo.id)}
                          title="Bắt đầu sản xuất"
                          disabled={startMutation.isPending}
                        >
                          ▶
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {orders.length > 0 && (
        <div className="pagination-bar" style={{ padding: '0.75rem 1.25rem' }}>
          <span className="pagination-info">
            Hiển thị {orders.length} / {data?.count ?? 0} lệnh
          </span>
          <div className="pagination-buttons">
            <button
              className="btn-secondary"
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ←
            </button>
            <span className="pagination-current">{page}</span>
            <button
              className="btn-secondary"
              type="button"
              disabled={orders.length < 20}
              onClick={() => setPage((p) => p + 1)}
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
