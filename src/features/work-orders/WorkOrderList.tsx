import { useState } from 'react';

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
  KpiCard,
  ErrorInline,
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

  const { data, isLoading, error } = useWorkOrders(
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
      message: MSG.CONFIRM_START,
      variant: 'danger',
    });
    if (ok) {
      try {
        await startMutation.mutateAsync(id);
      } catch (err) {
        const errMessage = err instanceof Error ? err.message : String(err);
        await confirm({
          title: MSG.ERR_TITLE,
          message: `${MSG.ERR_TRANSITION_FAILED}${errMessage}`,
          variant: 'danger',
          cancelLabel: MSG.BTN_CLOSE,
          confirmLabel: '',
        });
      }
    }
  };

  const handleStatusChange = async (
    id: string,
    newStatus: WorkOrderStatus,
    currentWO: WorkOrderWithRelations,
  ) => {
    try {
      if (currentWO.status === 'draft' && newStatus === 'yarn_issued') {
        const ok = await confirm({
          message: MSG.CONFIRM_YARN_ISSUE,
        });
        if (ok) await issueYarnMutation.mutateAsync(id);
      } else if (
        (currentWO.status === 'draft' || currentWO.status === 'yarn_issued') &&
        newStatus === 'in_progress'
      ) {
        const ok = await confirm({ message: MSG.CONFIRM_PRODUCE });
        if (ok) await startMutation.mutateAsync(id);
      } else if (
        currentWO.status === 'in_progress' &&
        newStatus === 'completed'
      ) {
        setCompleteWoId(id);
        setActualYieldM(currentWO.target_quantity);
      } else {
        await confirm({
          message: MSG.ERR_INVALID_TRANSITION,
          title: MSG.ERR_INVALID_TRANSITION_TITLE,
          variant: 'danger',
          cancelLabel: MSG.BTN_CLOSE,
          confirmLabel: '',
        });
      }
    } catch (e) {
      const errMessage = e instanceof Error ? e.message : String(e);
      await confirm({
        title: MSG.ERR_TITLE,
        message: `${MSG.ERR_TRANSITION_FAILED}${errMessage}`,
        variant: 'danger',
        cancelLabel: MSG.BTN_CLOSE,
        confirmLabel: '',
      });
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
      const errMessage = e instanceof Error ? e.message : String(e);
      await confirm({
        title: MSG.ERR_TITLE,
        message: `${MSG.ERR_COMPLETE_FAILED}${errMessage}`,
        variant: 'danger',
        cancelLabel: MSG.BTN_CLOSE,
        confirmLabel: '',
      });
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
                {MSG.VIEW_KANBAN}
              </button>
              <button
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'table' ? 'bg-white shadow text-primary' : 'text-slate-600 hover:text-slate-900'}`}
                onClick={() => setViewMode('table')}
              >
                {MSG.VIEW_TABLE}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 sm:px-6 lg:px-8 mt-4">
        <KpiCard
          label={MSG.KPI_TOTAL}
          value={data?.count ?? 0}
          icon="Layers"
          variant="primary"
          formatMode="number"
        />
        <KpiCard
          label={MSG.KPI_IN_PROGRESS}
          value={orders.filter((wo) => wo.status === 'in_progress').length}
          icon="PlayCircle"
          variant="warning"
          formatMode="number"
        />
      </div>

      <TableSection>
        {error && (
          <div className="p-4">
            <ErrorInline>
              {error instanceof Error ? error.message : String(error)}
            </ErrorInline>
          </div>
        )}
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
        title={MSG.MODAL_COMPLETE_TITLE}
        maxWidth={400}
      >
        <div className="p-4 space-y-4">
          <div className="form-field">
            <label className="field-label">
              {MSG.MODAL_COMPLETE_ACTUAL_YIELD}{' '}
              <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              className="field-input"
              value={actualYieldM}
              onChange={(e) => setActualYieldM(Number(e.target.value))}
              placeholder={MSG.MODAL_COMPLETE_PLACEHOLDER}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {MSG.MODAL_COMPLETE_DESC}
            </p>
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="secondary" onClick={() => setCompleteWoId(null)}>
              {MSG.BTN_CANCEL}
            </Button>
            <Button
              variant="primary"
              onClick={handleCompleteSubmit}
              disabled={completeMutation.isPending || !actualYieldM}
            >
              {completeMutation.isPending
                ? MSG.BTN_PROCESSING
                : MSG.BTN_CONFIRM_COMPLETE}
            </Button>
          </div>
        </div>
      </AdaptiveSheet>
    </PageLayout>
  );
}
