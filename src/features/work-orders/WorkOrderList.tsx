import { useState } from 'react';
import { Eye, Play } from 'lucide-react';
import { useWorkOrders, useStartWorkOrder } from './useWorkOrders';
import { WORK_ORDER_STATUSES } from './work-orders.module';
import type { WorkOrderFilter, WorkOrderStatus } from './types';

interface WorkOrderListProps {
  onView: (id: string) => void;
}

export function WorkOrderList({ onView }: WorkOrderListProps) {
  const [filter, setFilter] = useState<WorkOrderFilter>({ status: 'all', search: '' });
  const [page, setPage] = useState(1);

  const { data, isLoading } = useWorkOrders(filter, page, 20);
  const startMutation = useStartWorkOrder();

  const getStatusBadge = (status: WorkOrderStatus) => {
    const config = WORK_ORDER_STATUSES[status];
    return (
      <span className={`roll-status ${status}`}>
        {config?.label || status}
      </span>
    );
  };

  return (
    <div className="panel-card card-flush flex flex-col h-full bg-white shadow-sm">
      {/* Filters */}
      <div className="filter-bar" style={{ border: 'none', borderBottom: '1px solid var(--border)', borderRadius: 0, background: 'transparent' }}>
        <div className="filter-field" style={{ flex: '2 1 300px' }}>
          <label>Tìm theo mã lệnh...</label>
          <input
            placeholder="Nhập mã lệnh dệt để tìm..."
            value={filter.search}
            onChange={(e) => setFilter(f => ({ ...f, search: e.target.value }))}
            className="field-input"
          />
        </div>
        <div className="filter-field" style={{ flex: '1 1 180px' }}>
          <label>Lọc trạng thái</label>
          <select
            value={filter.status || 'all'}
            onChange={(e) => setFilter(f => ({ ...f, status: e.target.value as WorkOrderStatus | 'all'}))}
            className="field-select"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="draft">Bản nháp</option>
            <option value="in_progress">Đang sản xuất</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="data-table-wrap" style={{ border: 'none', borderRadius: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã Lệnh</th>
              <th>Công Thức (BOM)</th>
              <th className="text-right">Mục Tiêu</th>
              <th>Trạng Thái</th>
              <th>Ngày Bắt Đầu</th>
              <th className="td-actions">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="table-empty">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : data?.data?.length === 0 ? (
              <tr>
                <td colSpan={6} className="table-empty">
                  Không tìm thấy lệnh sản xuất nào.
                </td>
              </tr>
            ) : (
              data?.data.map((wo) => (
                <tr key={wo.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{wo.work_order_number}</div>
                    {wo.order && (
                      <div className="td-muted" style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                        DH: {wo.order.order_number}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{wo.bom_template?.code}</div>
                    <div className="td-muted">V{wo.bom_version}</div>
                  </td>
                  <td className="text-right">
                    <div style={{ fontWeight: 700 }}>{wo.target_quantity_m.toLocaleString()} m</div>
                    {wo.target_weight_kg && (
                      <div className="td-muted">~{wo.target_weight_kg.toLocaleString()} kg</div>
                    )}
                  </td>
                  <td>
                    {getStatusBadge(wo.status)}
                  </td>
                  <td className="td-muted">
                    {wo.start_date ? new Date(wo.start_date).toLocaleDateString('vi-VN') : '-'}
                  </td>
                  <td className="td-actions">
                    <div className="flex justify-end gap-2">
                       <button
                        className="btn-icon"
                        onClick={() => onView(wo.id)}
                        title="Chi tiết"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {wo.status === 'draft' && (
                         <button
                          className="btn-icon"
                          style={{ color: 'var(--accent)' }}
                          onClick={() => {
                            if (confirm('Bắt đầu lệnh dệt này?')) startMutation.mutate(wo.id);
                          }}
                          title="Bắt đầu sản xuất"
                        >
                         <Play className="h-4 w-4" />
                       </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination-bar">
        <div className="pagination-info">Trang {page} / {Math.ceil((data?.count || 0) / 20) || 1}</div>
        <div className="pagination-buttons">
          <button
            className="btn-secondary"
            style={{ padding: '0.4rem 0.8rem', minHeight: 'auto' }}
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Trước
          </button>
          <button
            className="btn-secondary"
            style={{ padding: '0.4rem 0.8rem', minHeight: 'auto' }}
            disabled={!data?.data || data.data.length < 20}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
}
