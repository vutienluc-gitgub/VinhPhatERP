import { useState } from 'react';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
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
import {
  useWorkOrders,
  useStartWorkOrder,
  useIssueYarnWorkOrder,
  useCompleteWorkOrder,
} from '@/application/production';
import { WORK_ORDER_STATUSES } from '@/schema/work-order.schema';

import { WorkOrderKanbanBoard } from './components/WorkOrderKanbanBoard';
import type {
  WorkOrderFilter,
  WorkOrderStatus,
  WorkOrderWithRelations,
} from './types';

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
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [completeWoId, setCompleteWoId] = useState<string | null>(null);
  const [actualYieldM, setActualYieldM] = useState<number | ''>('');

  const { data, isLoading } = useWorkOrders(
    filter,
    page,
    viewMode === 'kanban' ? 100 : 20,
  );
  const startMutation = useStartWorkOrder();
  const issueYarnMutation = useIssueYarnWorkOrder();
  const completeMutation = useCompleteWorkOrder();
  const { confirm } = useConfirm();

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

  const handleStatusChange = async (
    id: string,
    newStatus: WorkOrderStatus,
    currentWO: WorkOrderWithRelations,
  ) => {
    try {
      if (currentWO.status === 'draft' && newStatus === 'yarn_issued') {
        const ok = await confirm({
          message: 'Xác nhận xuất sợi cho lệnh dệt này?',
        });
        if (ok) issueYarnMutation.mutate(id);
      } else if (
        (currentWO.status === 'draft' || currentWO.status === 'yarn_issued') &&
        newStatus === 'in_progress'
      ) {
        const ok = await confirm({ message: 'Bắt đầu sản xuất lệnh dệt này?' });
        if (ok) startMutation.mutate(id);
      } else if (
        currentWO.status === 'in_progress' &&
        newStatus === 'completed'
      ) {
        setCompleteWoId(id);
        setActualYieldM(currentWO.target_quantity);
      } else {
        await confirm({
          message: 'Trạng thái chuyển đổi không hợp lệ hoặc chưa được hỗ trợ.',
          title: 'Không thể chuyển đổi',
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCompleteSubmit = async () => {
    if (!completeWoId || !actualYieldM) return;
    try {
      await completeMutation.mutateAsync({
        id: completeWoId,
        input: { actual_yield_m: Number(actualYieldM) },
      });
      setCompleteWoId(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="panel-card card-flush">
      {/* Action bar */}
      <div className="card-header-area">
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-white shadow text-primary' : 'text-slate-600 hover:text-slate-900'}`}
            onClick={() => setViewMode('kanban')}
          >
            Kanban
          </button>
          <button
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'table' ? 'bg-white shadow text-primary' : 'text-slate-600 hover:text-slate-900'}`}
            onClick={() => setViewMode('table')}
          >
            Danh sách
          </button>
        </div>
        <AddButton onClick={onCreate} label="Tạo lệnh SX" />
      </div>

      {/* KPI Dashboard */}
      <div className="kpi-section kpi-grid">
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

      {viewMode === 'kanban' ? (
        <div className="mt-4">
          <WorkOrderKanbanBoard
            workOrders={orders}
            onView={onView}
            onEdit={onEdit}
            onStatusChange={handleStatusChange}
          />
        </div>
      ) : (
        <>
          {/* Table & Cards */}
          <DataTablePremium
            data={orders}
            isLoading={isLoading}
            rowKey={(wo) => wo.id}
            onRowClick={(wo) => onView(wo.id)}
            emptyStateTitle={
              hasFilter
                ? 'Không tìm thấy lệnh sản xuất'
                : 'Chưa có lệnh sản xuất'
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
                    <span className="text-xs text-muted">
                      V{wo.bom_version}
                    </span>
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
                      {wo.status === 'draft' && (
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
        </>
      )}

      {/* Complete Work Order Modal */}
      <AdaptiveSheet
        open={!!completeWoId}
        onClose={() => setCompleteWoId(null)}
        title="Báo cáo sản lượng hoàn thành"
        maxWidth={400}
      >
        <div className="p-4 space-y-4">
          <div className="form-field">
            <label className="field-label">
              Sản lượng thực tế (mét) <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              className="field-input"
              value={actualYieldM}
              onChange={(e) => setActualYieldM(Number(e.target.value))}
              placeholder="Nhập số mét vải mộc thực tế thu được"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Sản lượng này sẽ được dùng để tính toán hao hụt thực tế so với mục
              tiêu.
            </p>
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="secondary" onClick={() => setCompleteWoId(null)}>
              Hủy
            </Button>
            <Button
              variant="primary"
              onClick={handleCompleteSubmit}
              disabled={completeMutation.isPending || !actualYieldM}
            >
              {completeMutation.isPending
                ? 'Đang xử lý...'
                : 'Xác nhận hoàn thành'}
            </Button>
          </div>
        </div>
      </AdaptiveSheet>
    </div>
  );
}
