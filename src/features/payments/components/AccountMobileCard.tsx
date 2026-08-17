import { Icon, Badge } from '@/shared/components';
import { MoneyText } from '@/shared/value';
import { ACCOUNT_TYPE_LABELS } from '@/features/payments/payments.module';
import {
  ACCOUNT_STATUS_LABELS,
  ACCOUNT_MESSAGES as MSG,
} from '@/features/payments/payments.constants';
import type { PaymentAccount } from '@/domain/payments/types';
import { getAccountStatusVariant } from '@/features/payments/hooks/useAccountColumns';

type AccountMobileCardProps = {
  account: PaymentAccount;
  onEdit: (account: PaymentAccount) => void;
  handleDelete: (account: PaymentAccount) => void;
  isDeleting: boolean;
};

export function AccountMobileCard({
  account: acc,
  onEdit,
  handleDelete,
  isDeleting,
}: AccountMobileCardProps) {
  return (
    <div className="mobile-card">
      <div className="mobile-card-header">
        <div className="flex flex-col">
          <span className="mobile-card-title">{acc.name}</span>
          <span className="text-xs text-muted-foreground">
            {ACCOUNT_TYPE_LABELS[acc.type]}
          </span>
        </div>
        <Badge variant={getAccountStatusVariant(acc.status)}>
          {ACCOUNT_STATUS_LABELS[acc.status as 'active' | 'inactive']}
        </Badge>
      </div>
      <div className="mobile-card-body space-y-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">
              {MSG.COL_INITIAL_BALANCE}
            </span>
            <span className="font-medium">
              <MoneyText value={acc.initial_balance} />
            </span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-xs text-muted-foreground">
              {MSG.COL_BALANCE}
            </span>
            <span
              className={`font-bold ${acc.current_balance >= 0 ? 'text-success' : 'text-danger'}`}
            >
              <MoneyText value={acc.current_balance} />
            </span>
          </div>
        </div>
        {(acc.bank_name || acc.account_number) && (
          <div className="text-xs text-muted-foreground">
            {acc.bank_name}
            {acc.bank_name && acc.account_number ? ' · ' : ''}
            {acc.account_number}
          </div>
        )}
        <div className="flex gap-2 pt-2 border-t border-border/10">
          <button
            className="btn-secondary flex-1 text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(acc);
            }}
          >
            <Icon name="Pencil" size={16} /> {MSG.BTN_EDIT_TITLE}
          </button>
          <button
            className="btn-secondary text-danger border-danger/20 px-3"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(acc);
            }}
            disabled={isDeleting}
          >
            <Icon name="Trash2" size={16} /> {MSG.BTN_DELETE_TITLE}
          </button>
        </div>
      </div>
    </div>
  );
}
