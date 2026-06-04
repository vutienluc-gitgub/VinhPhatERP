import { useState, useMemo, useCallback } from 'react';
import type { ColumnDef } from '@tanstack/react-table';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import {
  Icon,
  Badge,
  type BadgeVariant,
  DataTableAdvanced,
  AddButton,
  ActionBar,
  FilterBar,
  type FilterFieldConfig,
  KpiCard,
} from '@/shared/components';
import {
  useDeleteFabricCatalog,
  useFabricCatalogList,
} from '@/application/settings';
import {
  FABRIC_CATALOG_STATUS_LABELS,
  FABRIC_CATALOG_STATUSES,
} from '@/schema/fabric-catalog.schema';
import { useUrlFilterState } from '@/shared/hooks/useUrlFilterState';

import { LABELS, MESSAGES } from './fabric-catalog.constants';
import type {
  FabricCatalog,
  FabricCatalogFilter,
  FabricCatalogStatus,
} from './types';
import { FabricCatalogMobileCard } from './components/FabricCatalogMobileCard';
import { FabricSampleQRModal } from './components/FabricSampleQRModal';

type FabricCatalogListProps = {
  onEdit: (catalog: FabricCatalog) => void;
  onNew: () => void;
};

function getStatusVariant(status: FabricCatalogStatus): BadgeVariant {
  return status === 'active' ? 'success' : 'gray';
}

const FILTER_KEYS = ['search', 'status'] as const;

const FILTER_SCHEMA: FilterFieldConfig[] = [
  {
    key: 'search',
    type: 'search',
    label: LABELS.SEARCH,
    placeholder: LABELS.SEARCH_PLACEHOLDER,
  },
  {
    key: 'status',
    type: 'combobox',
    label: LABELS.STATUS,
    options: FABRIC_CATALOG_STATUSES.map((st) => ({
      value: st,
      label: FABRIC_CATALOG_STATUS_LABELS[st],
    })),
  },
];

