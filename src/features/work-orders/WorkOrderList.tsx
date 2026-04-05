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
    <div className="panel-card card-flush flex flex-col h-full bg-white shadow-sm overflow-hidden">
      {/* Filters - Responsive Grid */}
      <div className="filter-bar grid grid-cols-1 sm:flex sm:items-end gap-3 p-4 bg-neutral-50/50 border-b border-neutral-100">
        <div className="flex-1 min-w-0">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1.5 block">Tìm theo mã lệnh...</label>
          <input
            placeholder="Nhập mã lệnh dệt để tìm..."
            value={filter.search}
            onChange={(e) => setFilter(f => ({ ...f, search: e.target.value }))}
            className="field-input w-full"
          />
        </div>
        <div className="w-full sm:w-48">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1.5 block">Lọc trạng thái</label>
          <select
            value={filter.status || 'all'}
            onChange={(e) => setFilter(f => ({ ...f, status: e.target.value as WorkOrderStatus | 'all'}))}
            className="field-select w-full"
          >
            <option value="all">Tất cả</option>
            <option value="draft">Bản nháp</option>
            <option value="in_progress">Đang sản xuất</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>
      </div>

      {/* Table Wrapper for Horizontal Scroll */}
      <div className="overflow-x-auto w-full">
        <table className="data-table min-w-full">
          <thead>
            <tr>
              <th className="min-w-[120px]">Mã Lệnh</th>
              <th className="min-w-[150px]">Công Thức (BOM)</th>
              <th className="text-right min-w-[100px]">Mục Tiêu</th>
              <th className="min-w-[120px]">Trạng Thái</th>
              <th className="min-w-[110px]">Bắt Đầu</th>
              <th className="td-actions">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="table-empty py-12">
                  <div className="flex flex-col items-center gap-2">
                    <div className="skeleton-block w-8 h-8 rounded-full" />
                    <span className="text-sm text-neutral-400">Đang tải dữ liệu...</span>
                  </div>
                </td>
              </tr>
            ) : data?.data?.length === 0 ? (
              <tr>
                <td colSpan={6} className="table-empty py-12 text-center text-neutral-400">
                  Không tìm thấy lệnh sản xuất nào.
                </td>
              </tr>
            ) : (
              data?.data.map((wo) => (
                <tr key={wo.id}>
                  <td>
                    <div className="font-bold text-primary truncate max-w-[140px]">{wo.work_order_number}</div>
                    {wo.order && (
                      <div className="td-muted text-[0.7rem] sm:text-xs">
                        {wo.order.order_number}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="font-semibold text-sm truncate max-w-[180px]">{wo.bom_template?.code}</div>
                    <div className="td-muted text-xs">V{wo.bom_version}</div>
                  </td>
                  <td className="text-right whitespace-nowrap">
                    <div className="font-bold">{wo.target_quantity_m.toLocaleString()} m</div>
                    {wo.target_weight_kg && (
                      <div className="td-muted text-xs">~{wo.target_weight_kg.toLocaleString()} kg</div>
                    )}
                  </td>
                  <td>
                    {getStatusBadge(wo.status)}
                  </td>
                  <td className="td-muted whitespace-nowrap text-sm">
                    {wo.start_date ? new Date(wo.start_date).toLocaleDateString('vi-VN') : '-'}
                  </td>
                  <td className="td-actions">
                    <div className="flex justify-end gap-1.5">
                       <button
                        className="btn-icon w-8 h-8 sm:w-10 sm:h-10 border border-neutral-100"
                        onClick={() => onView(wo.id)}
                        title="Chi tiết"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {wo.status === 'draft' && (
                         <button
                          className="btn-icon w-8 h-8 sm:w-10 sm:h-10 border border-neutral-100 bg-accent/5"
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

      {/* Responsive Pagination */}
      <div className="pagination-bar p-4 border-t border-neutral-100 bg-neutral-50/30 flex flex-col sm:flex-row items-center gap-3">
        <div className="pagination-info text-xs sm:text-sm font-medium text-neutral-500">
          Hiển thị {data?.data?.length || 0} / {data?.count || 0} lệnh
        </div>
        <div className="pagination-buttons flex items-center gap-2 w-full sm:w-auto">
          <button
            className="btn-secondary flex-1 sm:flex-none py-2 h-10 px-4 min-w-[80px]"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Trước
          </button>
          <span className="text-sm font-bold px-2 whitespace-nowrap">{page}</span>
          <button
            className="btn-secondary flex-1 sm:flex-none py-2 h-10 px-4 min-w-[80px]"
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

