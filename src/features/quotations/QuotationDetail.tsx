import { Badge, type BadgeVariant, Icon } from '@/shared/components';
import { useConfirm } from '@/shared/components/ConfirmDialog';
import { MoneyText } from '@/shared/value';
import { useConvertToOrder } from '@/application/quotations';
import {
  useConfirmQuotation,
  useQuotation,
  useRejectQuotation,
  useSendQuotation,
} from '@/application/quotations';
import { QUOTATION_STATUS_LABELS } from '@/schema/quotation.schema';

import type { Quotation, QuotationStatus } from './types';
import { QUOTATION_LABELS, QUOTATION_MESSAGES } from './quotations.constants';
import { QuotationDetailItems } from './components/QuotationDetailItems';

function getStatusVariant(status: QuotationStatus): BadgeVariant {
  switch (status) {
    case 'draft':
      return 'gray';
    case 'sent':
      return 'info';
    case 'confirmed':
      return 'success';
    case 'rejected':
      return 'danger';
    case 'expired':
      return 'gray';
    case 'converted':
      return 'purple';
    default:
      return 'gray';
  }
}

type QuotationDetailProps = {
  quotationId: string;
  onBack: () => void;
  onEdit: (quotation: Quotation) => void;
  onViewOrder: (orderId: string) => void;
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return dateStr;
}

