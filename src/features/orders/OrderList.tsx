import { useState } from 'react';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import { Pagination } from '@/shared/components/Pagination';
import {
  Icon,
  Badge,
  type BadgeVariant,
  DataTablePremium,
  AddButton,
  ActionBar,
  FilterBarPremium,
  type FilterFieldConfig,
  FadeUp,
  LiveIndicator,
} from '@/shared/components';
import type { ActionConfig } from '@/shared/components';
import { formatCurrency } from '@/shared/utils/format';
import { useDeleteOrder, useOrderList } from '@/application/orders';
import { sumBy } from '@/shared/utils/array.util';

import { ORDER_STATUS_LABELS } from './orders.module';
import type { Order, OrdersFilter, OrderStatus } from './types';

type OrderListProps = {
  onEdit: (order: Order) => void;
  onNew: () => void;
  onView: (order: Order) => void;
};

function getVariant(status: OrderStatus): BadgeVariant {
  switch (status) {
    case 'pending_review':
      return 'warning';
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
  const [filters, setFilters] = useState<OrdersFilter>({});
  const [page, setPage] = useState(1);

  const { data: result, isLoading, error } = useOrderList(filters, page);
  const orders = result?.data ?? [];
  const deleteMutation = useDeleteOrder();
  const { confirm, alert: showAlert } = useConfirm();

  const pendingReviewCount = orders.filter(
    (o) => o.status === 'pending_review',
  ).length;

  const filterSchema: FilterFieldConfig[] = [
    {
      key: 'search',
      type: 'search',
      label: 'Tìm kiếm',
      placeholder: 'Mã đơn, tên khách hàng...',
    },
    {
      key: 'status',
      type: 'combobox',
      label: 'Trạng thái',
      options: Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
    },
  ];

  function handleFilterChange(key: string, value: string | undefined) {
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
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
      {/* Action bar */}
      <div className="card-header-area">
        <LiveIndicator label="Trực tiếp" />
        <AddButton onClick={onNew} label="Tạo đơn hàng" />
      </div>

      {/* 📊 KPI Dashboard - Premium Visuals */}
      <div className="kpi-section kpi-grid">
        <div
          className={`kpi-card-premium ${pendingReviewCount > 0 ? 'kpi-warning' : 'kpi-primary'}`}
        >
          <div className="kpi-overlay" />
          <div className="kpi-content">
            <div className="kpi-info">
              <p className="kpi-label">Yêu cầu chờ duyệt</p>
              <p className="kpi-value">{pendingReviewCount}</p>
            </div>
            <div className="kpi-icon-box">
              <Icon name="Bell" size={32} />
            </div>
          </div>
          <div className="kpi-footer text-xs opacity-80 italic">
            Yêu cầu từ Customer Portal
          </div>
        </div>

        <div className="kpi-card-premium kpi-success">
          <div className="kpi-overlay" />
          <div className="kpi-content">
            <div className="kpi-info">
              <p className="kpi-label">Doanh thu dự kiến</p>
              <div className="flex items-baseline gap-1">
                <p className="kpi-value">
                  {formatCurrency(sumBy(orders, (o) => o.total_amount)).replace(
                    ' đ',
                    '',
                  )}
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
                    sumBy(orders, (o) =>
                      Math.max(0, o.total_amount - o.paid_amount),
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

      {/* Filter Bar (Config-Driven) */}
      <FadeUp delay={0.1}>
        <FilterBarPremium
          schema={filterSchema}
          value={filters}
          onChange={handleFilterChange}
          onClear={() => {
            setFilters({});
            setPage(1);
          }}
        />
      </FadeUp>

      {/* Error State */}
      {error && (
        <div className="p-4">
          <p className="error-inline">
            Lỗi tải dữ liệu: {(error as Error).message}
          </p>
        </div>
      )}

      {/* 📑 Data Table / List */}
      <FadeUp delay={0.2}>
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
          emptyStateIcon={hasFilter ? 'Search' : 'Package'}
          emptyStateActionLabel={!hasFilter ? '+ Tạo đơn hàng' : undefined}
          onEmptyStateAction={!hasFilter ? onNew : undefined}
          columns={[
            {
              header: 'Số đơn / Khách hàng',
              id: 'order_number',
              sortable: true,
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
              id: 'order_date',
              sortable: true,
              className: 'text-muted text-sm',
              cell: (order) => order.order_date,
            },
            {
              header: 'Dự kiến giao',
              id: 'delivery_date',
              sortable: true,
              cell: (order) => {
                const due = daysUntilDelivery(order.delivery_date);
                return (
                  <div className="flex flex-col">
                    <span className="text-sm">
                      {order.delivery_date ?? '—'}
                    </span>
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
              id: 'total_amount',
              sortable: true,
              className: 'text-right numeric-cell font-medium',
              cell: (order) => `${formatCurrency(order.total_amount)}đ`,
            },
            {
              header: 'Còn nợ',
              id: 'paid_amount',
              sortable: true,
              accessor: (order) =>
                order.total_amount - (order.paid_amount || 0),
              className: 'text-right numeric-cell font-bold',
              cell: (order) => {
                const balanceDue = order.total_amount - order.paid_amount;
                return (
                  <span
                    className={balanceDue > 0 ? 'text-danger' : 'text-success'}
                  >
                    {formatCurrency(balanceDue)}đ
                  </span>
                );
              },
            },
            {
              header: 'Trạng thái',
              id: 'status',
              sortable: true,
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
                <ActionBar
                  actions={
                    [
                      order.status === 'draft'
                        ? {
                            icon: 'Edit3',
                            onClick: () => onEdit(order),
                          }
                        : null,
                      order.status === 'draft'
                        ? {
                            icon: 'Trash2',
                            onClick: () => handleDelete(order),
                            variant: 'danger',
                          }
                        : null,
                      order.status !== 'draft'
                        ? {
                            icon: 'Eye',
                            onClick: () => onView(order),
                          }
                        : null,
                    ].filter(Boolean) as ActionConfig[]
                  }
                />
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
                    <span className="text-xs text-muted">
                      {order.order_date}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase text-muted">
                        Tổng tiền
                      </span>
                      <span className="text-sm font-medium">
                        {formatCurrency(order.total_amount)}đ
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase text-muted">
                        Còn nợ
                      </span>
                      <span
                        className={`text-sm font-bold ${balanceDue > 0 ? 'text-danger' : 'text-success'}`}
                      >
                        {formatCurrency(balanceDue)}đ
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
      </FadeUp>
    </div>
  );
}
