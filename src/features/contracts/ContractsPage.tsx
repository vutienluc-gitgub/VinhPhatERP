import {
  DataTableAdvanced,
  AddButton,
  FilterBar,
  type FilterFieldConfig,
  PageLayout,
  PageHeader,
  KPISection,
  TableSection,
  KpiCard,
} from '@/shared/components';
import { useUrlFilterState } from '@/shared/hooks/useUrlFilterState';
import { useContractsList } from '@/application/contracts';

import {
  CONTRACT_STATUSES,
  CONTRACT_STATUS_LABELS,
  CONTRACT_TYPES,
  CONTRACT_TYPE_LABELS,
} from './contracts.module';
import type {
  Contract,
  ContractsFilter,
  ContractStatus,
  ContractType,
} from './contracts.module';
import { CONTRACT_MESSAGES as MSG } from './contracts.module';
import { calculateContractKPIs } from './contracts.utils';
import { useContractColumns } from './hooks/useContractColumns';
import { ContractMobileCard } from './components/ContractMobileCard';

type ContractsPageProps = {
  onView?: (contract: Contract) => void;
  onNew?: () => void;
};

export function ContractsPage({ onView, onNew }: ContractsPageProps) {
  const { filters, setFilter, clearFilters } = useUrlFilterState([
    'search',
    'status',
    'type',
    'dateFrom',
    'dateTo',
  ]);

  const {
    data: contracts = [],
    isLoading,
    error,
  } = useContractsList(filters as ContractsFilter);

  const hasFilter = !!(
    filters.search ||
    filters.status ||
    filters.type ||
    filters.dateFrom ||
    filters.dateTo
  );

  const filterSchema: FilterFieldConfig[] = [
    {
      key: 'search',
      type: 'search',
      label: MSG.FILTER_SEARCH,
      placeholder: MSG.FILTER_SEARCH_PLACEHOLDER,
    },
    {
      key: 'status',
      type: 'combobox',
      label: MSG.FILTER_STATUS,
      options: CONTRACT_STATUSES.map((s: ContractStatus) => ({
        value: s,
        label: CONTRACT_STATUS_LABELS[s],
      })),
    },
    {
      key: 'type',
      type: 'combobox',
      label: MSG.FILTER_TYPE,
      options: CONTRACT_TYPES.map((t: ContractType) => ({
        value: t,
        label: CONTRACT_TYPE_LABELS[t],
      })),
    },
    {
      key: 'dateFrom',
      type: 'date',
      label: MSG.FILTER_DATE_FROM,
    },
    {
      key: 'dateTo',
      type: 'date',
      label: MSG.FILTER_DATE_TO,
    },
  ];

  function handleFilterChange(key: string, value: string | undefined) {
    setFilter(key, value);
  }

  const columns = useContractColumns({ onView });
  const kpis = calculateContractKPIs(contracts);

  return (
    <PageLayout>
      <PageHeader
        title={MSG.TITLE}
        subtitle={MSG.SUBTITLE}
        actions={
          <AddButton
            onClick={onNew ?? (() => {})}
            label={MSG.NEW_BUTTON}
            icon="FilePlus"
          />
        }
      />

      <KPISection>
        <div className="kpi-grid">
          <KpiCard
            label={MSG.KPI_TOTAL}
            value={kpis.total}
            icon="FileText"
            variant="primary"
            footer={MSG.KPI_TOTAL_DESC}
            isLoading={isLoading}
          />
          <KpiCard
            label={MSG.KPI_SIGNED}
            value={kpis.signed}
            icon="CheckCircle"
            variant="success"
            footer={MSG.KPI_SIGNED_DESC}
            isLoading={isLoading}
          />
          <KpiCard
            label={MSG.KPI_PENDING}
            value={kpis.pending}
            icon="Clock"
            variant="warning"
            footer={MSG.KPI_PENDING_DESC}
            isLoading={isLoading}
          />
        </div>
      </KPISection>

      <FilterBar
        schema={filterSchema}
        value={filters}
        onChange={handleFilterChange}
        onClear={clearFilters}
      />

      {error && (
        <div className="p-4">
          <p className="error-inline">
            {MSG.ERROR_LOAD}
            {error instanceof Error ? error.message : String(error)}
          </p>
        </div>
      )}

      <TableSection>
        <DataTableAdvanced
          data={contracts}
          isLoading={isLoading}
          rowKey={(c) => c.id}
          onRowClick={onView}
          emptyStateTitle={hasFilter ? MSG.EMPTY_FILTER_TITLE : MSG.EMPTY_TITLE}
          emptyStateDescription={
            hasFilter ? MSG.EMPTY_FILTER_DESC : MSG.EMPTY_DESC
          }
          emptyStateIcon={hasFilter ? 'Search' : 'FileText'}
          emptyStateActionLabel={!hasFilter ? MSG.NEW_BUTTON : undefined}
          onEmptyStateAction={!hasFilter ? onNew : undefined}
          columns={columns}
          renderMobileCard={(c) => <ContractMobileCard contract={c} />}
        />
      </TableSection>
    </PageLayout>
  );
}
