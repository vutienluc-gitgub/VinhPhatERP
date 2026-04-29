import { Badge, type BadgeVariant, Icon } from '@/shared/components';
import { useConfirm } from '@/shared/components/ConfirmDialog';
import { formatCurrency } from '@/shared/utils/format';
import { useConvertToOrder } from '@/application/quotations';
import {
  useConfirmQuotation,
  useQuotation,
  useRejectQuotation,
  useSendQuotation,
} from '@/application/quotations';
import { QUOTATION_STATUS_LABELS } from '@/schema/quotation.schema';

import type { Quotation, QuotationStatus } from './types';

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
        <p className="error-inline">Lỗi: {(error as Error).message}</p>
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
      <div className="card-header-area border-b border-border flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-3 flex-1">
          <button className="btn-secondary" type="button" onClick={onBack}>
            <Icon name="ArrowLeft" size={16} /> Quay lại
          </button>
          <div className="flex-1">
            <span className="font-bold text-lg flex items-center gap-2">
              {quotation.quotation_number}
              {quotation.revision > 1 && (
                <span className="text-xs text-muted font-normal">
                  (v{quotation.revision})
                </span>
              )}
            </span>
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
            Ngày báo giá
          </div>
          <div className="font-medium">
            {formatDate(quotation.quotation_date)}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted font-bold uppercase tracking-wider mb-1">
            Hiệu lực đến
          </div>
          <div className="font-medium">{formatDate(quotation.valid_until)}</div>
        </div>
        <div>
          <div className="text-xs text-muted font-bold uppercase tracking-wider mb-1">
            Tạm tính
          </div>
          <div className="font-medium text-primary">
            {formatCurrency(quotation.subtotal)}đ
          </div>
        </div>
        <div>
          <div className="text-xs text-muted font-bold uppercase tracking-wider mb-1">
            Chiết khấu
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
                    : 'cố định'}
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
            Tổng cộng
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
                ĐK giao hàng
              </span>
              {quotation.delivery_terms}
            </div>
          )}
          {quotation.payment_terms && (
            <div className="p-3 bg-surface border border-border rounded-lg text-sm">
              <span className="font-bold text-muted uppercase text-[0.7rem] block mb-1">
                ĐK thanh toán
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
            Ghi chú
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
              <Icon name="Pencil" size={16} /> Sửa
            </button>
            <button
              className="btn-primary"
              type="button"
              onClick={handleSend}
              disabled={sendMutation.isPending}
            >
              <Icon name="Send" size={16} />{' '}
              {sendMutation.isPending ? 'Đang gửi...' : 'Gửi khách'}
            </button>
            <button
              className="btn-secondary"
              type="button"
              onClick={handleConfirm}
              disabled={confirmMutation.isPending}
            >
              <Icon name="CheckCircle" size={16} />{' '}
              {confirmMutation.isPending ? 'Đang xử lý...' : 'Duyệt luôn'}
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
              {confirmMutation.isPending ? 'Đang xử lý...' : 'Khách duyệt'}
            </button>
            <button
              className="btn-secondary text-danger"
              type="button"
              onClick={handleReject}
              disabled={rejectMutation.isPending}
            >
              <Icon name="XCircle" size={16} />{' '}
              {rejectMutation.isPending ? 'Đang xử lý...' : 'Khách từ chối'}
            </button>
            <button
              className="btn-secondary"
              type="button"
              onClick={() => onEdit(quotation)}
            >
              <Icon name="Pencil" size={16} /> Sửa đổi
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
              ? 'Đang chuyển...'
              : 'Chuyển thành Đơn hàng'}
          </button>
        )}
        {quotation.status === 'converted' && quotation.converted_order_id && (
          <button
            className="btn-primary"
            type="button"
            onClick={() => onViewOrder(quotation.converted_order_id!)}
          >
            <Icon name="Package" size={16} /> Xem Đơn hàng
          </button>
        )}
        <button
          className="btn-secondary ml-auto"
          type="button"
          onClick={() =>
            window.open(`/print/quotation/${quotationId}`, '_blank')
          }
          title="In Báo giá hoặc lưu PDF"
        >
          <Icon name="Printer" size={16} /> In / PDF
        </button>
      </div>

      {anyMutationError && (
        <p className="text-danger text-sm px-5 mb-4">
          Lỗi: {(anyMutationError as Error).message}
        </p>
      )}

      <div className="px-5 pb-5">
        <h4 className="mb-3 text-base flex items-center gap-2">
          <Icon name="List" size={20} className="text-muted" />
          Dòng hàng ({items.length})
        </h4>
        <div className="data-table-wrap">
          {items.length === 0 ? (
            <p className="table-empty">Chưa có dòng hàng.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-10">#</th>
                  <th>Loại vải</th>
                  <th>Màu</th>
                  <th className="hide-mobile">Khổ (cm)</th>
                  <th className="text-right">Số lượng</th>
                  <th className="text-right">Đơn giá</th>
                  <th className="text-right">Thành tiền</th>
                  <th className="hide-mobile">SX (ngày)</th>
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
                    Tạm tính
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
                        : 'cố định'}
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
                    Tổng cộng
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
