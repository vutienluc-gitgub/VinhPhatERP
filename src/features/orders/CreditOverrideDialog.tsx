/**
 * CreditOverrideDialog
 * =====================
 * Hiển thị khi createOrder trả về lỗi CREDIT_OVERDUE hoặc CREDIT_LIMIT_EXCEEDED.
 * Chỉ Manager/Admin mới thấy nút "Xác nhận tiếp tục" — Sale chỉ thấy thông báo.
 *
 * Props:
 *   open           – visible/hidden
 *   errorCode      – 'CREDIT_OVERDUE' | 'CREDIT_LIMIT_EXCEEDED'
 *   message        – chuỗi từ Edge Function
 *   detail         – object chứa số liệu
 *   onConfirm      – callback khi Manager xác nhận (gọi lại createOrder với managerOverride=true)
 *   onCancel       – callback đóng dialog
 *   userRole       – role của user hiện tại
 */

import { Icon } from '@/shared/components/Icon';

import type { CreateOrderError } from './useCreateOrderV2';

interface CreditOverrideDialogProps {
  open: boolean;
  code: CreateOrderError['code'];
  message: string;
  detail?: CreateOrderError['detail'];
  userRole: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const VND = (n: number | undefined) =>
  n === undefined
    ? '—'
    : new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(n);

export function CreditOverrideDialog({
  open,
  code,
  message,
  detail,
  userRole,
  onConfirm,
  onCancel,
  isLoading,
}: CreditOverrideDialogProps) {
  if (!open) return null;

  const canOverride = ['admin', 'manager'].includes(userRole);
  const isOverdue = code === 'CREDIT_OVERDUE';

  return (
    <div className="credit-dialog-overlay" role="dialog" aria-modal="true">
      <div className="credit-dialog">
        {/* Header */}
        <div className="credit-dialog__header">
          <div className="credit-dialog__icon-wrap credit-dialog__icon-wrap--warning">
            {isOverdue ? (
              <Icon name="AlertTriangle" size={24} />
            ) : (
              <Icon name="ShieldAlert" size={24} />
            )}
          </div>

          <div className="credit-dialog__title-block">
            <h2 className="credit-dialog__title">
              {isOverdue
                ? 'Cảnh báo: Nợ quá hạn'
                : 'Cảnh báo: Vượt hạn mức tín dụng'}
            </h2>
            <p className="credit-dialog__subtitle">
              {isOverdue
                ? 'Khách hàng đang có công nợ quá hạn chưa thanh toán'
                : 'Đơn hàng sẽ đẩy công nợ khách vượt quá hạn mức cho phép'}
            </p>
          </div>

          <button
            className="credit-dialog__close"
            onClick={onCancel}
            aria-label="Đóng"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="credit-dialog__body">
          <p className="credit-dialog__message">{message}</p>

          {/* Số liệu chi tiết */}
          {detail && (
            <div className="credit-dialog__stats">
              {detail.overdueDebt !== undefined && (
                <div className="credit-dialog__stat credit-dialog__stat--danger">
                  <span className="credit-dialog__stat-label">Nợ quá hạn</span>
                  <span className="credit-dialog__stat-value">
                    {VND(detail.overdueDebt)}
                  </span>
                </div>
              )}
              {detail.currentDebt !== undefined && (
                <div className="credit-dialog__stat">
                  <span className="credit-dialog__stat-label">
                    Công nợ hiện tại
                  </span>
                  <span className="credit-dialog__stat-value">
                    {VND(detail.currentDebt)}
                  </span>
                </div>
              )}
              {detail.orderTotal !== undefined && (
                <div className="credit-dialog__stat">
                  <span className="credit-dialog__stat-label">
                    Giá trị đơn mới
                  </span>
                  <span className="credit-dialog__stat-value">
                    {VND(detail.orderTotal)}
                  </span>
                </div>
              )}
              {detail.projectedDebt !== undefined && (
                <div className="credit-dialog__stat credit-dialog__stat--warning">
                  <span className="credit-dialog__stat-label">
                    Dự kiến công nợ sau tạo đơn
                  </span>
                  <span className="credit-dialog__stat-value">
                    {VND(detail.projectedDebt)}
                  </span>
                </div>
              )}
              {detail.creditLimit !== undefined && (
                <div className="credit-dialog__stat credit-dialog__stat--muted">
                  <span className="credit-dialog__stat-label">
                    Hạn mức tín dụng
                  </span>
                  <span className="credit-dialog__stat-value">
                    {VND(detail.creditLimit)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Quyền override */}
          {canOverride ? (
            <div className="credit-dialog__override-notice">
              <p>
                <strong>Bạn có quyền Manager/Admin.</strong> Bạn có thể xác nhận
                tiếp tục tạo đơn. Thao tác này sẽ được ghi vào nhật ký kiểm
                toán.
              </p>
            </div>
          ) : (
            <div className="credit-dialog__no-override-notice">
              <p>
                Bạn không có quyền bỏ qua cảnh báo này. Vui lòng liên hệ{' '}
                <strong>Manager</strong> để được xác nhận trước khi tạo đơn
                hàng.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="credit-dialog__actions">
          <button
            className="btn btn--secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            Huỷ bỏ
          </button>

          {canOverride && (
            <button
              className="btn btn--danger"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="btn__spinner" />
                  Đang xử lý...
                </>
              ) : (
                'Xác nhận tiếp tục (Override)'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
