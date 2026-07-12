import { Badge, Icon } from '@/shared/components';
import { formatQuantity } from '@/shared/utils/format';
import { MoneyText } from '@/shared/value';
import { WEAVING_STATUS_LABELS } from '@/schema/weaving-invoice.schema';
import type { WeavingInvoice } from '@/features/weaving-invoices/types';
import {
  getStatusVariant,
  WEAVING_INVOICE_MESSAGES as MSG,
} from '@/features/weaving-invoices/weaving-invoices.constants';

type WeavingInvoiceMobileCardProps = {
  invoice: WeavingInvoice;
  onEdit: (invoice: WeavingInvoice) => void;
  onConfirm: (invoice: WeavingInvoice) => void;
  onDelete: (invoice: WeavingInvoice) => void;
  isConfirming: boolean;
  isDeleting: boolean;
};

export function WeavingInvoiceMobileCard({
  invoice: inv,
  onEdit,
  onConfirm,
  onDelete,
  isConfirming,
  isDeleting,
}: WeavingInvoiceMobileCardProps) {
  return (
    <div className="mobile-card">
      <div className="mobile-card-header">
        <div className="flex flex-col">
          <span className="mobile-card-title">{inv.invoice_number}</span>
          <span className="text-xs text-muted">{inv.invoice_date}</span>
        </div>
        <Badge variant={getStatusVariant(inv.status)}>
          {WEAVING_STATUS_LABELS[inv.status]}
        </Badge>
      </div>
      <div className="mobile-card-body space-y-2">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <span className="text-xs text-muted">{MSG.COL_SUPPLIER}</span>
            <span className="font-bold">{inv.suppliers?.name ?? '—'}</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-xs text-muted">{MSG.COL_FABRIC}</span>
            <span className="font-medium">{inv.fabric_type}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-sm mt-2">
          <div className="flex flex-col">
            <span className="text-xs text-muted">{MSG.COL_WEIGHT}</span>
            <span className="font-bold">
              {formatQuantity(inv.total_weight_kg)}
            </span>
          </div>
          <div className="flex flex-col text-center">
            <span className="text-xs text-muted">{MSG.COL_AMOUNT}</span>
            <span className="font-bold text-primary">
              <MoneyText value={inv.total_amount} />đ
            </span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-xs text-muted">{MSG.COL_PAID}</span>
            <span
              className={`font-bold ${inv.paid_amount > 0 ? 'text-success' : 'text-muted'}`}
            >
              <MoneyText value={inv.paid_amount} />đ
            </span>
          </div>
        </div>

        {inv.status === 'draft' && (
          <div className="flex gap-2 pt-3 mt-1 border-t border-border/10">
            <button
              className="btn-secondary flex-1 text-primary"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(inv);
              }}
            >
              <Icon name="Pencil" size={16} /> {MSG.BTN_EDIT}
            </button>
            <button
              className="btn-secondary flex-1 text-success border-success/20"
              onClick={(e) => {
                e.stopPropagation();
                onConfirm(inv);
              }}
              disabled={isConfirming}
            >
              <Icon name="CheckCircle" size={16} /> {MSG.BTN_CONFIRM}
            </button>
            <button
              className="btn-secondary text-danger border-danger/20 px-3"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(inv);
              }}
              disabled={isDeleting}
            >
              <Icon name="Trash2" size={16} />
            </button>
          </div>
        )}
        {inv.status !== 'draft' && inv.lookup_code && (
          <div className="flex gap-2 pt-3 mt-1 border-t border-border/10">
            <button
              className="btn-secondary flex-1 text-primary"
              onClick={(e) => {
                e.stopPropagation();
                window.open(`/tra-cuu/${inv.lookup_code}`, '_blank');
              }}
            >
              <Icon name="ExternalLink" size={16} /> {MSG.BTN_LOOKUP}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
