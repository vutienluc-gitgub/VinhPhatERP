import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import toast from 'react-hot-toast';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import {
  Icon,
  Badge,
  DataTableAdvanced,
  AddButton,
  ActionMenu,
  FilterBar,
  type FilterFieldConfig,
  KpiCard,
  KpiGrid,
} from '@/shared/components';
import { useUrlFilterState } from '@/shared/hooks/useUrlFilterState';
import {
  usePurchaseRequestsList,
  useDeletePurchaseRequest,
} from '@/application/procurement/usePurchaseRequests';
import type { PurchaseRequest } from '@/api/purchase-requests.api';
import { PR_STATUSES, PR_PRIORITIES } from '@/schema/purchase-request.schema';

import {
  PR_LABELS,
  PR_STATUS_LABELS,
  PR_STATUS_COLORS,
  PR_PRIORITY_LABELS,
  PR_PRIORITY_COLORS,
  PR_KPI_VARIANTS,
} from './purchase-requests.constants';

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

export function PRList() {
  const navigate = useNavigate();
  const { filters, setFilter, clearFilters, hasActiveFilter } =
    useUrlFilterState(['search', 'status', 'priority'] as const, {});
  const [page, setPage] = useState(1);

  const {
    data: result,
    isLoading,
    error,
  } = usePurchaseRequestsList(filters, page);
  const purchaseRequests = useMemo(() => result?.data ?? [], [result?.data]);
  const deleteMutation = useDeletePurchaseRequest();
  const { confirm } = useConfirm();

  const counts = useMemo(() => {
    let draft = 0;
    let submitted = 0;
    for (const p of purchaseRequests) {
      if (p.status === 'draft') draft++;
      else if (p.status === 'submitted') submitted++;
    }
    return { draft, submitted };
  }, [purchaseRequests]);

  const filterSchema: FilterFieldConfig[] = [
    {
      key: 'search',
      type: 'search',
      label: PR_LABELS.FILTER_SEARCH,
      placeholder: PR_LABELS.FILTER_SEARCH_PLACEHOLDER,
    },
    {
      key: 'status',
      type: 'combobox',
      label: PR_LABELS.FILTER_STATUS,
      options: PR_STATUSES.map((st) => ({
        value: st,
        label: PR_STATUS_LABELS[st] ?? st,
      })),
    },
    {
      key: 'priority',
      type: 'combobox',
      label: PR_LABELS.FILTER_PRIORITY,
      options: PR_PRIORITIES.map((p) => ({
        value: p,
        label: PR_PRIORITY_LABELS[p] ?? p,
      })),
    },
  ];

  function handleFilterChange(key: string, value: string | undefined) {
    setPage(1);
    setFilter(key, value);
  }

  const handleDelete = useCallback(
    async (pr: PurchaseRequest) => {
      const ok = await confirm({
        message: `${PR_LABELS.CONFIRM_DELETE} (${pr.pr_no})`,
        variant: 'danger',
      });
      if (!ok) return;
      try {
        await deleteMutation.mutateAsync(pr.id);
        toast.success(PR_LABELS.DELETE_SUCCESS);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        toast.error(`${PR_LABELS.DELETE_ERROR} ${msg}`);
        console.error('[PRDeleteError]', err);
      }
    },
    [confirm, deleteMutation],
  );

  const columns = useMemo<ColumnDef<PurchaseRequest>[]>(
    () => [
      {
        accessorKey: 'pr_no',
        header: PR_LABELS.COL_PR_NO,
        cell: ({ row }) => (
          <span className="font-bold text-foreground">
            {row.original.pr_no}
          </span>
        ),
      },
      {
        accessorKey: 'requester_dept',
        header: PR_LABELS.COL_DEPT,
        cell: ({ row }) => <span>{row.original.requester_dept ?? 'N/A'}</span>,
      },
      {
        accessorKey: 'priority',
        header: PR_LABELS.COL_PRIORITY,
        cell: ({ row }) => {
          const priority = row.original.priority;
          return (
            <Badge variant={PR_PRIORITY_COLORS[priority] ?? 'gray'}>
              {PR_PRIORITY_LABELS[priority] ?? priority}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'status',
        header: PR_LABELS.COL_STATUS,
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge variant={PR_STATUS_COLORS[status] ?? 'gray'}>
              {PR_STATUS_LABELS[status] ?? status}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'created_at',
        header: PR_LABELS.COL_CREATED_AT,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.created_at)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <div className="text-right">{PR_LABELS.COL_ACTIONS}</div>,
        meta: { className: 'text-right' },
        cell: ({ row }) => {
          const pr = row.original;
          return (
            <div className="flex justify-end">
              <ActionMenu
                items={[
                  {
                    icon: 'Trash2',
                    onClick: () => handleDelete(pr),
                    label: PR_LABELS.ACTION_DELETE,
                    danger: true,
                    disabled: deleteMutation.isPending,
                  },
                ]}
              />
            </div>
          );
        },
      },
    ],
    [handleDelete, deleteMutation.isPending],
  );

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area">
        <AddButton
          onClick={() => navigate('/purchase-requests/create')}
          label={PR_LABELS.ADD_BUTTON}
          icon="ClipboardList"
        />
      </div>

      <KpiGrid>
        <KpiCard
          label={PR_LABELS.KPI_TOTAL}
          value={result?.total ?? 0}
          icon="ClipboardList"
          variant="primary"
          isLoading={isLoading}
        />
        <KpiCard
          label={PR_LABELS.KPI_DRAFT}
          value={counts.draft}
          icon="FileEdit"
          variant={PR_KPI_VARIANTS.draft}
          isLoading={isLoading}
        />
        <KpiCard
          label={PR_LABELS.KPI_SUBMITTED}
          value={counts.submitted}
          icon="Clock"
          variant="warning"
          isLoading={isLoading}
        />
      </KpiGrid>

      <FilterBar
        schema={filterSchema}
        value={filters}
        onChange={handleFilterChange}
        onClear={() => {
          clearFilters();
          setPage(1);
        }}
      />

      {error && (
        <div className="p-4">
          <p className="error-inline">
            {PR_LABELS.ERROR_PREFIX}{' '}
            {error instanceof Error ? error.message : String(error)}
          </p>
        </div>
      )}

      <DataTableAdvanced
        data={purchaseRequests}
        isLoading={isLoading}
        rowKey={(pr) => pr.id}
        emptyStateTitle={
          hasActiveFilter ? PR_LABELS.EMPTY_SEARCH_TITLE : PR_LABELS.EMPTY_TITLE
        }
        emptyStateDescription={
          hasActiveFilter ? PR_LABELS.EMPTY_SEARCH_DESC : PR_LABELS.EMPTY_DESC
        }
        emptyStateIcon={hasActiveFilter ? 'Search' : 'ClipboardList'}
        emptyStateActionLabel={
          !hasActiveFilter ? PR_LABELS.ADD_BUTTON : undefined
        }
        onEmptyStateAction={
          !hasActiveFilter
            ? () => navigate('/purchase-requests/create')
            : undefined
        }
        columns={columns}
        exportFileName="yeu_cau_mua_hang"
        renderMobileCard={(pr) => (
          <div className="mobile-card">
            <div className="mobile-card-header">
              <span className="mobile-card-title">{pr.pr_no}</span>
              <Badge variant={PR_STATUS_COLORS[pr.status] ?? 'gray'}>
                {PR_STATUS_LABELS[pr.status] ?? pr.status}
              </Badge>
            </div>
            <div className="mobile-card-body space-y-2">
              <p className="font-medium">{pr.requester_dept ?? 'N/A'}</p>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <Badge variant={PR_PRIORITY_COLORS[pr.priority] ?? 'gray'}>
                  {PR_PRIORITY_LABELS[pr.priority] ?? pr.priority}
                </Badge>
                <span>{formatDate(pr.created_at)}</span>
              </div>
              <div className="flex justify-end pt-2 border-t border-border/10">
                <Icon
                  name="ChevronRight"
                  size={16}
                  className="text-muted-foreground"
                />
              </div>
            </div>
          </div>
        )}
        pagination={{
          result,
          onPageChange: setPage,
          itemLabel: PR_LABELS.PAGINATION_ITEM,
        }}
      />
    </div>
  );
}