export function FabricCatalogList({ onEdit, onNew }: FabricCatalogListProps) {
  const { filters, setFilter, clearFilters, hasActiveFilter } =
    useUrlFilterState(FILTER_KEYS);
  const [page, setPage] = useState(1);
  const [qrCatalog, setQrCatalog] = useState<FabricCatalog | null>(null);

  const apiFilters: FabricCatalogFilter = useMemo(
    () => ({
      search: filters.search,
      status: filters.status as FabricCatalogStatus | undefined,
    }),
    [filters.search, filters.status],
  );

  const { data, isLoading } = useFabricCatalogList(apiFilters, page);
  const deleteMutation = useDeleteFabricCatalog();
  const { confirm } = useConfirm();

  const catalogs = useMemo(() => data?.data ?? [], [data?.data]);
  const activeCount = useMemo(
    () => catalogs.filter((c) => c.status === 'active').length,
    [catalogs],
  );

  const handleDelete = useCallback(
    async (catalog: FabricCatalog) => {
      try {
        const ok = await confirm({
          message: MESSAGES.CONFIRM_DELETE(catalog.name),
          variant: 'danger',
        });
        if (!ok) return;
        await deleteMutation.mutateAsync(catalog.id);
      } catch (err) {
        console.error('[DeleteFabricCatalogError]', err);
      }
    },
    [confirm, deleteMutation],
  );

  function handleFilterChange(key: string, value: string | undefined) {
    setPage(1);
    setFilter(key, value);
  }

  const columns = useMemo<ColumnDef<FabricCatalog>[]>(
    () => [
      {
        id: 'thumbnail',
        header: '',
        meta: { className: 'w-20' },
        cell: ({ row }) => {
          const c = row.original;
          return c.image_url ? (
            <img
              src={c.image_url}
              alt={c.name}
              className="w-10 h-10 rounded object-cover shrink-0"
              loading="lazy"
            />
          ) : (
            <div className="w-10 h-10 rounded bg-surface-subtle flex items-center justify-center shrink-0">
              <Icon name="Image" size={16} className="text-muted" />
            </div>
          );
        },
      },
      {
        accessorKey: 'code',
        header: LABELS.CODE,
        cell: ({ row }) => (
          <span className="font-bold text-primary">{row.original.code}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: LABELS.NAME,
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: 'composition',
        header: LABELS.COMPOSITION,
        cell: ({ row }) => (
          <span className="text-muted text-sm italic">
            {row.original.composition ?? LABELS.NA}
          </span>
        ),
      },
      {
        id: 'specs',
        header: LABELS.SPECS,
        enableSorting: false,
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div className="flex flex-col gap-0.5 text-sm">
              <span className="text-muted">
                {LABELS.WIDTH}:{' '}
                <span className="font-medium text-text">
                  {c.target_width_cm ? `${c.target_width_cm} cm` : LABELS.NA}
                </span>
              </span>
              <span className="text-muted">
                {LABELS.GSM}:{' '}
                <span className="font-medium text-text">
                  {c.target_gsm ? `${c.target_gsm} gsm` : LABELS.NA}
                </span>
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'unit',
        header: LABELS.UNIT,
        cell: ({ row }) => <span className="text-sm">{row.original.unit}</span>,
      },
      {
        accessorKey: 'status',
        header: LABELS.STATUS,
        cell: ({ row }) => {
          const c = row.original;
          return (
            <Badge variant={getStatusVariant(c.status)}>
              {FABRIC_CATALOG_STATUS_LABELS[c.status]}
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        header: () => <div className="text-right">{LABELS.ACTIONS}</div>,
        meta: { className: 'text-right' },
        cell: ({ row }) => {
          const c = row.original;
          return (
            <ActionBar
              actions={[
                {
                  icon: 'Pencil',
                  onClick: () => onEdit(c),
                  title: LABELS.EDIT,
                },
                {
                  icon: 'QrCode',
                  onClick: () => setQrCatalog(c),
                  title: LABELS.PRINT_QR,
                },
                {
                  icon: 'Trash2',
                  onClick: () => handleDelete(c),
                  title: LABELS.DELETE,
                  variant: 'danger',
                  disabled: deleteMutation.isPending,
                },
              ]}
            />
          );
        },
      },
    ],
    [onEdit, handleDelete, deleteMutation.isPending],
  );

  return (
    <div className="panel-card card-flush">
      {/* Action bar */}
      <div className="card-header-area">
        <AddButton onClick={onNew} label={LABELS.ADD_NEW} />
      </div>

      {/* KPI Dashboard */}
      <div className="kpi-section kpi-grid">
        <KpiCard
          label={LABELS.TOTAL_CATALOGS}
          value={data?.total ?? 0}
          icon="Layers"
          variant="primary"
          formatMode="number"
          footer={LABELS.TOTAL_CATALOGS_DESC}
        />
        <KpiCard
          label={LABELS.ACTIVE}
          value={activeCount}
          icon="Activity"
          variant="success"
          formatMode="number"
          footer={LABELS.ACTIVE_DESC}
        />
        <KpiCard
          label={LABELS.MAIN_COMPOSITION}
          value="Cotton/Pol"
          icon="Zap"
          variant="secondary"
          footer={LABELS.MAIN_COMPOSITION_DESC}
        />
      </div>

      {/* Filters (Config-Driven) */}
      <div className="flex flex-wrap items-start gap-3 px-4 py-3 border-b border-border/50 overflow-visible">
        <FilterBar
          variant="inline"
          schema={FILTER_SCHEMA}
          value={filters}
          onChange={handleFilterChange}
          onClear={() => {
            clearFilters();
            setPage(1);
          }}
        />
      </div>

      {/* Table (DataTableAdvanced) */}
      <DataTableAdvanced
        data={catalogs}
        isLoading={isLoading}
        rowKey={(c) => c.id}
        onRowClick={onEdit}
        emptyStateTitle={
          hasActiveFilter ? LABELS.EMPTY_SEARCH : LABELS.EMPTY_LIST
        }
        emptyStateIcon={hasActiveFilter ? 'Search' : 'Layers'}
        emptyStateActionLabel={
          !hasActiveFilter ? LABELS.ADD_NEW_BTN : undefined
        }
        onEmptyStateAction={!hasActiveFilter ? onNew : undefined}
        columns={columns}
        exportFileName="danh_muc_loai_vai"
        renderMobileCard={(c) => (
          <FabricCatalogMobileCard
            catalog={c}
            onEdit={onEdit}
            onDelete={handleDelete}
            onShowQR={() => setQrCatalog(c)}
            isDeleting={deleteMutation.isPending}
          />
        )}
        pagination={{
          result: data,
          onPageChange: setPage,
          itemLabel: LABELS.ITEM_LABEL,
        }}
      />

      {qrCatalog && (
        <FabricSampleQRModal
          catalog={qrCatalog}
          onClose={() => setQrCatalog(null)}
        />
      )}
    </div>
  );
}
