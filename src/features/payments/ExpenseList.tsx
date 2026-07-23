import { useState } from 'react';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import {
  DataTableAdvanced,
  AddButton,
  FilterBar,
  type FilterFieldConfig,
  PageLayout,
  PageHeader,
  TableSection,
} from '@/shared/components';
import { useUrlFilterState } from '@/shared/hooks/useUrlFilterState';
import { useDeleteExpense, useExpenseList } from '@/application/payments';

import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS } from './payments.module';
import type { Expense, ExpensesFilter } from './types';
import { useExpenseColumns } from './hooks/useExpenseColumns';
import { ExpenseMobileCard } from './components/ExpenseMobileCard';
import { EXPENSE_MESSAGES as MSG } from './payments.constants';

type ExpenseListProps = {
  onEdit: (expense: Expense) => void;
  onNew: () => void;
};

export function ExpenseList({ onEdit, onNew }: ExpenseListProps) {
  const { filters, setFilter, clearFilters } = useUrlFilterState([
    'search',
    'category',
    'fromDate',
    'toDate',
  ]);
  const [page, setPage] = useState(1);

  const {
    data: result,
    isLoading,
    error,
  } = useExpenseList(filters as ExpensesFilter, page);
  const expenses = result?.data ?? [];
  const deleteMutation = useDeleteExpense();
  const { confirm } = useConfirm();

  const filterSchema: FilterFieldConfig[] = [
    {
      key: 'search',
      type: 'search',
      label: MSG.FILTER_SEARCH_LABEL,
      placeholder: MSG.FILTER_SEARCH_PLACEHOLDER,
    },
    {
      key: 'category',
      type: 'combobox',
      label: MSG.FILTER_CATEGORY,
      options: EXPENSE_CATEGORIES.map((c) => ({
        value: c,
        label: EXPENSE_CATEGORY_LABELS[c],
      })),
    },
    {
      key: 'expense_date', // Used merely for identification, date_range fields use keyFrom/keyTo
      type: 'date_range',
      label: MSG.FILTER_DATE,
      keyFrom: 'fromDate',
      keyTo: 'toDate',
    },
  ];

  function handleFilterChange(key: string, value: string | undefined) {
    setPage(1);
    setFilter(key, value);
  }

  async function handleDelete(expense: Expense) {
    const ok = await confirm({
      message: MSG.DELETE_CONFIRM(expense.expense_number),
      variant: 'danger',
    });
    if (!ok) return;
    deleteMutation.mutate(expense.id);
  }

  const hasFilter = !!(
    filters.search ||
    filters.category ||
    filters.fromDate ||
    filters.toDate
  );

  const columns = useExpenseColumns({
    onEdit,
    handleDelete,
    isDeleting: deleteMutation.isPending,
  });

  return (
    <PageLayout>
      <PageHeader
        title={MSG.TITLE}
        subtitle={MSG.SUBTITLE}
        actions={<AddButton onClick={onNew} label={MSG.BTN_ADD} />}
      />

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
            {MSG.ERROR_LOAD}
            {error instanceof Error ? error.message : String(error)}
          </p>
        </div>
      )}

      {deleteMutation.error && (
        <div className="p-4 pt-0">
          <p className="error-inline-sm">
            {MSG.ERROR_DELETE}
            {deleteMutation.error instanceof Error
              ? deleteMutation.error.message
              : String(deleteMutation.error)}
          </p>
        </div>
      )}

      <TableSection>
        <DataTableAdvanced
          data={expenses}
          isLoading={isLoading}
          rowKey={(exp) => exp.id}
          emptyStateTitle={hasFilter ? MSG.EMPTY_TITLE_FILTER : MSG.EMPTY_TITLE}
          emptyStateDescription={
            hasFilter ? MSG.EMPTY_DESC_FILTER : MSG.EMPTY_DESC
          }
          emptyStateIcon={hasFilter ? 'Search' : 'ReceiptText'}
          emptyStateActionLabel={!hasFilter ? MSG.EMPTY_ACTION : undefined}
          onEmptyStateAction={!hasFilter ? onNew : undefined}
          columns={columns}
          renderMobileCard={(exp) => (
            <ExpenseMobileCard
              expense={exp}
              onEdit={onEdit}
              handleDelete={handleDelete}
              isDeleting={deleteMutation.isPending}
            />
          )}
          pagination={{
            result,
            onPageChange: setPage,
            itemLabel: MSG.PAGINATION_LABEL,
          }}
        />
      </TableSection>
    </PageLayout>
  );
}
