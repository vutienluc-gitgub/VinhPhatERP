import { useState } from 'react';
import { Search, Eye, Play } from 'lucide-react';
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
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config?.color}`}>
        {config?.label || status}
      </span>
    );
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden flex flex-col h-full">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 border-b border-gray-200">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
          <input
            placeholder="Tìm theo mã lệnh..."
            value={filter.search}
            onChange={(e) => setFilter(f => ({ ...f, search: e.target.value }))}
            className="pl-9 block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={filter.status || 'all'}
            onChange={(e) => setFilter(f => ({ ...f, status: e.target.value as WorkOrderStatus | 'all'}))}
            className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã Lệnh</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Công Thức (BOM)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mục Tiêu</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng Thái</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày Bắt Đầu</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-sm text-gray-500">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : data?.data?.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-neutral-500 text-sm">
                  Không tìm thấy lệnh sản xuất nào.
                </td>
              </tr>
            ) : (
              data?.data.map((wo) => (
                <tr key={wo.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-emerald-700">{wo.work_order_number}</div>
                    {wo.order && (
                      <div className="text-xs text-neutral-500 mt-1">
                        ĐH: {wo.order.order_number}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-sm">{wo.bom_template?.code}</div>
                    <div className="text-xs text-neutral-600">V{wo.bom_version}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="font-medium">{wo.target_quantity_m.toLocaleString()} m</div>
                    {wo.target_weight_kg && (
                      <div className="text-xs text-neutral-600">~{wo.target_weight_kg.toLocaleString()} kg</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(wo.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {wo.start_date ? new Date(wo.start_date).toLocaleDateString('vi-VN') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex justify-end gap-2">
                      <button
                        className="p-1 hover:bg-gray-100 rounded text-gray-600"
                        onClick={() => onView(wo.id)}
                        title="Chi tiết"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {wo.status === 'draft' && (
                         <button
                          className="p-1 hover:bg-blue-50 text-blue-600 rounded"
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
      <div className="p-4 border-t border-gray-200 flex items-center justify-between text-sm text-neutral-500 bg-white">
        <div>Trang {page} / {Math.ceil((data?.count || 0) / 20) || 1}</div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Trước
          </button>
          <button
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
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
