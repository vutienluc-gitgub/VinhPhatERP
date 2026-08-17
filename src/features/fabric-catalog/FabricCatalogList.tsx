import { useState, useMemo, useCallback } from 'react';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import {
  DataTableAdvanced,
  AddButton,
  FilterBar,
  type FilterFieldConfig,
  KpiCard,
  KpiGrid,
  PageHeader,
  KPISection,
  TableSection,
} from '@/shared/components';
import {
  useDeleteFabricCatalog,
  useFabricCatalogList,
  useFabricCategories,
} from '@/application/settings';
import {
  FABRIC_CATALOG_STATUS_LABELS,
  FABRIC_CATALOG_STATUSES,
} from '@/schema/fabric-catalog.schema';
import { useUrlFilterState } from '@/shared/hooks/useUrlFilterState';
import type {
  FabricCatalog,
  FabricCatalogFilter,
  FabricCatalogStatus,
} from '@/domain/settings/fabric-catalog.types';

import { LABELS, MESSAGES } from './fabric-catalog.constants';
import { useFabricCatalogColumns } from './useFabricCatalogColumns';
import { FabricCatalogMobileCard } from './components/FabricCatalogMobileCard';
import { FabricSampleQRModal } from './components/FabricSampleQRModal';

type FabricCatalogListProps = {
  onEdit: (catalog: FabricCatalog) => void;
  onNew: () => void;
};

const FILTER_KEYS = ['search', 'category_id', 'composition', 'status'] as const;

export function FabricCatalogList({ onEdit, onNew }: FabricCatalogListProps) {
  const { filters, setFilter, clearFilters, hasActiveFilter } =
    useUrlFilterState(FILTER_KEYS);
  const [page, setPage] = useState(1);
  const [qrCatalog, setQrCatalog] = useState<FabricCatalog | null>(null);

  const { data: categories } = useFabricCategories();

  const filterSchema = useMemo<FilterFieldConfig[]>(() => {
    return [
      {
        key: 'category_id',
        type: 'combobox',
        label: LABELS.CATEGORY,
        options: categories?.map((c) => ({ value: c.id, label: c.name })) ?? [],
      },
      {
        key: 'composition',
        type: 'search',
        label: LABELS.COMPOSITION,
        placeholder: LABELS.COMPOSITION_PLACEHOLDER,
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
      {
        key: 'search',
        type: 'search',
        label: LABELS.SEARCH,
        placeholder: LABELS.SEARCH_PLACEHOLDER,
      },
    ];
  }, [categories]);

  const apiFilters: FabricCatalogFilter = useMemo(
    () => ({
      search: filters.search,
      category_id: filters.category_id,
      composition: filters.composition,
      status: filters.status as FabricCatalogStatus | undefined,
    }),
    [filters.search, filters.category_id, filters.composition, filters.status],
  );

  const { data, isLoading } = useFabricCatalogList(apiFilters, page);
  const deleteMutation = useDeleteFabricCatalog();
  const { confirm, alert } = useConfirm();

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
        const msg = err instanceof Error ? err.message : String(err);
        await alert(`${LABELS.ERROR_DELETE} ${msg}`);
        console.error('[DeleteFabricCatalogError]', err);
      }
    },
    [confirm, alert, deleteMutation],
  );

  function handleFilterChange(key: string, value: string | undefined) {
    setPage(1);
    setFilter(key, value);
  }

  const columns = useFabricCatalogColumns({
    onEdit,
    setQrCatalog,
    handleDelete,
    isDeleting: deleteMutation.isPending,
  });

  return (
    <>
      {/* Action bar */}
      <PageHeader
        title={LABELS.PAGE_TITLE}
        subtitle={LABELS.PAGE_SUBTITLE}
        actions={<AddButton onClick={onNew} label={LABELS.ADD_NEW} />}
      />

      {/* KPI Dashboard */}
      <KPISection>
        <KpiGrid>
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
        </KpiGrid>
      </KPISection>

      {/* Filter Area (Config-Driven) */}
      <FilterBar
        schema={filterSchema}
        value={filters}
        onChange={handleFilterChange}
        onClear={() => {
          clearFilters();
          setPage(1);
        }}
      />

      {/* Table (DataTableAdvanced) */}
      <TableSection>
        <DataTableAdvanced
          storageKey="fabric-catalog-cols"
          className="flex-1 min-h-0"
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
      </TableSection>

      {qrCatalog && (
        <FabricSampleQRModal
          catalog={qrCatalog}
          onClose={() => setQrCatalog(null)}
        />
      )}
    </>
  );
}
