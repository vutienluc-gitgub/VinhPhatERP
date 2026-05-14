import { useState, useMemo } from 'react';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import {
  Badge,
  DataTable,
  AddButton,
  ActionBar,
  Button,
} from '@/shared/components';
import { formatCurrency } from '@/shared/utils/format';
import {
  useRecurringTransactionList,
  useDeleteRecurringTransaction,
  useToggleRecurringTransaction,
  useGenerateDueExpenses,
} from '@/application/recurring-transactions';
import { EXPENSE_CATEGORY_LABELS } from '@/schema/payment.schema';
import { getRecurringStatus, isDue } from '@/domain/recurring-transactions';
import type { RecurringTransaction } from '@/domain/recurring-transactions/types';
import { getErrorMessage } from '@/shared/utils/error';

import {
  FREQUENCY_LABELS,
  RECURRING_STATUS_BADGE,
  RECURRING_LABELS,
} from './recurring-transactions.constants';
import { RecurringTransactionForm } from './RecurringTransactionForm';
import { RecurringTransactionMobileCard } from './RecurringTransactionMobileCard';
import { GenerateFeedback } from './GenerateFeedback';

export function RecurringTransactionList() {
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

  const dueCount = useMemo(
    () =>
      transactions.filter((tx) => tx.is_active && isDue(tx.next_run_date))
        .length,
    [transactions],
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
      {/* Header Card */}
      <div className="panel-card card-flush">
        <div className="card-header-area">
          <div className="card-header-row">
            <h3 className="text-lg font-bold m-0">
              {RECURRING_LABELS.pageTitle}
            </h3>
            <div className="flex items-center gap-3">
              {dueCount > 0 && (
                <Button
                  variant="primary"
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending}
                  leftIcon="Zap"
                >
                  {generateMutation.isPending
                    ? RECURRING_LABELS.generatingButton
                    : `${RECURRING_LABELS.generateButton} (${dueCount})`}
                </Button>
              )}
              <AddButton
                onClick={() => handleOpenForm(null)}
                label={RECURRING_LABELS.addButton}
              />
            </div>
          </div>
        </div>

        <GenerateFeedback message={generateMessage} />
      </div>

      {/* Error */}
      {error && (
        <div className="p-4">
          <p className="error-inline">
            {RECURRING_LABELS.errorLoadData}: {getErrorMessage(error)}
          </p>
        </div>
      )}

      {/* Data Table */}
      <div className="panel-card card-flush">
        <DataTable
          data={transactions}
          isLoading={isLoading}
          rowKey={(tx) => tx.id}
          emptyStateTitle={RECURRING_LABELS.emptyTitle}
          emptyStateDescription={RECURRING_LABELS.emptyDescription}
          emptyStateIcon="CalendarClock"
          emptyStateActionLabel={RECURRING_LABELS.emptyAction}
          onEmptyStateAction={() => handleOpenForm(null)}
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
                      <Badge variant={badge.variant}>{badge.label}</Badge>
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
                <span className="font-bold text-danger">
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
                const isOverdue = tx.is_active && isDue(tx.next_run_date);
                return (
                  <div className="flex flex-col">
                    <span
                      className={isOverdue ? 'text-danger font-semibold' : ''}
                    >
                      {new Date(tx.next_run_date).toLocaleDateString('vi-VN')}
                    </span>
                    {tx.last_generated_date && (
                      <span className="text-xs text-muted">
                        {RECURRING_LABELS.lastGenerated}:{' '}
                        {new Date(tx.last_generated_date).toLocaleDateString(
                          'vi-VN',
                        )}
                      </span>
                    )}
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
          <p className="error-inline-sm">
            {RECURRING_LABELS.errorPrefix}:{' '}
            {getErrorMessage(deleteMutation.error)}
          </p>
        )}
      </div>

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
