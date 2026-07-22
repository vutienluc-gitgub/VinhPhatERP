import { useState, useMemo } from 'react';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import {
  DataTable,
  AddButton,
  Button,
  KpiGrid,
  KpiCard,
  FilterBar,
  FadeUp,
  LiveIndicator,
} from '@/shared/components';
import { formatCurrency } from '@/shared/value/core/formatter';
import {
  useRecurringTransactionList,
  useDeleteRecurringTransaction,
  useToggleRecurringTransaction,
  useGenerateDueExpenses,
} from '@/application/recurring-transactions';
import {
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_CATEGORIES,
} from '@/schema/payment.schema';
import type { ExpenseCategory } from '@/schema/payment.schema';
import { isDue } from '@/domain/recurring-transactions';
import type {
  RecurringTransaction,
  RecurringTransactionFilter,
  RecurringQuickFilter,
  RecurringStatusFilter,
  RecurringFrequency,
} from '@/domain/recurring-transactions/types';
import { calculateRecurringMetrics } from '@/domain/recurring-transactions';
import { getErrorMessage } from '@/shared/utils/error';
import { useUrlFilterState } from '@/shared/hooks/useUrlFilterState';
import { useDebouncedValue } from '@/shared/components/filter-bar/useDebouncedValue';
import type { FilterFieldConfig } from '@/shared/components';
import { useContextualGuide } from '@/features/guide-system/hooks/useContextualGuide';
import { ContextualGuide } from '@/features/guide-system/components/ContextualGuide';

import { useRecurringTransactionColumns } from './hooks/useRecurringTransactionColumns';
import {
  RECURRING_LABELS,
  FREQUENCY_OPTIONS,
  STATUS_OPTIONS,
  QUICK_FILTER_OPTIONS,
} from './recurring-transactions.constants';
import { RecurringTransactionForm } from './RecurringTransactionForm';
import { RecurringTransactionMobileCard } from './RecurringTransactionMobileCard';
import { GenerateFeedback } from './GenerateFeedback';

const FILTER_KEYS = [
  'search',
  'category',
  'frequency',
  'status',
  'quick_filter',
] as const;

const VALID_QUICK_FILTERS = new Set<RecurringQuickFilter>([
  'all',
  'overdue',
  'today',
  '7days',
  'active',
]);
const VALID_STATUS_FILTERS = new Set<RecurringStatusFilter>([
  'active',
  'paused',
]);

/** Map URL string params → typed RecurringTransactionFilter for API query. */
function mapUrlToFilter(
  filters: Record<string, string | undefined>,
  debouncedSearch: string | undefined,
): RecurringTransactionFilter {
  const result: RecurringTransactionFilter = {};

  if (debouncedSearch?.trim()) {
    result.search = debouncedSearch.trim();
  }
  if (filters.category) {
    result.category = filters.category as ExpenseCategory;
  }
  if (filters.frequency) {
    result.frequency = filters.frequency as RecurringFrequency;
  }
  if (
    filters.status &&
    VALID_STATUS_FILTERS.has(filters.status as RecurringStatusFilter)
  ) {
    result.status = filters.status as RecurringStatusFilter;
  }
  if (
    filters.quick_filter &&
    VALID_QUICK_FILTERS.has(filters.quick_filter as RecurringQuickFilter)
  ) {
    result.quickFilter = filters.quick_filter as RecurringQuickFilter;
  }

  return result;
}

