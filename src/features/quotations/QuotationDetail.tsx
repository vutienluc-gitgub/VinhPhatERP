import { Badge, type BadgeVariant, Icon } from '@/shared/components';
import { useConfirm } from '@/shared/components/ConfirmDialog';
import { formatCurrency } from '@/shared/utils/format';

import { QUOTATION_STATUS_LABELS } from './quotations.module';
import type { Quotation, QuotationStatus } from './types';
import { useConvertToOrder } from './useConvertToOrder';
import {
  useConfirmQuotation,
  useQuotation,
  useRejectQuotation,
  useSendQuotation,
} from './useQuotations';

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
        <p className="table-empty">Đang tải...</p>
      </div>
    );
  if (error)
    return (
      <div className="panel-card p-4">
        <p className="error-inline">Loi: {(error as Error).message}</p>
      </div>
    );
  if (!quotation)
    return (
      <div className="panel-card">
        <p className="table-empty">Không tìm thấy báo giá.</p>
      </div>
    );

  const items = quotation.quotation_items ?? [];

  async function handleSend() {
    const ok = await confirm({ message: 'Gửi báo giá này cho khách hàng?' });
    if (!ok) return;
    sendMutation.mutate(quotationId);
  }

  async function handleConfirm() {
    const ok = await confirm({
      message: 'Xác nhận khách hàng đã duyệt báo giá này?',
    });
    if (!ok) return;
    confirmMutation.mutate(quotationId);
  }

  async function handleReject() {
    const ok = await confirm({
      message: 'Khách hàng từ chối báo giá này?',
      variant: 'danger',
    });
    if (!ok) return;
    rejectMutation.mutate(quotationId);
  }

  async function handleConvert() {
    const ok = await confirm({
      message:
        'Chuyển báo giá này thành đơn hàng? Hệ thống sẽ tạo đơn hàng mới ở trạng thái Nháp.',
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
      <div className="card-header-premium p-5 border-b border-border flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-3 flex-1">
          <button className="btn-secondary" type="button" onClick={onBack}>
            <Icon name="ArrowLeft" size={16} /> Quay lai
          </button>
          <div className="flex-1">
            <h3 className="title-premium flex items-center gap-2">
              {quotation.quotation_number}
              {quotation.revision > 1 && (
                <span className="text-xs text-muted font-normal">
                  (v{quotation.revision})
                </span>
              )}
            </h3>
            <p className="text-muted mt-0.5 font-medium">
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
          <div className="text-xs text-muted font-bold uppercase tracking-wider mb-1">
            Ngay bao gia
          </div>
          <div className="font-medium">
            {formatDate(quotation.quotation_date)}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted font-bold uppercase tracking-wider mb-1">
            Hieu luc den
          </div>
          <div className="font-medium">{formatDate(quotation.valid_until)}</div>
        </div>
        <div>
          <div className="text-xs text-muted font-bold uppercase tracking-wider mb-1">
            Tam tinh
          </div>
          <div className="font-medium text-primary">
            {formatCurrency(quotation.subtotal)}đ
          </div>
        </div>
        <div>
          <div className="text-xs text-muted font-bold uppercase tracking-wider mb-1">
            Chiet khau
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
                -{formatCurrency(quotation.discount_amount)}đ
                <span className="text-xs text-muted ml-1 font-normal italic">
                  (
                  {quotation.discount_type === 'percent'
                    ? `${quotation.discount_value}%`
                    : 'co dinh'}
                  )
                </span>
              </>
            ) : (
              '—'
            )}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted font-bold uppercase tracking-wider mb-1">
            VAT ({quotation.vat_rate}%)
          </div>
          <div className="font-medium">
            {formatCurrency(quotation.vat_amount)}đ
          </div>
        </div>
        <div>
          <div className="text-xs text-muted font-bold uppercase tracking-wider mb-1">
            Tong cong
          </div>
          <div className="font-extrabold text-lg text-primary">
            {formatCurrency(quotation.total_amount)}đ
          </div>
        </div>
      </div>

      {/* Terms */}
      {(quotation.delivery_terms || quotation.payment_terms) && (
        <div className="grid sm:grid-cols-2 gap-3 mb-4 px-5">
          {quotation.delivery_terms && (
            <div className="p-3 bg-surface border border-border rounded-lg text-sm">
              <span className="font-bold text-muted uppercase text-[0.7rem] block mb-1">
                DK giao hang
              </span>
              {quotation.delivery_terms}
            </div>
          )}
          {quotation.payment_terms && (
            <div className="p-3 bg-surface border border-border rounded-lg text-sm">
              <span className="font-bold text-muted uppercase text-[0.7rem] block mb-1">
                DK thanh toan
              </span>
              {quotation.payment_terms}
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {quotation.notes && (
        <div className="p-3 bg-surface border border-border rounded-lg text-sm mb-4 mx-5">
          <span className="font-bold text-muted uppercase text-[0.7rem] block mb-1">
            Ghi chu
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
              <Icon name="Pencil" size={16} /> Sua
            </button>
            <button
              className="btn-primary"
              type="button"
              onClick={handleSend}
              disabled={sendMutation.isPending}
            >
              <Icon name="Send" size={16} />{' '}
              {sendMutation.isPending ? 'Dang gui...' : 'Gui khach'}
            </button>
            <button
              className="btn-secondary"
              type="button"
              onClick={handleConfirm}
              disabled={confirmMutation.isPending}
            >
              <Icon name="CheckCircle" size={16} />{' '}
              {confirmMutation.isPending ? 'Dang xu ly...' : 'Duyet luon'}
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
              {confirmMutation.isPending ? 'Dang xu ly...' : 'Khach duyet'}
            </button>
            <button
              className="btn-secondary text-danger"
              type="button"
              onClick={handleReject}
              disabled={rejectMutation.isPending}
            >
              <Icon name="XCircle" size={16} />{' '}
              {rejectMutation.isPending ? 'Dang xu ly...' : 'Khach tu choi'}
            </button>
            <button
              className="btn-secondary"
              type="button"
              onClick={() => onEdit(quotation)}
            >
              <Icon name="Pencil" size={16} /> Sua doi
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
              ? 'Dang chuyen...'
              : 'Chuyen thanh Don hang'}
          </button>
        )}
        {quotation.status === 'converted' && quotation.converted_order_id && (
          <button
            className="btn-primary"
            type="button"
            onClick={() => onViewOrder(quotation.converted_order_id!)}
          >
            <Icon name="Package" size={16} /> Xem Don hang
          </button>
        )}
        <button
          className="btn-secondary ml-auto"
          type="button"
          onClick={() =>
            window.open(`/print/quotation/${quotationId}`, '_blank')
          }
          title="In Bao gia hoac luu PDF"
        >
          <Icon name="Printer" size={16} /> In / PDF
        </button>
      </div>

      {anyMutationError && (
        <p className="text-danger text-sm px-5 mb-4">
          Loi: {(anyMutationError as Error).message}
        </p>
      )}

      <div className="px-5 pb-5">
        <h4 className="mb-3 text-base flex items-center gap-2">
          <Icon name="List" size={18} className="text-muted" />
          Dong hang ({items.length})
        </h4>
        <div className="data-table-wrap">
          {items.length === 0 ? (
            <p className="table-empty">Chua co dong hang.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-10">#</th>
                  <th>Loai vai</th>
                  <th>Mau</th>
                  <th className="hide-mobile">Kho (cm)</th>
                  <th className="text-right">So luong</th>
                  <th className="text-right">Don gia</th>
                  <th className="text-right">Thanh tien</th>
                  <th className="hide-mobile">SX (ngay)</th>
                </tr>
              </thead>
              <tbody>
                {items
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((item, idx) => (
                    <tr key={item.id}>
                      <td className="text-muted">{idx + 1}</td>
                      <td>
                        <span className="font-bold">{item.fabric_type}</span>
                      </td>
                      <td className="text-muted">{item.color_name ?? '—'}</td>
                      <td className="text-muted hide-mobile">
                        {item.width_cm ?? '—'}
                      </td>
                      <td className="text-right tabular-nums">
                        {new Intl.NumberFormat('vi-VN').format(item.quantity)}{' '}
                        {item.unit}
                      </td>
                      <td className="text-right tabular-nums">
                        {formatCurrency(item.unit_price)}đ
                      </td>
                      <td className="text-right font-bold tabular-nums">
                        {formatCurrency(item.amount)}đ
                      </td>
                      <td className="text-muted hide-mobile">
                        {item.lead_time_days ?? '—'}
                      </td>
                    </tr>
                  ))}
                <tr className="font-bold bg-surface/30">
                  <td colSpan={6} className="text-right">
                    Tam tinh
                  </td>
                  <td className="text-right tabular-nums">
                    {formatCurrency(quotation.subtotal)}đ
                  </td>
                  <td className="hide-mobile"></td>
                </tr>
                {quotation.discount_amount > 0 && (
                  <tr className="text-danger">
                    <td colSpan={6} className="text-right">
                      Chiet khau (
                      {quotation.discount_type === 'percent'
                        ? `${quotation.discount_value}%`
                        : 'co dinh'}
                      )
                    </td>
                    <td className="text-right tabular-nums">
                      -{formatCurrency(quotation.discount_amount)}đ
                    </td>
                    <td className="hide-mobile"></td>
                  </tr>
                )}
                {quotation.vat_amount > 0 && (
                  <tr>
                    <td colSpan={6} className="text-right">
                      VAT ({quotation.vat_rate}%)
                    </td>
                    <td className="text-right tabular-nums">
                      +{formatCurrency(quotation.vat_amount)}đ
                    </td>
                    <td className="hide-mobile"></td>
                  </tr>
                )}
                <tr className="font-extrabold text-primary bg-surface/50">
                  <td colSpan={6} className="text-right">
                    Tong cong
                  </td>
                  <td className="text-right text-lg tabular-nums">
                    {formatCurrency(quotation.total_amount)}đ
                  </td>
                  <td className="hide-mobile"></td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
