import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import {
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
import { useRFQsList, useDeleteRFQ } from '@/application/procurement/useRFQs';
import type { SourcingRfq } from '@/api/rfqs.api';
import { RFQ_STATUSES } from '@/schema/sourcing-rfq.schema';

import {
  RFQ_LABELS,
  RFQ_STATUS_LABELS,
  RFQ_STATUS_COLORS,
  RFQ_KPI_VARIANTS,
} from './rfqs.constants';

export function RFQList() {
  const navigate = useNavigate();
  const { filters, setFilter, clearFilters, hasActiveFilter } =
    useUrlFilterState(['search', 'status'] as const, {});
  const [page, setPage] = useState(1);

  const { data: result, isLoading, error } = useRFQsList(filters, page);
  const rfqs = result?.data ?? [];
  const deleteMutation = useDeleteRFQ();
  const { confirm } = useConfirm();

  const filterSchema: FilterFieldConfig[] = [
    {
      key: 'search',
      type: 'search',
      label: RFQ_LABELS.FILTER_SEARCH,
      placeholder: RFQ_LABELS.FILTER_SEARCH_PLACEHOLDER,
    },
    {
      key: 'status',
      type: 'combobox',
      label: RFQ_LABELS.FILTER_STATUS,
      options: RFQ_STATUSES.map((st) => ({
        value: st,
        label: RFQ_STATUS_LABELS[st] ?? st,
      })),
    },
  ];

  function handleFilterChange(key: string, value: string | undefined) {
    setPage(1);
    setFilter(key, value);
  }

  const handleDelete = useCallback(
    async (rfq: SourcingRfq) => {
      const ok = await confirm({
        message: `${RFQ_LABELS.CONFIRM_DELETE} (${rfq.rfq_code})`,
        variant: 'danger',
      });
      if (!ok) return;
      try {
        await deleteMutation.mutateAsync(rfq.id);
      } catch (err) {
        console.error('[RFQDeleteError]', err);
      }
    },
    [confirm, deleteMutation],
  );

  const columns = useMemo<ColumnDef<SourcingRfq>[]>(
    () => [
      {
        accessorKey: 'rfq_code',
        header: RFQ_LABELS.COL_RFQ_CODE,
        cell: ({ row }) => (
          <span className="font-bold text-primary">
            {row.original.rfq_code}
          </span>
        ),
      },
      {
        accessorKey: 'title',
        header: RFQ_LABELS.COL_TITLE,
        cell: ({ row }) => (
          <span className="font-medium">{row.original.title}</span>
        ),
      },
      {
        accessorKey: 'deadline_date',
        header: RFQ_LABELS.COL_DEADLINE,
        cell: ({ row }) => {
          const date = row.original.deadline_date;
          if (!date) return <span className="text-muted">N/A</span>;
          return (
            <span className="text-sm font-mono text-muted">
              {dayjs(date).format('DD/MM/YYYY HH:mm')}
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: RFQ_LABELS.COL_STATUS,
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge variant={RFQ_STATUS_COLORS[status] ?? 'gray'}>
              {RFQ_STATUS_LABELS[status] ?? status}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'created_at',
        header: RFQ_LABELS.COL_CREATED_AT,
        cell: ({ row }) => {
          const date = row.original.created_at;
          if (!date) return <span className="text-muted">N/A</span>;
          return (
            <span className="text-sm text-muted">
              {dayjs(date).format('DD/MM/YYYY')}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: () => (
          <div className="text-right">{RFQ_LABELS.COL_ACTIONS}</div>
        ),
        meta: { className: 'text-right' },
        cell: ({ row }) => {
          const rfq = row.original;
          return (
            <div className="flex justify-end">
              <ActionMenu
                items={[
                  {
                    icon: 'Eye',
                    onClick: () => navigate(`/sourcing-rfqs/${rfq.id}`),
                    label: RFQ_LABELS.ACTION_VIEW,
                  },
                  {
                    icon: 'Trash2',
                    onClick: () => handleDelete(rfq),
                    label: RFQ_LABELS.ACTION_DELETE,
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
    [handleDelete, deleteMutation.isPending, navigate],
  );

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area">
        <AddButton
          onClick={() => navigate('/sourcing-rfqs/create')}
          label={RFQ_LABELS.ADD_BUTTON}
          icon="Plus"
        />
      </div>

      <KpiGrid>
        <KpiCard
          label={RFQ_LABELS.KPI_TOTAL}
          value={result?.total ?? 0}
          icon="Layers"
          variant={RFQ_KPI_VARIANTS.total}
        />
        <KpiCard
          label={RFQ_LABELS.KPI_OPEN}
          value={rfqs.filter((p) => p.status === 'open').length}
          icon="Clock"
          variant={RFQ_KPI_VARIANTS.open}
        />
        <KpiCard
          label={RFQ_LABELS.KPI_CLOSED}
          value={
            rfqs.filter((p) => p.status === 'closed' || p.status === 'awarded')
              .length
          }
          icon="CheckCircle2"
          variant={RFQ_KPI_VARIANTS.closed}
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
            {RFQ_LABELS.ERROR_PREFIX}{' '}
            {error instanceof Error ? error.message : String(error)}
          </p>
        </div>
      )}

      <DataTableAdvanced
        data={rfqs}
        isLoading={isLoading}
        rowKey={(rfq) => rfq.id}
        emptyStateTitle={
          hasActiveFilter
            ? RFQ_LABELS.EMPTY_SEARCH_TITLE
            : RFQ_LABELS.EMPTY_TITLE
        }
        emptyStateDescription={
          hasActiveFilter ? RFQ_LABELS.EMPTY_SEARCH_DESC : RFQ_LABELS.EMPTY_DESC
        }
        emptyStateIcon={hasActiveFilter ? 'Search' : 'Layers'}
        emptyStateActionLabel={
          !hasActiveFilter ? RFQ_LABELS.ADD_BUTTON : undefined
        }
        onEmptyStateAction={
          !hasActiveFilter ? () => navigate('/sourcing-rfqs/create') : undefined
        }
        columns={columns}
        exportFileName="danh_sach_rfq"
        onRowClick={(row) => navigate(`/sourcing-rfqs/${row.id}`)}
        renderMobileCard={(rfq) => (
          <div
            className="mobile-card cursor-pointer"
            onClick={() => navigate(`/sourcing-rfqs/${rfq.id}`)}
          >
            <div className="mobile-card-header">
              <span className="mobile-card-title">{rfq.rfq_code}</span>
              <Badge variant={RFQ_STATUS_COLORS[rfq.status] ?? 'gray'}>
                {RFQ_STATUS_LABELS[rfq.status] ?? rfq.status}
              </Badge>
            </div>
            <div className="mobile-card-body space-y-2">
              <p className="font-medium text-sm line-clamp-1">{rfq.title}</p>
              <div className="flex items-center justify-between text-xs text-muted">
                <span>
                  {RFQ_LABELS.LBL_DEADLINE_SHORT}
                  {rfq.deadline_date
                    ? dayjs(rfq.deadline_date).format('DD/MM/YYYY')
                    : 'N/A'}
                </span>
                <span>
                  {rfq.created_at
                    ? dayjs(rfq.created_at).format('DD/MM/YYYY')
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        )}
        pagination={{
          result,
          onPageChange: setPage,
          itemLabel: RFQ_LABELS.PAGINATION_ITEM,
        }}
      />
    </div>
  );
}
