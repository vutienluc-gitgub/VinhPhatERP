import { useConfirm } from '@/shared/components/ConfirmDialog';
import { formatCurrency } from '@/shared/utils/format';

import {
  QUOTATION_STATUS_LABELS,
  QUOTATION_STATUS_ICONS,
} from './quotations.module';
import type { Quotation, QuotationStatus } from './types';
import { useConvertToOrder } from './useConvertToOrder';
import {
  useConfirmQuotation,
  useQuotation,
  useRejectQuotation,
  useSendQuotation,
} from './useQuotations';

type QuotationDetailProps = {
  quotationId: string;
  onBack: () => void;
  onEdit: (quotation: Quotation) => void;
  onViewOrder: (orderId: string) => void;
};

function statusClass(status: QuotationStatus): string {
  switch (status) {
    case 'sent':
      return 'reserved';
    case 'confirmed':
      return 'in_stock';
    case 'rejected':
      return 'damaged';
    case 'expired':
      return 'written_off';
    case 'converted':
      return 'in_process';
    default:
      return 'shipped';
  }
}

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
      <div className="panel-card">
        <p
          style={{
            color: '#c0392b',
            padding: '1rem',
          }}
        >
          Lỗi: {(error as Error).message}
        </p>
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
      <div style={{ padding: '1.25rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1rem',
          }}
        >
          <button className="btn-secondary" type="button" onClick={onBack}>
            ← Quay lại
          </button>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0 }}>
              {quotation.quotation_number}
              {quotation.revision > 1 && (
                <span
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--muted)',
                    marginLeft: '0.5rem',
                  }}
                >
                  (v{quotation.revision})
                </span>
              )}
            </h3>
            <span className="td-muted">{quotation.customers?.name ?? '—'}</span>
          </div>
          <span className={`roll-status ${statusClass(quotation.status)}`}>
            {QUOTATION_STATUS_ICONS[quotation.status]}{' '}
            {QUOTATION_STATUS_LABELS[quotation.status]}
          </span>
        </div>

        {/* Info grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '0.75rem',
            marginBottom: '1rem',
          }}
        >
          <div>
            <div className="td-muted summary-label">Ngày báo giá</div>
            <div>{formatDate(quotation.quotation_date)}</div>
          </div>
          <div>
            <div className="td-muted summary-label">Hiệu lực đến</div>
            <div>{formatDate(quotation.valid_until)}</div>
          </div>
          <div>
            <div className="td-muted summary-label">Tạm tính</div>
            <div className="numeric-cell">
              {formatCurrency(quotation.subtotal)} đ
            </div>
          </div>
          <div>
            <div className="td-muted summary-label">Chiết khấu</div>
            <div
              style={{
                color: quotation.discount_amount > 0 ? '#c0392b' : 'inherit',
              }}
            >
              {quotation.discount_amount > 0 ? (
                <>
                  -{formatCurrency(quotation.discount_amount)} đ
                  <span
                    className="td-muted"
                    style={{
                      fontSize: '0.78rem',
                      marginLeft: '0.3rem',
                    }}
                  >
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
            <div className="td-muted summary-label">
              VAT ({quotation.vat_rate}%)
            </div>
            <div className="numeric-cell">
              {formatCurrency(quotation.vat_amount)} đ
            </div>
          </div>
          <div>
            <div className="td-muted summary-label">Tổng cộng</div>
            <div
              className="numeric-cell"
              style={{
                fontWeight: 700,
                fontSize: '1.05rem',
              }}
            >
              {formatCurrency(quotation.total_amount)} đ
            </div>
          </div>
        </div>

        {/* Terms */}
        {(quotation.delivery_terms || quotation.payment_terms) && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '0.75rem',
              marginBottom: '1rem',
            }}
          >
            {quotation.delivery_terms && (
              <div
                style={{
                  padding: '0.6rem',
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.88rem',
                }}
              >
                <strong>ĐK giao hàng:</strong> {quotation.delivery_terms}
              </div>
            )}
            {quotation.payment_terms && (
              <div
                style={{
                  padding: '0.6rem',
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.88rem',
                }}
              >
                <strong>ĐK thanh toán:</strong> {quotation.payment_terms}
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {quotation.notes && (
          <div
            style={{
              padding: '0.75rem',
              background: 'var(--surface)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.9rem',
              marginBottom: '1rem',
            }}
          >
            <strong>Ghi chú:</strong> {quotation.notes}
          </div>
        )}

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginBottom: '1rem',
          }}
        >
          {quotation.status === 'draft' && (
            <>
              <button
                className="btn-secondary"
                type="button"
                onClick={() => onEdit(quotation)}
              >
                ✏️ Sửa
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={handleSend}
                disabled={sendMutation.isPending}
                style={{
                  padding: '0.55rem 1rem',
                  fontSize: '0.88rem',
                }}
              >
                {sendMutation.isPending ? 'Đang gửi...' : '📤 Gửi khách'}
              </button>
              <button
                className="btn-secondary"
                type="button"
                onClick={handleConfirm}
                disabled={confirmMutation.isPending}
              >
                {confirmMutation.isPending ? 'Đang xử lý...' : '✅ Duyệt luôn'}
              </button>
            </>
          )}
          {quotation.status === 'sent' && (
            <>
              <button
                className="primary-button"
                type="button"
                onClick={handleConfirm}
                disabled={confirmMutation.isPending}
                style={{
                  padding: '0.55rem 1rem',
                  fontSize: '0.88rem',
                }}
              >
                {confirmMutation.isPending ? 'Đang xử lý...' : '✅ Khách duyệt'}
              </button>
              <button
                className="btn-secondary"
                type="button"
                onClick={handleReject}
                disabled={rejectMutation.isPending}
                style={{ color: '#c0392b' }}
              >
                {rejectMutation.isPending
                  ? 'Đang xử lý...'
                  : '❌ Khách từ chối'}
              </button>
              <button
                className="btn-secondary"
                type="button"
                onClick={() => onEdit(quotation)}
              >
                ✏️ Sửa đổi
              </button>
            </>
          )}
          {quotation.status === 'confirmed' &&
            !quotation.converted_order_id && (
              <button
                className="primary-button"
                type="button"
                onClick={handleConvert}
                disabled={convertMutation.isPending}
                style={{
                  padding: '0.55rem 1rem',
                  fontSize: '0.88rem',
                }}
              >
                {convertMutation.isPending
                  ? 'Đang chuyển...'
                  : '🔄 Chuyển thành Đơn hàng'}
              </button>
            )}
          {quotation.status === 'converted' && quotation.converted_order_id && (
            <button
              className="primary-button"
              type="button"
              onClick={() => onViewOrder(quotation.converted_order_id!)}
              style={{
                padding: '0.55rem 1rem',
                fontSize: '0.88rem',
              }}
            >
              📦 Xem Đơn hàng
            </button>
          )}
          <button
            className="btn-secondary"
            type="button"
            onClick={() =>
              window.open(`/print/quotation/${quotationId}`, '_blank')
            }
            style={{ marginLeft: 'auto' }}
            title="In Báo giá hoặc lưu PDF"
          >
            🖨️ In / PDF
          </button>
        </div>

        {anyMutationError && (
          <p
            style={{
              color: '#c0392b',
              fontSize: '0.88rem',
            }}
          >
            Lỗi: {(anyMutationError as Error).message}
          </p>
        )}
      </div>

      {/* Quotation items table */}
      <div style={{ padding: '0 1.25rem 1.25rem' }}>
        <h4 style={{ marginBottom: '0.75rem' }}>Dòng hàng ({items.length})</h4>
        <div
          className="data-table-wrap"
          style={{ borderRadius: 'var(--radius-sm)' }}
        >
          {items.length === 0 ? (
            <p className="table-empty">Chưa có dòng hàng.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Loại vải</th>
                  <th>Màu</th>
                  <th className="hide-mobile">Khổ (cm)</th>
                  <th style={{ textAlign: 'right' }}>Số lượng</th>
                  <th style={{ textAlign: 'right' }}>Đơn giá</th>
                  <th style={{ textAlign: 'right' }}>Thành tiền</th>
                  <th className="hide-mobile">SX (ngày)</th>
                </tr>
              </thead>
              <tbody>
                {items
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((item, idx) => (
                    <tr key={item.id}>
                      <td className="td-muted">{idx + 1}</td>
                      <td>
                        <strong>{item.fabric_type}</strong>
                      </td>
                      <td className="td-muted">{item.color_name ?? '—'}</td>
                      <td className="td-muted hide-mobile">
                        {item.width_cm ?? '—'}
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {new Intl.NumberFormat('vi-VN').format(item.quantity)}{' '}
                        {item.unit}
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: 600,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="td-muted hide-mobile">
                        {item.lead_time_days ?? '—'}
                      </td>
                    </tr>
                  ))}
                {/* Subtotal */}
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: 'right',
                      fontWeight: 600,
                    }}
                  >
                    Tạm tính
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      fontWeight: 600,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {formatCurrency(quotation.subtotal)} đ
                  </td>
                  <td className="hide-mobile"></td>
                </tr>
                {/* Discount */}
                {quotation.discount_amount > 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: 'right',
                        color: '#c0392b',
                      }}
                    >
                      Chiết khấu (
                      {quotation.discount_type === 'percent'
                        ? `${quotation.discount_value}%`
                        : 'cố định'}
                      )
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        color: '#c0392b',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      -{formatCurrency(quotation.discount_amount)} đ
                    </td>
                    <td className="hide-mobile"></td>
                  </tr>
                )}
                {/* VAT */}
                {quotation.vat_amount > 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'right' }}>
                      VAT ({quotation.vat_rate}%)
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      +{formatCurrency(quotation.vat_amount)} đ
                    </td>
                    <td className="hide-mobile"></td>
                  </tr>
                )}
                {/* Total */}
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: 'right',
                      fontWeight: 700,
                    }}
                  >
                    Tổng cộng
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      fontWeight: 700,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {formatCurrency(quotation.total_amount)} đ
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
