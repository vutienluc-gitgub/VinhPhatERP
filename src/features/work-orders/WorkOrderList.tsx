import { useState } from 'react';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import { Pagination } from '@/shared/components/Pagination';
import {
  Icon,
  Badge,
  type BadgeVariant,
  DataTablePremium,
  AddButton,
  ClearFilterButton,
  ActionBar,
} from '@/shared/components';
import type { ActionConfig } from '@/shared/components';
import { Combobox } from '@/shared/components/Combobox';

import type {
  WorkOrderFilter,
  WorkOrderStatus,
  WorkOrderWithRelations,
} from './types';
import { useWorkOrders, useStartWorkOrder } from './useWorkOrders';
import { WORK_ORDER_STATUSES } from './work-orders.module';

function getStatusVariant(status: WorkOrderStatus): BadgeVariant {
  switch (status) {
    case 'draft':
      return 'gray';
    case 'in_progress':
      return 'warning';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'danger';
    default:
      return 'gray';
  }
}

interface WorkOrderListProps {
  onView: (id: string) => void;
  onEdit: (wo: WorkOrderWithRelations) => void;
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
      <div className="card-header-area card-header-premium">
        <div>
          <p className="eyebrow-premium">Sản xuất</p>
          <h3 className="title-premium">Lệnh Sản Xuất</h3>
        </div>
        <AddButton onClick={onCreate} label="Tạo lệnh SX" />
      </div>

      {/* KPI Dashboard */}
      <div className="kpi-grid p-4 md:p-6 bg-surface-subtle border-b border-border">
        <div className="kpi-card-premium kpi-primary">
          <div className="kpi-overlay" />
          <div className="kpi-content">
            <div className="kpi-info">
              <p className="kpi-label">Tổng lệnh sản xuất</p>
              <p className="kpi-value">{data?.count ?? 0}</p>
            </div>
            <div className="kpi-icon-box">
              <Icon name="Layers" size={32} />
            </div>
          </div>
          <div className="kpi-footer text-xs opacity-80 italic">
            Tất cả các lệnh dệt
          </div>
        </div>

        <div className="kpi-card-premium kpi-warning">
          <div className="kpi-overlay" />
          <div className="kpi-content">
            <div className="kpi-info">
              <p className="kpi-label">Đang sản xuất</p>
              <p className="kpi-value">
                {orders.filter((wo) => wo.status === 'in_progress').length}
              </p>
            </div>
            <div className="kpi-icon-box">
              <Icon name="PlayCircle" size={32} />
            </div>
          </div>
          <div className="kpi-footer text-xs opacity-80 italic">
            Dây chuyền đang hoạt động
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar card-filter-section p-4 border-b border-border">
        <div className="filter-compact-premium">
          <div className="filter-field">
            <label htmlFor="wo-search">Tìm kiếm</label>
            <div className="search-input-wrapper">
              <input
                id="wo-search"
                className="field-input"
                type="text"
                placeholder="Nhập mã lệnh để tìm..."
                value={filter.search}
                onChange={(e) =>
                  setFilter((f) => ({
                    ...f,
                    search: e.target.value,
                  }))
                }
              />
              <Icon name="Search" size={16} className="search-input-icon" />
            </div>
          </div>

          <div className="filter-field">
            <label>Trạng thái</label>
            <Combobox
              options={[
                {
                  value: 'all',
                  label: 'Tất cả trạng thái',
                },
                {
                  value: 'draft',
                  label: 'Bản nháp',
                },
                {
                  value: 'in_progress',
                  label: 'Đang sản xuất',
                },
                {
                  value: 'completed',
                  label: 'Hoàn thành',
                },
                {
                  value: 'cancelled',
                  label: 'Đã hủy',
                },
              ]}
              value={filter.status || 'all'}
              onChange={(val) =>
                setFilter((f) => ({
                  ...f,
                  status: val as WorkOrderStatus | 'all',
                }))
              }
            />
          </div>

          {hasFilter && (
            <ClearFilterButton
              onClick={() =>
                setFilter({
                  status: 'all',
                  search: '',
                })
              }
              label="Xóa lọc nhanh"
            />
          )}
        </div>
      </div>