export function QuotationDetail({
  quotationId,
  onBack,
  onEdit,
  onViewOrder,
}: QuotationDetailProps) {
  const { data: quotation, isLoading, error } = useQuotation(quotationId);
  const sendMutation = useSendQuotation();
  const confirmMutation = useConfirmQuotation();
  const rejectMutation = useRejectQuotation();
  const convertMutation = useConvertToOrder();
  const { confirm } = useConfirm();

  if (isLoading)
    return (
      <div className="panel-card">
        <p className="table-empty">{QUOTATION_MESSAGES.LOADING}</p>
      </div>
    );
  if (error)
    return (
      <div className="panel-card p-4">
        <p className="error-inline">
          {QUOTATION_MESSAGES.SAVE_ERROR}:{' '}
          {error instanceof Error ? error.message : String(error)}
        </p>
      </div>
    );
  if (!quotation)
    return (
      <div className="panel-card">
        <p className="table-empty">{QUOTATION_MESSAGES.NO_DATA}</p>
      </div>
    );

  async function handleSend() {
    const ok = await confirm({ message: QUOTATION_MESSAGES.CONFIRM_SEND });
    if (!ok) return;
    sendMutation.mutate(quotationId);
  }

  async function handleConfirm() {
    const ok = await confirm({
      message: QUOTATION_MESSAGES.CONFIRM_APPROVE,
    });
    if (!ok) return;
    confirmMutation.mutate(quotationId);
  }

  async function handleReject() {
    const ok = await confirm({
      message: QUOTATION_MESSAGES.CONFIRM_REJECT,
      variant: 'danger',
    });
    if (!ok) return;
    rejectMutation.mutate(quotationId);
  }

  async function handleConvert() {
    const ok = await confirm({
      message: QUOTATION_MESSAGES.CONFIRM_CONVERT,
    });
    if (!ok) return;
    try {
      const result = await convertMutation.mutateAsync(quotationId);
      onViewOrder(result.orderId);
    } catch {
      // Error shown below
    }
  }

  const anyMutationError =
    sendMutation.error ||
    confirmMutation.error ||
    rejectMutation.error ||
    convertMutation.error;

  return (
    <div className="panel-card card-flush">
      {/* Header */}
      <div className="card-header-area border-b border-border flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-3 flex-1">
          <button className="btn-secondary" type="button" onClick={onBack}>
            <Icon name="ArrowLeft" size={16} /> {QUOTATION_MESSAGES.BTN_BACK}
          </button>
          <div className="flex-1">
            <span className="font-bold text-lg flex items-center gap-2">
              {quotation.quotation_number}
              {quotation.revision > 1 && (
                <span className="text-xs text-muted-foreground font-normal">
                  (v{quotation.revision})
                </span>
              )}
            </span>
            <p className="text-muted-foreground mt-0.5 font-medium">
              {quotation.customers?.name ?? '—'}
            </p>
          </div>
        </div>
        <Badge variant={getStatusVariant(quotation.status)}>
          {QUOTATION_STATUS_LABELS[quotation.status]}
        </Badge>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-6 mt-4 p-5 bg-surface/50 rounded-lg mx-5">
        <div>
          <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">
            {QUOTATION_LABELS.QUOTATION_DATE}
          </div>
          <div className="font-medium">
            {formatDate(quotation.quotation_date)}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">
            {QUOTATION_LABELS.VALID_UNTIL}
          </div>
          <div className="font-medium">{formatDate(quotation.valid_until)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">
            {QUOTATION_LABELS.SUBTOTAL}
          </div>
          <div className="font-medium text-foreground">
            <MoneyText value={quotation.subtotal} />
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">
            {QUOTATION_LABELS.DISCOUNT}
          </div>
          <div
            className={
              quotation.discount_amount > 0
                ? 'text-danger font-medium'
                : 'font-medium'
            }
          >
            {quotation.discount_amount > 0 ? (
              <>
                -<MoneyText value={quotation.discount_amount} />
                <span className="text-xs text-muted-foreground ml-1 font-normal italic">
                  (
                  {quotation.discount_type === 'percent'
                    ? `${quotation.discount_value}%`
                    : QUOTATION_LABELS.FIXED_DISCOUNT}
                  )
                </span>
              </>
            ) : (
              '—'
            )}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">
            {QUOTATION_LABELS.VAT_RATE} ({quotation.vat_rate}%)
          </div>
          <div className="font-medium">
            <MoneyText value={quotation.vat_amount} />
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">
            {QUOTATION_LABELS.TOTAL}
          </div>
          <div className="font-extrabold text-lg text-foreground">
            <MoneyText value={quotation.total_amount} />
          </div>
        </div>
      </div>

      {/* Terms */}
      {(quotation.delivery_terms || quotation.payment_terms) && (
        <div className="grid sm:grid-cols-2 gap-3 mb-4 px-5">
          {quotation.delivery_terms && (
            <div className="p-3 bg-surface border border-border rounded-lg text-sm">
              <span className="font-bold text-muted-foreground uppercase text-[0.7rem] block mb-1">
                {QUOTATION_LABELS.DELIVERY_TERMS}
              </span>
              {quotation.delivery_terms}
            </div>
          )}
          {quotation.payment_terms && (
            <div className="p-3 bg-surface border border-border rounded-lg text-sm">
              <span className="font-bold text-muted-foreground uppercase text-[0.7rem] block mb-1">
                {QUOTATION_LABELS.PAYMENT_TERMS}
              </span>
              {quotation.payment_terms}
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {quotation.notes && (
        <div className="p-3 bg-surface border border-border rounded-lg text-sm mb-4 mx-5">
          <span className="font-bold text-muted-foreground uppercase text-[0.7rem] block mb-1">
            {QUOTATION_LABELS.NOTES}
          </span>
          {quotation.notes}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mb-6 px-5 border-t border-border pt-4">
        {quotation.status === 'draft' && (
          <>
            <button
              className="btn-secondary"
              type="button"
              onClick={() => onEdit(quotation)}
            >
              <Icon name="Pencil" size={16} /> {QUOTATION_LABELS.BTN_EDIT}
            </button>
            <button
              className="btn-primary"
              type="button"
              onClick={handleSend}
              disabled={sendMutation.isPending}
            >
              <Icon name="Send" size={16} />{' '}
              {sendMutation.isPending
                ? QUOTATION_MESSAGES.SENDING
                : QUOTATION_LABELS.BTN_SEND}
            </button>
            <button
              className="btn-secondary"
              type="button"
              onClick={handleConfirm}
              disabled={confirmMutation.isPending}
            >
              <Icon name="CheckCircle" size={16} />{' '}
              {confirmMutation.isPending
                ? QUOTATION_MESSAGES.PROCESSING
                : QUOTATION_LABELS.BTN_APPROVE}
            </button>
          </>
        )}
        {quotation.status === 'sent' && (
          <>
            <button
              className="btn-primary"
              type="button"
              onClick={handleConfirm}
              disabled={confirmMutation.isPending}
            >
              <Icon name="CheckCircle" size={16} />{' '}
              {confirmMutation.isPending
                ? QUOTATION_MESSAGES.PROCESSING
                : QUOTATION_LABELS.BTN_CUSTOMER_APPROVE}
            </button>
            <button
              className="btn-secondary text-danger"
              type="button"
              onClick={handleReject}
              disabled={rejectMutation.isPending}
            >
              <Icon name="XCircle" size={16} />{' '}
              {rejectMutation.isPending
                ? QUOTATION_MESSAGES.PROCESSING
                : QUOTATION_LABELS.BTN_CUSTOMER_REJECT}
            </button>
            <button
              className="btn-secondary"
              type="button"
              onClick={() => onEdit(quotation)}
            >
              <Icon name="Pencil" size={16} /> {QUOTATION_LABELS.BTN_EDIT_AGAIN}
            </button>
          </>
        )}
        {quotation.status === 'confirmed' && !quotation.converted_order_id && (
          <button
            className="btn-primary"
            type="button"
            onClick={handleConvert}
            disabled={convertMutation.isPending}
          >
            <Icon name="ArrowRightLeft" size={16} />{' '}
            {convertMutation.isPending
              ? QUOTATION_MESSAGES.CONVERTING
              : QUOTATION_LABELS.BTN_CONVERT_ORDER}
          </button>
        )}
        {quotation.status === 'converted' && quotation.converted_order_id && (
          <button
            className="btn-primary"
            type="button"
            onClick={() => onViewOrder(quotation.converted_order_id!)}
          >
            <Icon name="Package" size={16} /> {QUOTATION_LABELS.BTN_VIEW_ORDER}
          </button>
        )}
        <button
          className="btn-secondary ml-auto"
          type="button"
          onClick={() =>
            window.open(`/print/quotation/${quotationId}`, '_blank')
          }
          title={QUOTATION_LABELS.PRINT_TOOLTIP}
        >
          <Icon name="Printer" size={16} /> {QUOTATION_LABELS.BTN_PRINT}
        </button>
      </div>

      {anyMutationError && (
        <p className="text-danger text-sm px-5 mb-4">
          {QUOTATION_MESSAGES.ERROR_PREFIX}{' '}
          {anyMutationError instanceof Error
            ? anyMutationError.message
            : String(anyMutationError)}
        </p>
      )}

      <QuotationDetailItems quotation={quotation} />
    </div>
  );
}
