import { useState } from 'react';

import {
  DataTableAdvanced,
  KpiCard,
  AddButton,
  FilterBar,
  type FilterFieldConfig,
  PageLayout,
  PageHeader,
  TableSection,
} from '@/shared/components';
import { useUrlFilterState } from '@/shared/hooks/useUrlFilterState';
import { useDyeingOrderList } from '@/application/production';

import type { DyeingOrder, DyeingOrderFilter } from './types';
import { DYEING_ORDER_MESSAGES as MSG } from './dyeing-orders.constants';
import { useDyeingOrderColumns } from './hooks/useDyeingOrderColumns';
import { DyeingOrderMobileCard } from './components/DyeingOrderMobileCard';

type DyeingOrderListProps = {
  onView: (id: string) => void;
  onEdit: (order: DyeingOrder | null) => void;
};

const filterSchema: FilterFieldConfig[] = [
  {
    key: 'search',
    type: 'search',
    label: MSG.FILTER_SEARCH_LABEL,
    placeholder: MSG.FILTER_SEARCH_PLACEHOLDER,
  },
];

export function DyeingOrderList({ onView, onEdit }: DyeingOrderListProps) {
  const {
    filters: filter,
    setFilter: setFilterValue,
    clearFilters,
    hasActiveFilter,
  } = useUrlFilterState(['search']);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useDyeingOrderList(
    filter as DyeingOrderFilter,
    page,
  );

  const totalCount = data?.total ?? 0;
  const inProgressCount =
    data?.data.filter((o) => o.status === 'in_progress').length ?? 0;
  const draftCount = data?.data.filter((o) => o.status === 'draft').length ?? 0;

  const columns = useDyeingOrderColumns({ onView, onEdit });

  return (
    <PageLayout>
      <PageHeader
        title={MSG.PAGE_TITLE}
        subtitle={MSG.PAGE_SUBTITLE}
        actions={<AddButton onClick={() => onEdit(null)} label={MSG.BTN_NEW} />}
      />

      {/* KPI Dashboard */}
      <div className="kpi-section kpi-grid px-4 sm:px-6 lg:px-8 mt-4">
        <KpiCard
          label={MSG.STAT_TOTAL}
          value={totalCount}
          icon="Layers"
          variant="primary"
        />
        <KpiCard
          label={MSG.STAT_IN_PROGRESS}
          value={inProgressCount}
          icon="Loader2"
          variant="warning"
        />
        <KpiCard
          label={MSG.STAT_DRAFT}
          value={draftCount}
          icon="Pencil"
          variant="secondary"
        />
      </div>

      {/* Filters */}
      <FilterBar
        schema={filterSchema}
        value={filter}
        onChange={(key, val) => {
          setPage(1);
          setFilterValue(key, val as string | undefined);
        }}
        onClear={
          hasActiveFilter
            ? () => {
                clearFilters();
                setPage(1);
              }
            : undefined
        }
      />

      {/* Main Content View */}
      <TableSection>
        <DataTableAdvanced
          data={data?.data ?? []}
          columns={columns}
          isLoading={isLoading}
          rowKey={(row) => row.id}
          onRowClick={(row) => onView(row.id)}
          emptyStateTitle={MSG.EMPTY_STATE_TITLE}
          emptyStateIcon="FileText"
          renderMobileCard={(row: DyeingOrder) => (
            <DyeingOrderMobileCard order={row} />
          )}
          pagination={{
            result: data,
            onPageChange: setPage,
          }}
        />
      </TableSection>
    </PageLayout>
  );
}
