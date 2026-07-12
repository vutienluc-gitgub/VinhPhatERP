import { useState } from 'react';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import {
  DataTableAdvanced,
  AddButton,
  KpiCard,
  PageLayout,
  PageHeader,
  KPISection,
  TableSection,
} from '@/shared/components';
import { useAllAccounts, useDeleteAccount } from '@/application/payments';
import { sumBy } from '@/shared/utils/array.util';

import type { PaymentAccount } from './types';
import { useAccountColumns } from './hooks/useAccountColumns';
import { AccountMobileCard } from './components/AccountMobileCard';
import { ACCOUNT_MESSAGES as MSG } from './payments.constants';

type AccountListProps = {
  onEdit: (account: PaymentAccount) => void;
  onNew: () => void;
};

export function AccountList({ onEdit, onNew }: AccountListProps) {
  const { data: accounts = [], isLoading, error } = useAllAccounts();
  const deleteMutation = useDeleteAccount();
  const { confirm } = useConfirm();
  const [showInactive, setShowInactive] = useState(false);

  async function handleDelete(account: PaymentAccount) {
    const ok = await confirm({
      message: MSG.DELETE_CONFIRM(account.name),
      variant: 'danger',
    });
    if (!ok) return;
    deleteMutation.mutate(account.id);
  }

  const filtered = showInactive
    ? accounts
    : accounts.filter((a) => a.status === 'active');

  const totalBalance = sumBy(filtered, (a) => a.current_balance);
  const activeCount = accounts.filter((a) => a.status === 'active').length;

  const columns = useAccountColumns({
    onEdit,
    handleDelete,
    isDeleting: deleteMutation.isPending,
  });

  return (
    <PageLayout>
      <PageHeader
        title={MSG.TITLE}
        subtitle={MSG.SUBTITLE}
        actions={
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
              />
              {MSG.SHOW_INACTIVE}
            </label>
            <AddButton onClick={onNew} label={MSG.BTN_ADD} />
          </div>
        }
      />

      <KPISection>
        <div className="kpi-grid">
          <KpiCard
            label={MSG.KPI_TOTAL_BALANCE}
            value={totalBalance}
            formatMode="currency"
            icon="Wallet"
            variant={totalBalance >= 0 ? 'success' : 'danger'}
            footer={MSG.KPI_TOTAL_FOOTER(filtered.length)}
            isLoading={isLoading}
          />
          <KpiCard
            label={MSG.KPI_ACTIVE_ACCOUNTS}
            value={activeCount}
            icon="CreditCard"
            variant="primary"
            footer={MSG.KPI_ACTIVE_FOOTER}
            isLoading={isLoading}
          />
        </div>
      </KPISection>

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
          data={filtered}
          columns={columns}
          isLoading={isLoading}
          skeletonRows={5}
          rowKey={(acc) => acc.id}
          onRowClick={onEdit}
          exportFileName={MSG.EXPORT_FILENAME}
          emptyStateTitle={MSG.EMPTY_TITLE}
          emptyStateDescription={MSG.EMPTY_DESC}
          emptyStateIcon="CreditCard"
          emptyStateActionLabel={MSG.EMPTY_ACTION}
          onEmptyStateAction={onNew}
          renderMobileCard={(acc) => (
            <AccountMobileCard
              account={acc}
              onEdit={onEdit}
              handleDelete={handleDelete}
              isDeleting={deleteMutation.isPending}
            />
          )}
        />
      </TableSection>
    </PageLayout>
  );
}