      {/* Table & Cards */}
      <DataTablePremium
        data={orders}
        isLoading={isLoading}
        rowKey={(wo) => wo.id}
        onRowClick={(wo) => onView(wo.id)}
        emptyStateTitle={
          hasFilter ? 'Không tìm thấy lệnh sản xuất' : 'Chưa có lệnh sản xuất'
        }
        emptyStateDescription={
          hasFilter
            ? 'Vui lòng thử điều chỉnh lại bộ lọc.'
            : 'Nhấn "Tạo lệnh SX" để bắt đầu thiết lập quy trình.'
        }
        emptyStateIcon={hasFilter ? '🔍' : 'Factory'}
        emptyStateActionLabel={!hasFilter ? '+ Tạo Lệnh SX' : undefined}
        onEmptyStateAction={!hasFilter ? onCreate : undefined}
        columns={[
          {
            header: 'Mã Lệnh',
            cell: (wo) => (
              <div className="flex flex-col">
                <span className="font-bold text-primary">
                  {wo.work_order_number}
                </span>
                {wo.order && (
                  <span className="text-xs text-muted truncate max-w-[200px]">
                    ĐH: {wo.order.order_number}
                  </span>
                )}
              </div>
            ),
          },
          {
            header: 'Công Thức (BOM)',
            cell: (wo) => (
              <div className="flex flex-col">
                <span className="font-bold">{wo.bom_template?.code}</span>
                <span className="text-xs text-muted">V{wo.bom_version}</span>
              </div>
            ),
          },
          {
            header: 'Đối tác dệt',
            cell: (wo) => (
              <div className="flex flex-col">
                <span className="font-medium">{wo.supplier?.name}</span>
                <span className="text-xs text-muted">
                  {wo.weaving_unit_price.toLocaleString()}đ/m
                </span>
              </div>
            ),
          },
          {
            header: 'Mục Tiêu',
            className: 'text-right',
            cell: (wo) => (
              <div className="flex flex-col text-right">
                <span className="font-bold">
                  {wo.target_quantity_m.toLocaleString()} m
                </span>
                {wo.target_weight_kg && (
                  <span className="text-xs text-muted">
                    ~{wo.target_weight_kg.toLocaleString()} kg
                  </span>
                )}
              </div>
            ),
          },
          {
            header: 'Trạng Thái',
            cell: (wo) => {
              const statusConfig = WORK_ORDER_STATUSES[wo.status];
              return (
                <Badge variant={getStatusVariant(wo.status)}>
                  {statusConfig?.label || wo.status}
                </Badge>
              );
            },
          },
          {
            header: 'Bắt Đầu',
            className: 'td-muted',
            cell: (wo) =>
              wo.start_date
                ? new Date(wo.start_date).toLocaleDateString('vi-VN')
                : '—',
          },
          {
            header: 'Thao tác',
            className: 'text-right',
            onCellClick: () => {},
            cell: (wo) => (
              <ActionBar
                actions={
                  [
                    {
                      icon: 'Eye',
                      onClick: () => onView(wo.id),
                      title: 'Chi tiết',
                    },
                    wo.status === 'draft'
                      ? {
                          icon: 'Pencil',
                          onClick: () => onEdit(wo),
                          title: 'Sửa lệnh',
                        }
                      : null,
                    wo.status === 'draft'
                      ? {
                          icon: 'Play',
                          onClick: () => handleStart(wo.id),
                          title: 'Bắt đầu sản xuất',
                          disabled: startMutation.isPending,
                        }
                      : null,
                  ].filter(Boolean) as ActionConfig[]
                }
              />
            ),
          },
        ]}
        renderMobileCard={(wo) => {
          const statusConfig = WORK_ORDER_STATUSES[wo.status];
          return (
            <div className="mobile-card">
              <div className="mobile-card-header">
                <span className="mobile-card-title">
                  {wo.work_order_number}
                </span>
                <Badge variant={getStatusVariant(wo.status)}>
                  {statusConfig?.label || wo.status}
                </Badge>
              </div>
              <div className="mobile-card-body space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted">Đối tác dệt</span>
                    <span className="font-bold">{wo.supplier?.name}</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-xs text-muted">Mục tiêu</span>
                    <span className="font-bold text-primary">
                      {wo.target_quantity_m.toLocaleString()} m
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted">BOM</span>
                    <span className="font-medium">
                      {wo.bom_template?.code} (V{wo.bom_version})
                    </span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-xs text-muted">Đơn giá dệt</span>
                    <span className="font-medium">
                      {wo.weaving_unit_price.toLocaleString()}đ/m
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 mt-1 border-t border-border/10">
                  <button
                    className="btn-secondary flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onView(wo.id);
                    }}
                  >
                    <Icon name="Eye" size={16} /> Chi tiết
                  </button>
                  {wo.status === 'draft' && (
                    <button
                      className="btn-secondary flex-1 text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(wo);
                      }}
                    >
                      <Icon name="Pencil" size={16} /> Sửa
                    </button>
                  )}
                  {wo.status === 'draft' && (
                    <button
                      className="btn-primary flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStart(wo.id);
                      }}
                      disabled={startMutation.isPending}
                    >
                      <Icon name="Play" size={16} /> Bắt đầu
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        }}
      />

      <Pagination
        result={{
          data: orders,
          total: data?.count ?? 0,
          page,
          pageSize: 20,
          totalPages: Math.ceil((data?.count ?? 0) / 20),
        }}
        onPageChange={setPage}
      />
    </div>
  );
}
