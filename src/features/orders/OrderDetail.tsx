import { ProgressTimeline } from '@/features/order-progress/ProgressTimeline';
import { useOrderProgress } from '@/features/order-progress/useOrderProgress';
import { useConfirm } from '@/shared/components/ConfirmDialog';
import { formatCurrency } from '@/shared/utils/format';

import { ORDER_STATUS_LABELS } from './orders.module';
import type { Order, OrderStatus } from './types';
import {
  useCancelOrder,
  useCompleteOrder,
  useConfirmOrder,
  useOrder,
} from './useOrders';

type OrderDetailProps = {
  orderId: string;
  onBack: () => void;
  onEdit: (order: Order) => void;
  onCreateShipment: (order: Order) => void;
  onCreatePayment: (order: Order) => void;
  onReserveRolls: (order: Order) => void;
};

function statusClass(status: OrderStatus): string {
  switch (status) {
    case 'confirmed':
      return 'reserved';
    case 'in_progress':
      return 'in_process';
    case 'completed':
      return 'in_stock';
    case 'cancelled':
      return 'damaged';
    default:
      return 'shipped';
  }
}

export function OrderDetail({
  orderId,
  onBack,
  onEdit,
  onCreateShipment,
  onCreatePayment,
  onReserveRolls,
}: OrderDetailProps) {
  const { data: order, isLoading, error } = useOrder(orderId);
  const { data: progressStages = [] } = useOrderProgress(orderId);
  const confirmMutation = useConfirmOrder();
  const cancelMutation = useCancelOrder();
  const completeMutation = useCompleteOrder();
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
  if (!order)
    return (
      <div className="panel-card">
        <p className="table-empty">Không tìm thấy đơn hàng.</p>
      </div>
    );

  const balanceDue = order.total_amount - order.paid_amount;
  const items = order.order_items ?? [];

  async function handleConfirm() {
    const ok = await confirm({
      message:
        'Xác nhận đơn hàng? Hệ thống sẽ tạo 7 công đoạn tiến độ tự động.',
    });
    if (!ok) return;
    confirmMutation.mutate(orderId);
  }

  async function handleCancel() {
    const ok = await confirm({
      message: 'Huỷ đơn hàng này?',
      variant: 'danger',
    });
    if (!ok) return;
    cancelMutation.mutate(orderId);
  }

  async function handleComplete() {
    const ok = await confirm({ message: 'Hoàn thành đơn hàng?' });
    if (!ok) return;
    completeMutation.mutate(orderId);
  }

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
            <h3 style={{ margin: 0 }}>{order.order_number}</h3>
            <span className="td-muted">{order.customers?.name ?? '—'}</span>
          </div>
          <span className={`roll-status ${statusClass(order.status)}`}>
            {ORDER_STATUS_LABELS[order.status]}
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
            <div className="td-muted summary-label">Ngày đặt</div>
            <div>{order.order_date}</div>
          </div>
          <div>
            <div className="td-muted summary-label">Ngày giao</div>
            <div>{order.delivery_date ?? '—'}</div>
          </div>
          <div>
            <div className="td-muted summary-label">Tổng tiền</div>
            <div className="numeric-cell" style={{ fontWeight: 600 }}>
              {formatCurrency(order.total_amount)} đ
            </div>
          </div>
          <div>
            <div className="td-muted summary-label">Đã thu</div>
            <div className="numeric-paid">
              {formatCurrency(order.paid_amount)} đ
            </div>
          </div>
          <div>
            <div className="td-muted summary-label">Còn nợ</div>
            <div className={balanceDue > 0 ? 'numeric-debt' : 'numeric-paid'}>
              {formatCurrency(balanceDue)} đ
            </div>
          </div>
        </div>

        {order.notes && (
          <div
            style={{
              padding: '0.75rem',
              background: 'var(--surface)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.9rem',
              marginBottom: '1rem',
            }}
          >
            <strong>Ghi chú:</strong> {order.notes}
          </div>
        )}

        {/* Payment progress bar */}
        {order.total_amount > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.8rem',
                marginBottom: '0.25rem',
              }}
            >
              <span>Thanh toán</span>
              <span>
                {Math.min(
                  100,
                  Math.round((order.paid_amount / order.total_amount) * 100),
                )}
                %
              </span>
            </div>
            <div
              style={{
                height: 8,
                background: 'var(--border)',
                borderRadius: 4,
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, (order.paid_amount / order.total_amount) * 100)}%`,
                  background: balanceDue <= 0 ? '#0c8f68' : '#0b6bcb',
                  borderRadius: 4,
                  transition: 'width 300ms ease',
                }}
              />
            </div>
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
          {order.status === 'draft' && (
            <>
              <button
                className="btn-secondary"
                type="button"
                onClick={() => onEdit(order)}
              >
                ✏️ Sửa đơn
              </button>
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
                {confirmMutation.isPending
                  ? 'Đang xác nhận...'
                  : '✓ Xác nhận đơn'}
              </button>
            </>
          )}
          {(order.status === 'confirmed' || order.status === 'in_progress') && (
            <>
              <button
                className="btn-secondary"
                type="button"
                onClick={() => onReserveRolls(order)}
              >
                🔒 Giữ cuộn
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={() => onCreateShipment(order)}
                style={{
                  padding: '0.55rem 1rem',
                  fontSize: '0.88rem',
                }}
              >
                📦 Tạo phiếu xuất
              </button>
              <button
                className="btn-secondary"
                type="button"
                onClick={() => onCreatePayment(order)}
              >
                💰 Thu tiền
              </button>
            </>
          )}
          {order.status === 'in_progress' && (
            <button
              className="btn-secondary"
              type="button"
              onClick={handleComplete}
              disabled={completeMutation.isPending}
            >
              {completeMutation.isPending ? 'Đang xử lý...' : '✓ Hoàn thành'}
            </button>
          )}
          {order.status !== 'cancelled' && order.status !== 'completed' && (
            <button
              className="btn-secondary"
              type="button"
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
              style={{ color: '#c0392b' }}
            >
              ✕ Huỷ đơn
            </button>
          )}
        </div>

        {(confirmMutation.error ||
          cancelMutation.error ||
          completeMutation.error) && (
          <p
            style={{
              color: '#c0392b',
              fontSize: '0.88rem',
            }}
          >
            Lỗi:{' '}
            {
              (
                (confirmMutation.error ||
                  cancelMutation.error ||
                  completeMutation.error) as Error
              ).message
            }
          </p>
        )}
      </div>

      {/* Order items table */}
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
                  <th style={{ textAlign: 'right' }}>Số lượng</th>
                  <th style={{ textAlign: 'right' }}>Đơn giá</th>
                  <th style={{ textAlign: 'right' }}>Thành tiền</th>
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
                        {formatCurrency(item.amount ?? 0)}
                      </td>
                    </tr>
                  ))}
                <tr>
                  <td
                    colSpan={5}
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
                    {formatCurrency(order.total_amount)} đ
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Production progress timeline */}
      {progressStages.length > 0 && (
        <div style={{ padding: '0 1.25rem 1.25rem' }}>
          <h4 style={{ marginBottom: '0.75rem' }}>Tiến độ sản xuất</h4>
          <ProgressTimeline
            stages={progressStages}
            readonly={
              order.status === 'cancelled' || order.status === 'completed'
            }
          />
        </div>
      )}
    </div>
  );
}