export function RecurringTransactionsPage() {
  const { filters, setFilter, clearFilters, hasActiveFilter } =
    useUrlFilterState(FILTER_KEYS, {
      quick_filter: 'all',
    });
  const debouncedSearch = useDebouncedValue(filters.search, 300);
  const { activeGuides } = useContextualGuide('RecurringTransactions');

  // Map URL string params → typed filter for server-side query
  const serverFilter = useMemo(
    () => mapUrlToFilter(filters, debouncedSearch),
    [filters, debouncedSearch],
  );

  const {
    data: transactions = [],
    isLoading,
    error,
  } = useRecurringTransactionList(serverFilter);

  const deleteMutation = useDeleteRecurringTransaction();
  const toggleMutation = useToggleRecurringTransaction();
  const generateMutation = useGenerateDueExpenses();
  const { confirm } = useConfirm();

  const [editTransaction, setEditTransaction] =
    useState<RecurringTransaction | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [generateMessage, setGenerateMessage] = useState<string | null>(null);

  const metrics = useMemo(
    () => calculateRecurringMetrics(transactions),
    [transactions],
  );

  const dueCount = useMemo(
    () =>
      transactions.filter((tx) => tx.is_active && isDue(tx.next_run_date))
        .length,
    [transactions],
  );

  const filterSchema: FilterFieldConfig[] = useMemo(
    () => [
      {
        key: 'search',
        label: RECURRING_LABELS.filterSearch,
        type: 'search',
        placeholder: RECURRING_LABELS.searchPlaceholder,
      },
      {
        key: 'quick_filter',
        label: RECURRING_LABELS.filterQuick,
        type: 'combobox',
        options: QUICK_FILTER_OPTIONS,
      },
      {
        key: 'category',
        label: RECURRING_LABELS.filterCategory,
        type: 'combobox',
        options: EXPENSE_CATEGORIES.map((c) => ({
          value: c,
          label: EXPENSE_CATEGORY_LABELS[c],
        })),
      },
      {
        key: 'frequency',
        label: RECURRING_LABELS.filterFrequency,
        type: 'combobox',
        options: FREQUENCY_OPTIONS,
      },
      {
        key: 'status',
        label: RECURRING_LABELS.filterStatus,
        type: 'combobox',
        options: STATUS_OPTIONS,
      },
    ],
    [],
  );

  const columns = useRecurringTransactionColumns({
    handleToggle,
    handleOpenForm,
    handleDelete,
    togglePending: toggleMutation.isPending,
    deletePending: deleteMutation.isPending,
  });

  async function handleDelete(tx: RecurringTransaction) {
    const ok = await confirm({
      message: RECURRING_LABELS.deleteConfirm(tx.name),
      variant: 'danger',
    });
    if (!ok) return;
    deleteMutation.mutate(tx.id);
  }

  function handleToggle(tx: RecurringTransaction) {
    toggleMutation.mutate({ id: tx.id, isActive: !tx.is_active });
  }

  async function handleGenerate() {
    setGenerateMessage(null);
    try {
      const result = await generateMutation.mutateAsync();
      let msg =
        result.generatedCount > 0
          ? RECURRING_LABELS.generateSuccess(result.generatedCount)
          : RECURRING_LABELS.generateNone;

      if (result.errors.length > 0) {
        const errorSummary = result.errors.map((e) => e.error).join('; ');
        msg = `${msg} (${RECURRING_LABELS.errorPrefix}: ${errorSummary})`;
      }
      setGenerateMessage(msg);
    } catch (err) {
      setGenerateMessage(
        `${RECURRING_LABELS.errorPrefix}: ${getErrorMessage(err)}`,
      );
    }
  }

  function handleOpenForm(tx: RecurringTransaction | null) {
    setEditTransaction(tx);
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditTransaction(null);
  }

  return (
    <div className="page-container flex flex-col gap-6">
      <div className="panel-card card-flush">
        {/* Header Area */}
        <div className="card-header-area">
          <div className="flex items-center gap-2">
            <LiveIndicator label="Trực tiếp" />
            <h3 className="text-xl font-bold text-text m-0">
              {RECURRING_LABELS.pageTitle}
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              onClick={handleGenerate}
              disabled={generateMutation.isPending || dueCount === 0}
              leftIcon={dueCount > 0 ? 'Zap' : undefined}
            >
              {generateMutation.isPending
                ? RECURRING_LABELS.generatingButton
                : dueCount > 0
                  ? `${RECURRING_LABELS.generateButton} ${dueCount} ${RECURRING_LABELS.generateButtonSuffix}`
                  : RECURRING_LABELS.generateNoneButton}
            </Button>
            <AddButton
              onClick={() => handleOpenForm(null)}
              label={RECURRING_LABELS.addButton}
            />
          </div>
        </div>

        <GenerateFeedback message={generateMessage} />

        {/* KPI Dashboard */}
        <div className="kpi-section">
          <KpiGrid>
            <KpiCard
              label={RECURRING_LABELS.kpiTotal}
              value={metrics.totalCount}
              icon="Layers"
              isLoading={isLoading}
              onClick={() => setFilter('quick_filter', 'all')}
            />
            <KpiCard
              label={RECURRING_LABELS.kpiDueSoon}
              value={metrics.dueSoonCount}
              icon="Clock"
              trendValue={RECURRING_LABELS.kpiDueSoonDesc}
              trendDirection="up"
              isLoading={isLoading}
              onClick={() => setFilter('quick_filter', '7days')}
            />
            <KpiCard
              label={RECURRING_LABELS.kpiOverdue}
              value={metrics.overdueCount}
              icon="AlertTriangle"
              variant={metrics.overdueCount > 0 ? 'danger' : 'primary'}
              isLoading={isLoading}
              onClick={() => setFilter('quick_filter', 'overdue')}
            />
            <KpiCard
              label={RECURRING_LABELS.kpiMonthlyAmount}
              value={metrics.totalCurrentMonthAmount}
              formatMode="currency"
              icon="TrendingUp"
              isLoading={isLoading}
              // eslint-disable-next-line no-restricted-syntax
              trendValue={`${RECURRING_LABELS.kpiNextMonthEst}: ${formatCurrency(metrics.totalEstimatedNextMonthAmount)}đ`}
              trendDirection="up"
            />
          </KpiGrid>
        </div>

        {/* Error */}
        {error && (
          <div>
            <p className="error-inline">
              {RECURRING_LABELS.errorLoadData}: {getErrorMessage(error)}
            </p>
          </div>
        )}

        {/* Filter Bar */}
        <FadeUp delay={0.1}>
          <FilterBar
            schema={filterSchema}
            value={filters}
            onChange={setFilter}
            onClear={clearFilters}
            variant="inline"
          />

          {/* Data Table */}
          <DataTable
            data={transactions}
            isLoading={isLoading}
            rowKey={(tx) => tx.id}
            emptyStateTitle={
              hasActiveFilter
                ? RECURRING_LABELS.emptyFilterTitle
                : RECURRING_LABELS.emptyTitle
            }
            emptyStateDescription={
              hasActiveFilter ? '' : RECURRING_LABELS.emptyDescription
            }
            emptyStateIcon="CalendarClock"
            emptyStateActionLabel={
              hasActiveFilter
                ? RECURRING_LABELS.emptyFilterAction
                : RECURRING_LABELS.emptyAction
            }
            onEmptyStateAction={() =>
              hasActiveFilter ? clearFilters() : handleOpenForm(null)
            }
            columns={columns}
            renderMobileCard={(tx) => (
              <RecurringTransactionMobileCard
                tx={tx}
                onToggle={handleToggle}
                onEdit={(t) => handleOpenForm(t)}
                onDelete={handleDelete}
                togglePending={toggleMutation.isPending}
                deletePending={deleteMutation.isPending}
              />
            )}
          />
        </FadeUp>

        {deleteMutation.error && (
          <div>
            <p className="error-inline-sm">
              {RECURRING_LABELS.errorPrefix}:{' '}
              {getErrorMessage(deleteMutation.error)}
            </p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <RecurringTransactionForm
          transaction={editTransaction}
          onClose={handleCloseForm}
        />
      )}

      {/* Guide System Integration */}
      <ContextualGuide activeGuides={activeGuides} />
    </div>
  );
}
