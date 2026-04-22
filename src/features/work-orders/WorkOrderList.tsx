import { useState } from 'react';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import { Pagination } from '@/shared/components/Pagination';
import {
  Icon,
  Badge,
  type BadgeVariant,
  DataTablePremium,
  AddButton,
  Button,
  ActionBar,
  FilterBarPremium,
  type FilterFieldConfig,
} from '@/shared/components';
import type { ActionConfig } from '@/shared/components';
import { formatCurrency } from '@/shared/utils/format';
import { useAuth } from '@/shared/hooks/useAuth';
import { useWorkOrders, useStartWorkOrder } from '@/application/production';

import type {
  WorkOrderFilter,
  WorkOrderStatus,
  WorkOrderWithRelations,
} from './types';
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
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const orders = data?.data ?? [];
  const hasFilter = !!(
    filter.search ||
    (filter.status && filter.status !== 'all')
  );

  // Adapter: FilterBarPremium dung '' cho 'all'
  const filterBarValue = {
    search: filter.search || '',
    status: filter.status === 'all' ? '' : (filter.status ?? ''),
  };

  const filterSchema: FilterFieldConfig[] = [
    {
      key: 'search',
      type: 'search',
      label: 'Tìm kiếm',
      placeholder: 'Mã lệnh sản xuất...',
    },
    {
      key: 'status',
      type: 'combobox',
      label: 'Trạng thái',
      options: (
        Object.entries(WORK_ORDER_STATUSES) as [
          WorkOrderStatus,
          { label: string },
        ][]
      ).map(([value, cfg]) => ({
        value,
        label: cfg.label,
      })),
    },
  ];

  function handleFilterChange(key: string, value: string | undefined) {
    setPage(1);
    if (key === 'status') {
      setFilter((f) => ({
        ...f,
        status: (value as WorkOrderStatus) || 'all',
      }));
    } else {
      setFilter((f) => ({
        ...f,
        [key]: value ?? '',
      }));
    }
  }

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

      {/* Filters (Config-Driven) */}
      <FilterBarPremium
        schema={filterSchema}
        value={filterBarValue}
        onChange={handleFilterChange}
        onClear={() => {
          setFilter({
            status: 'all',
            search: '',
          });
          setPage(1);
        }}
      />

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
        emptyStateIcon={hasFilter ? 'Search' : 'Factory'}
        emptyStateActionLabel={!hasFilter ? '+ Tạo Lệnh SX' : undefined}
        onEmptyStateAction={!hasFilter ? onCreate : undefined}
        columns={[
          {
            header: 'Mã Lệnh',
            id: 'work_order_number',
            sortable: true,
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
            id: 'bom_template',
            sortable: true,
            accessor: (wo) => wo.bom_template?.code,
            cell: (wo) => (
              <div className="flex flex-col">
                <span className="font-bold">{wo.bom_template?.code}</span>
                <span className="text-xs text-muted">V{wo.bom_version}</span>
              </div>
            ),
          },
          {
            header: 'Đối tác dệt',
            id: 'supplier',
            sortable: true,
            accessor: (wo) => wo.supplier?.name,
            cell: (wo) => (
              <div className="flex flex-col">
                <span className="font-medium">{wo.supplier?.name}</span>
                <span className="text-xs text-muted">
                  {formatCurrency(wo.weaving_unit_price)}đ/m
                </span>
              </div>
            ),
          },
          {
            header: 'Mục Tiêu',
            id: 'target_quantity',
            sortable: true,
            className: 'text-right',
            cell: (wo) => (
              <div className="flex flex-col text-right">
                <span className="font-bold">
                  {wo.target_quantity.toLocaleString()} m
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
            id: 'status',
            sortable: true,
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
            id: 'start_date',
            sortable: true,
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
                    wo.status === 'draft' || isAdmin
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
                      {wo.target_quantity.toLocaleString()} m
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
                      {formatCurrency(wo.weaving_unit_price)}đ/m
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 mt-1 border-t border-border/10">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    leftIcon="Eye"
                    onClick={(e) => {
                      e.stopPropagation();
                      onView(wo.id);
                    }}
                  >
                    Chi tiết
                  </Button>
                  {(wo.status === 'draft' || isAdmin) && (
                    <Button
                      variant="secondary"
                      className="flex-1 text-primary"
                      leftIcon="Pencil"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(wo);
                      }}
                    >
                      Sửa
                    </Button>
                  )}
                  {wo.status === 'draft' && (
                    <Button
                      variant="primary"
                      className="flex-1"
                      leftIcon="Play"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStart(wo.id);
                      }}
                      disabled={startMutation.isPending}
                    >
                      Bắt đầu
                    </Button>
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
