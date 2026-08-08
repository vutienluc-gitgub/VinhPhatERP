import { Icon } from '@/shared/components';
import { MoneyText } from '@/shared/value';
import { PAYMENT_METHOD_LABELS } from '@/features/payments/payments.module';
import { PAYMENT_LIST_MESSAGES as MSG } from '@/features/payments/payments.constants';
import type { Payment } from '@/features/payments/types';

type PaymentMobileCardProps = {
  payment: Payment;
  handleDelete: (id: string) => void;
  isDeleting: boolean;
};

export function PaymentMobileCard({
  payment: p,
  handleDelete,
  isDeleting,
}: PaymentMobileCardProps) {
  return (
    <div className="mobile-card">
      <div className="mobile-card-header">
        <span className="mobile-card-title">{p.payment_number}</span>
        <span className="font-bold text-success text-lg">
          <MoneyText value={p.amount} tone="success" />
        </span>
      </div>
      <div className="mobile-card-body space-y-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">
              {MSG.COL_CUSTOMER}
            </span>
            <span className="font-bold">{p.customers?.name ?? '—'}</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-xs text-muted-foreground">
              {MSG.COL_ORDER}
            </span>
            <span className="font-medium">{p.orders?.order_number ?? '—'}</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {MSG.LBL_DATE_PREFIX}
            {p.payment_date}
          </span>
          <span>{PAYMENT_METHOD_LABELS[p.payment_method]}</span>
        </div>
        <div className="pt-2 border-t border-border/10">
          <button
            className="btn-secondary w-full text-danger border-danger/20"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(p.id);
            }}
            disabled={isDeleting}
          >
            <Icon name="Trash2" size={16} /> {MSG.BTN_DELETE}
          </button>
        </div>
      </div>
    </div>
  );
}
