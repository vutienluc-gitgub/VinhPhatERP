import { Icon, Badge } from '@/shared/components';
import { MoneyText } from '@/shared/value';
import { EXPENSE_CATEGORY_LABELS } from '@/features/payments/payments.module';
import type { Expense } from '@/domain/payments/types';
import { EXPENSE_MESSAGES as MSG } from '@/features/payments/payments.constants';
import { getCategoryVariant } from '@/features/payments/hooks/useExpenseColumns';

type ExpenseMobileCardProps = {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  handleDelete: (expense: Expense) => void;
  isDeleting: boolean;
};

export function ExpenseMobileCard({
  expense: exp,
  onEdit,
  handleDelete,
  isDeleting,
}: ExpenseMobileCardProps) {
  return (
    <div className="mobile-card">
      <div className="mobile-card-header">
        <div className="flex flex-col">
          <span className="mobile-card-title">{exp.expense_number}</span>
          <span className="text-xs text-muted-foreground">
            {exp.expense_date}
          </span>
        </div>
        <span className="font-bold text-danger text-lg">
          <MoneyText value={exp.amount} tone="danger" />
        </span>
      </div>
      <div className="mobile-card-body space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant={getCategoryVariant(exp.category)}>
            {EXPENSE_CATEGORY_LABELS[exp.category]}
          </Badge>
          {exp.suppliers?.name && (
            <span className="text-xs text-muted-foreground">
              {exp.suppliers.name}
            </span>
          )}
        </div>
        <p className="text-sm">{exp.description}</p>
        <div className="text-xs text-muted-foreground">
          {MSG.LBL_FUND_PREFIX}
          {exp.payment_accounts?.name ?? '—'}
        </div>
        <div className="flex gap-2 pt-2 mt-2 border-t border-border/10">
          <button
            className="btn-secondary flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(exp);
            }}
          >
            <Icon name="Pencil" size={16} /> {MSG.BTN_EDIT_TITLE}
          </button>
          <button
            className="btn-secondary flex-1 text-danger border-danger/20"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(exp);
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
