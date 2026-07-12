import { useState } from 'react';
import toast from 'react-hot-toast';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import {
  Icon,
  DataTableAdvanced,
  FilterBar,
  type FilterFieldConfig,
  Button,
  PageLayout,
  PageHeader,
  TableSection,
} from '@/shared/components';
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
import { WORK_ORDER_MESSAGES as MSG } from './work-orders.constants';
import { useWorkOrderColumns } from './hooks/useWorkOrderColumns';
import { WorkOrderMobileCard } from './components/WorkOrderMobileCard';

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

  const filterBarValue = {
    search: filter.search || '',
    status: filter.status === 'all' ? '' : (filter.status ?? ''),
  };

  const filterSchema: FilterFieldConfig[] = [
    {
      key: 'search',
      type: 'search',
      label: MSG.FILTER_SEARCH_LABEL,
      placeholder: MSG.FILTER_SEARCH_PLACEHOLDER,
    },
    {
      key: 'status',
      type: 'combobox',
      label: MSG.FILTER_STATUS_LABEL,
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
      toast.error(
        e instanceof Error ? e.message : 'Có lỗi xảy ra khi chuyển trạng thái',
      );
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
      toast.error(
        e instanceof Error ? e.message : 'Có lỗi xảy ra khi hoàn thành lệnh',
      );
    }
  };

  const columns = useWorkOrderColumns({
    onView,
    onEdit,
    onStart: handleStart,
    isStarting: startMutation.isPending,
  });

  return (
    <PageLayout>
      <PageHeader
        title={MSG.PAGE_TITLE}
        subtitle={MSG.PAGE_SUBTITLE}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-slate-100 p-1 rounded-lg mr-2">
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
            <button
              type="button"
              className="btn-primary flex items-center gap-2"
              onClick={onCreate}
            >
              <Icon name="Plus" size={18} />
              {MSG.BTN_CREATE}
            </button>
          </div>
        }
      />

      <div className="stats-grid-premium px-4 sm:px-6 lg:px-8 mt-4">
        <div className="stat-item-premium">
          <div className="stat-icon-wrapper bg-[rgba(11,107,203,0.1)] text-[var(--primary)]">
            <Icon name="Layers" size={24} />
          </div>
          <div className="stat-content-premium">
            <p>{MSG.KPI_TOTAL}</p>
            <p>{data?.count ?? 0}</p>
          </div>
        </div>

        <div className="stat-item-premium">
          <div className="stat-icon-wrapper bg-[rgba(234,179,8,0.1)] text-warning">
            <Icon name="PlayCircle" size={24} />
          </div>
          <div className="stat-content-premium">
            <p>{MSG.KPI_IN_PROGRESS}</p>
            <p>{orders.filter((wo) => wo.status === 'in_progress').length}</p>
          </div>
        </div>
      </div>

      <TableSection>
        <div className="w-full px-4 sm:px-6 lg:px-8 mt-2 pb-4 border-b border-border flex flex-col gap-4">
          <FilterBar
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
        </div>

        {viewMode === 'kanban' ? (
          <div className="mt-4 p-4">
            <WorkOrderKanbanBoard
              workOrders={orders}
              onView={onView}
              onEdit={onEdit}
              onStatusChange={handleStatusChange}
            />
          </div>
        ) : (
          <DataTableAdvanced
            data={orders}
            columns={columns}
            isLoading={isLoading}
            rowKey={(wo) => wo.id}
            onRowClick={(wo) => onView(wo.id)}
            emptyStateTitle={
              hasFilter ? MSG.EMPTY_STATE_FILTER_TITLE : MSG.EMPTY_STATE_TITLE
            }
            emptyStateDescription={
              hasFilter ? MSG.EMPTY_STATE_FILTER_DESC : MSG.EMPTY_STATE_DESC
            }
            emptyStateIcon={hasFilter ? 'Search' : 'Factory'}
            emptyStateActionLabel={
              !hasFilter ? `+ ${MSG.BTN_CREATE}` : undefined
            }
            onEmptyStateAction={!hasFilter ? onCreate : undefined}
            renderMobileCard={(wo) => (
              <WorkOrderMobileCard
                workOrder={wo}
                onView={onView}
                onEdit={onEdit}
                onStart={handleStart}
                isStarting={startMutation.isPending}
              />
            )}
            pagination={{
              result: {
                data: orders,
                total: data?.count ?? 0,
                page,
                pageSize: 20,
                totalPages: Math.ceil((data?.count ?? 0) / 20),
              },
              onPageChange: setPage,
              itemLabel: MSG.PAGINATION_LABEL,
            }}
          />
        )}
      </TableSection>

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
    </PageLayout>
  );
}
