import { useState, useMemo, useCallback, type ReactNode } from 'react';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import {
  FilterBar,
  type FilterFieldConfig,
  EmptyState,
  PageLayout,
  PageHeader,
  TableSection,
  Pagination,
  Icon,
} from '@/shared/components';
import { useDeleteLoom, useLoomList } from '@/application/settings';
import type { LoomStatus, LoomType } from '@/schema/loom.schema';
import {
  LOOM_STATUS_LABELS,
  LOOM_STATUSES,
  LOOM_TYPE_LABELS,
  LOOM_TYPES,
} from '@/schema/loom.schema';
import { useUrlFilterState } from '@/shared/hooks/useUrlFilterState';

import type { LoomWithSupplier, LoomFilter } from './types';
import { LoomCompactCard } from './components/LoomCompactCard';
import { LOOM_MESSAGES as MSG } from './loom.constants';

type LoomListProps = {
  onEdit: (loom: LoomWithSupplier) => void;
  onNew: () => void;
  tabs?: ReactNode;
};

const FILTER_KEYS = ['search', 'status', 'loom_type'] as const;

const FILTER_SCHEMA: FilterFieldConfig[] = [
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
    options: LOOM_STATUSES.map((st) => ({
      value: st,
      label: LOOM_STATUS_LABELS[st],
    })),
  },
  {
    key: 'loom_type',
    type: 'combobox',
    label: MSG.FILTER_TYPE_LABEL,
    options: LOOM_TYPES.map((t) => ({
      value: t,
      label: LOOM_TYPE_LABELS[t],
    })),
  },
];

export function LoomList({ onEdit, onNew, tabs }: LoomListProps) {
  const { filters, setFilter, clearFilters, hasActiveFilter } =
    useUrlFilterState(FILTER_KEYS);
  const [page, setPage] = useState(1);

  const apiFilters: LoomFilter = useMemo(
    () => ({
      search: filters.search,
      status: filters.status as LoomStatus | undefined,
      loom_type: filters.loom_type as LoomType | undefined,
    }),
    [filters.search, filters.status, filters.loom_type],
  );

  const { data, isLoading } = useLoomList(apiFilters, page);
  const deleteMutation = useDeleteLoom();
  const { confirm } = useConfirm();

  const looms = useMemo(() => data?.data ?? [], [data?.data]);
  const runningCount = useMemo(
    () => looms.filter((l) => l.status === 'running').length,
    [looms],
  );
  const idleCount = useMemo(
    () => looms.filter((l) => l.status === 'idle').length,
    [looms],
  );
  const breakdownCount = useMemo(
    () => looms.filter((l) => l.status === 'breakdown').length,
    [looms],
  );

  function handleFilterChange(key: string, value: string | undefined) {
    setPage(1);
    setFilter(key, value);
  }

  const handleDelete = useCallback(
    async (loom: LoomWithSupplier) => {
      const ok = await confirm({
        message: MSG.CONFIRM_DELETE_MSG(loom.name),
        variant: 'danger',
      });
      if (!ok) return;
      deleteMutation.mutate(loom.id);
    },
    [confirm, deleteMutation],
  );

  return (
    <PageLayout>
      <PageHeader
        title={MSG.PAGE_TITLE}
        subtitle={MSG.PAGE_SUBTITLE}
        actions={
          <button
            type="button"
            className="btn-primary flex items-center gap-2"
            onClick={onNew}
          >
            <Icon name="Plus" size={18} />
            {MSG.BTN_CREATE}
          </button>
        }
      />

      <div className="stats-grid-premium px-4 sm:px-6 lg:px-8 mt-4">
        <div className="stat-item-premium">
          <div className="stat-icon-wrapper bg-[rgba(11,107,203,0.1)] text-[var(--primary)]">
            <Icon name="Cog" size={24} />
          </div>
          <div className="stat-content-premium">
            <p>{MSG.KPI_TOTAL}</p>
            <p>{data?.total ?? 0}</p>
          </div>
        </div>

        <div className="stat-item-premium">
          <div className="stat-icon-wrapper bg-[rgba(10,128,92,0.1)] text-[var(--success)]">
            <Icon name="Activity" size={24} />
          </div>
          <div className="stat-content-premium">
            <p>{MSG.KPI_RUNNING}</p>
            <p>{runningCount}</p>
          </div>
        </div>

        <div className="stat-item-premium">
          <div className="stat-icon-wrapper bg-[rgba(99,102,241,0.1)] text-indigo-500">
            <Icon name="Coffee" size={24} />
          </div>
          <div className="stat-content-premium">
            <p>{MSG.KPI_IDLE}</p>
            <p>{idleCount}</p>
          </div>
        </div>

        <div className="stat-item-premium">
          <div className="stat-icon-wrapper bg-[rgba(239,68,68,0.1)] text-[var(--danger)]">
            <Icon name="AlertTriangle" size={24} />
          </div>
          <div className="stat-content-premium">
            <p>{MSG.KPI_BREAKDOWN}</p>
            <p>{breakdownCount}</p>
          </div>
        </div>
      </div>
      {tabs}
      <TableSection>
        <div className="w-full px-4 sm:px-6 lg:px-8 mt-2 pb-4 border-b border-border flex flex-col gap-4">
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

        <div className="p-4">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-48 rounded-xl bg-surface-subtle animate-pulse border border-border/40"
                ></div>
              ))}
            </div>
          ) : looms.length === 0 ? (
            <div className="py-20 border border-border/50 rounded-xl">
              <EmptyState
                icon={hasActiveFilter ? 'Search' : 'Cog'}
                title={
                  hasActiveFilter
                    ? MSG.EMPTY_STATE_FILTER_TITLE
                    : MSG.EMPTY_STATE_TITLE
                }
                actionLabel={
                  !hasActiveFilter ? `+ ${MSG.BTN_CREATE}` : undefined
                }
                actionClick={!hasActiveFilter ? onNew : undefined}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {looms.map((loom) => (
                <LoomCompactCard
                  key={loom.id}
                  loom={loom}
                  onEdit={onEdit}
                  onDelete={handleDelete}
                  isDeleting={deleteMutation.isPending}
                />
              ))}
            </div>
          )}
        </div>

        {data && data.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-border/50">
            <Pagination
              result={data}
              onPageChange={setPage}
              itemLabel={MSG.PAGINATION_LABEL}
            />
          </div>
        )}
      </TableSection>
    </PageLayout>
  );
}
