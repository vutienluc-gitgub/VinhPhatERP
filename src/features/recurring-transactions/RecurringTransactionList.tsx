import { useState, useMemo } from 'react';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import {
  Badge,
  DataTable,
  AddButton,
  ActionBar,
  Button,
  KpiGrid,
  KpiCard,
  FilterBar,
} from '@/shared/components';
import type { IconName } from '@/shared/components/Icon';
import { formatCurrency } from '@/shared/utils/format';
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
import {
  getRecurringStatus,
  isDue,
  getRelativeDays,
  getRelativeDateColor,
} from '@/domain/recurring-transactions';
import type { RecurringTransaction } from '@/domain/recurring-transactions/types';
import { calculateRecurringMetrics } from '@/domain/recurring-transactions';
import { getErrorMessage } from '@/shared/utils/error';
import { useUrlFilterState } from '@/shared/hooks/useUrlFilterState';
import { useDebouncedValue } from '@/shared/components/filter-bar/useDebouncedValue';
import type { FilterFieldConfig } from '@/shared/components';

import { useRecurringTransactionFilter } from './hooks/useRecurringTransactionFilter';
import {
  FREQUENCY_LABELS,
  RECURRING_STATUS_BADGE,
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

export function RecurringTransactionList() {
  const { filters, setFilter, clearFilters, hasActiveFilter } =
    useUrlFilterState(FILTER_KEYS, {
      quick_filter: 'all',
    });
  const debouncedSearch = useDebouncedValue(filters.search, 300);

  const {
    data: transactions = [],
    isLoading,
    error,
  } = useRecurringTransactionList();

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

  // Client-side filtering
  const filteredData = useRecurringTransactionFilter(
    transactions,
    filters,
    debouncedSearch,
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
        label: 'Tìm kiếm',
        type: 'search',
        placeholder: 'Tên nghiệp vụ...',
      },
      {
        key: 'quick_filter',
        label: 'Lọc nhanh',
        type: 'combobox',
        options: QUICK_FILTER_OPTIONS,
      },
      {
        key: 'category',
        label: 'Danh mục',
        type: 'combobox',
        options: EXPENSE_CATEGORIES.map((c) => ({
          value: c,
          label: EXPENSE_CATEGORY_LABELS[c],
        })),
      },
      {
        key: 'frequency',
        label: 'Tần suất',
        type: 'combobox',
        options: FREQUENCY_OPTIONS,
      },
      {
        key: 'status',
        label: 'Trạng thái',
        type: 'combobox',
        options: STATUS_OPTIONS,
      },
    ],
    [],
  );

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
      {/* Header Area */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 sm:px-0">
        <h3 className="text-xl font-bold text-text m-0">
          {RECURRING_LABELS.pageTitle}
        </h3>
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
      <KpiGrid className="px-4 sm:px-0">
        <KpiCard
          label={RECURRING_LABELS.kpiTotal}
          value={metrics.totalCount}
          icon="Layers"
          onClick={() => setFilter('quick_filter', 'all')}
        />
        <KpiCard
          label={RECURRING_LABELS.kpiDueSoon}
          value={metrics.dueSoonCount}
          icon="Clock"
          trendValue={RECURRING_LABELS.kpiDueSoonDesc}
          trendDirection="up"
          onClick={() => setFilter('quick_filter', '7days')}
        />
        <KpiCard
          label={RECURRING_LABELS.kpiOverdue}
          value={metrics.overdueCount}
          icon="AlertTriangle"
          variant={metrics.overdueCount > 0 ? 'danger' : 'primary'}
          onClick={() => setFilter('quick_filter', 'overdue')}
        />
        <KpiCard
          label={RECURRING_LABELS.kpiMonthlyAmount}
          value={metrics.totalCurrentMonthAmount}
          formatMode="currency"
          icon="TrendingUp"
          trendValue={`${RECURRING_LABELS.kpiNextMonthEst}: ${formatCurrency(metrics.totalEstimatedNextMonthAmount)}đ`}
          trendDirection="up"
        />
      </KpiGrid>

      {/* Error */}
      {error && (
        <div className="p-4">
          <p className="error-inline">
            {RECURRING_LABELS.errorLoadData}: {getErrorMessage(error)}
          </p>
        </div>
      )}

      {/* Filter Bar */}
      <FilterBar
        schema={filterSchema}
        value={filters}
        onChange={setFilter}
        onClear={clearFilters}
        variant="inline"
      />

      {/* Data Table */}
      <DataTable
        data={filteredData}
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
        columns={[
          {
            header: RECURRING_LABELS.headerName,
            id: 'name',
            sortable: true,
            cell: (tx) => {
              const status = getRecurringStatus(tx);
              const badge = RECURRING_STATUS_BADGE[status];
              return (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{tx.name}</span>
                    <Badge
                      variant={badge.variant}
                      icon={badge.icon as IconName}
                    >
                      {badge.label}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted line-clamp-1">
                    {tx.description}
                  </span>
                </div>
              );
            },
          },
          {
            header: RECURRING_LABELS.headerCategory,
            id: 'category',
            sortable: true,
            cell: (tx) => (
              <Badge variant="info">
                {EXPENSE_CATEGORY_LABELS[tx.category]}
              </Badge>
            ),
          },
          {
            header: RECURRING_LABELS.headerAmount,
            id: 'amount',
            sortable: true,
            className: 'text-right',
            cell: (tx) => (
              <span className="font-bold text-text">
                {formatCurrency(tx.amount)}đ
              </span>
            ),
          },
          {
            header: RECURRING_LABELS.headerFrequency,
            id: 'frequency',
            sortable: true,
            cell: (tx) => (
              <div className="flex flex-col">
                <span>{FREQUENCY_LABELS[tx.frequency]}</span>
                <span className="text-xs text-muted">
                  {RECURRING_LABELS.dayPrefix} {tx.day_of_month}
                </span>
              </div>
            ),
          },
          {
            header: RECURRING_LABELS.headerNextDate,
            id: 'next_run_date',
            sortable: true,
            cell: (tx) => {
              if (!tx.is_active) {
                return (
                  <span className="text-muted italic">
                    {new Date(tx.next_run_date).toLocaleDateString('vi-VN')}
                  </span>
                );
              }
              const days = getRelativeDays(tx.next_run_date);
              const colorVariant = getRelativeDateColor(days);
              let relativeText = '';
              if (days < 0) relativeText = RECURRING_LABELS.daysOverdue(days);
              else if (days === 0) relativeText = RECURRING_LABELS.daysToday;
              else relativeText = RECURRING_LABELS.daysRemaining(days);

              const colorClass =
                colorVariant === 'danger'
                  ? 'text-danger font-bold'
                  : colorVariant === 'warning'
                    ? 'text-[var(--warning)] font-semibold'
                    : colorVariant === 'info'
                      ? 'text-[var(--primary)] font-semibold'
                      : 'text-[var(--success)]';

              return (
                <div className="flex flex-col gap-0.5">
                  <span className={colorClass}>{relativeText}</span>
                  <span className="text-xs text-muted">
                    {new Date(tx.next_run_date).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              );
            },
          },
          {
            header: RECURRING_LABELS.headerTarget,
            id: 'supplier',
            cell: (tx) => (
              <div className="flex flex-col text-sm">
                {tx.suppliers?.name && (
                  <span className="text-muted">
                    {RECURRING_LABELS.supplierPrefix}: {tx.suppliers.name}
                  </span>
                )}
                {tx.employees?.name && (
                  <span className="text-muted">
                    {RECURRING_LABELS.employeePrefix}: {tx.employees.name}
                  </span>
                )}
                {!tx.suppliers?.name && !tx.employees?.name && (
                  <span className="text-muted">—</span>
                )}
              </div>
            ),
          },
          {
            header: RECURRING_LABELS.headerActions,
            className: 'text-right',
            onCellClick: () => {},
            cell: (tx) => (
              <ActionBar
                actions={[
                  {
                    icon: tx.is_active ? 'Pause' : 'Play',
                    onClick: () => handleToggle(tx),
                    title: tx.is_active
                      ? RECURRING_LABELS.actionPause
                      : RECURRING_LABELS.actionActivate,
                    disabled: toggleMutation.isPending,
                  },
                  {
                    icon: 'Pencil',
                    onClick: () => handleOpenForm(tx),
                    title: RECURRING_LABELS.actionEdit,
                  },
                  {
                    icon: 'Trash2',
                    onClick: () => handleDelete(tx),
                    title: RECURRING_LABELS.actionDelete,
                    variant: 'danger',
                    disabled: deleteMutation.isPending,
                  },
                ]}
              />
            ),
          },
        ]}
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

      {deleteMutation.error && (
        <div className="px-4 pb-4">
          <p className="error-inline-sm">
            {RECURRING_LABELS.errorPrefix}:{' '}
            {getErrorMessage(deleteMutation.error)}
          </p>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <RecurringTransactionForm
          transaction={editTransaction}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}
