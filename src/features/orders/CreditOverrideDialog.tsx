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
import { MoneyText } from '@/shared/value';
import type { CreateOrderError } from '@/application/orders';

import { ORDERS_OVERRIDE_LABELS, ORDERS_PROG_LABELS } from './orders.constants';

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
  n === undefined ? '—' : <MoneyText value={n} suffix="đ" />;

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
                ? ORDERS_OVERRIDE_LABELS.OVERRIDE_TITLE_OVERDUE
                : ORDERS_OVERRIDE_LABELS.OVERRIDE_TITLE_LIMIT}
            </h2>
            <p className="credit-dialog__subtitle">
              {isOverdue
                ? ORDERS_OVERRIDE_LABELS.OVERRIDE_SUB_OVERDUE
                : ORDERS_OVERRIDE_LABELS.OVERRIDE_SUB_LIMIT}
            </p>
          </div>

          <button
            className="credit-dialog__close"
            onClick={onCancel}
            aria-label={ORDERS_OVERRIDE_LABELS.OVERRIDE_CLOSE}
          >
            <Icon name="X" size={20} />
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
                  <span className="credit-dialog__stat-label">
                    {ORDERS_OVERRIDE_LABELS.OVERRIDE_STAT_OVERDUE}
                  </span>
                  <span className="credit-dialog__stat-value">
                    {VND(detail.overdueDebt)}
                  </span>
                </div>
              )}
              {detail.currentDebt !== undefined && (
                <div className="credit-dialog__stat">
                  <span className="credit-dialog__stat-label">
                    {ORDERS_OVERRIDE_LABELS.OVERRIDE_STAT_CURRENT}
                  </span>
                  <span className="credit-dialog__stat-value">
                    {VND(detail.currentDebt)}
                  </span>
                </div>
              )}
              {detail.orderTotal !== undefined && (
                <div className="credit-dialog__stat">
                  <span className="credit-dialog__stat-label">
                    {ORDERS_OVERRIDE_LABELS.OVERRIDE_STAT_NEW}
                  </span>
                  <span className="credit-dialog__stat-value">
                    {VND(detail.orderTotal)}
                  </span>
                </div>
              )}
              {detail.projectedDebt !== undefined && (
                <div className="credit-dialog__stat credit-dialog__stat--warning">
                  <span className="credit-dialog__stat-label">
                    {ORDERS_OVERRIDE_LABELS.OVERRIDE_STAT_PROJECTED}
                  </span>
                  <span className="credit-dialog__stat-value">
                    {VND(detail.projectedDebt)}
                  </span>
                </div>
              )}
              {detail.creditLimit !== undefined && (
                <div className="credit-dialog__stat credit-dialog__stat--muted">
                  <span className="credit-dialog__stat-label">
                    {ORDERS_OVERRIDE_LABELS.OVERRIDE_STAT_LIMIT}
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
              <p>{ORDERS_OVERRIDE_LABELS.OVERRIDE_MSG_ADMIN_ONLY}</p>
            </div>
          ) : (
            <div className="credit-dialog__no-override-notice">
              <p>{ORDERS_OVERRIDE_LABELS.OVERRIDE_MSG_SALE_ONLY}</p>
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
            {ORDERS_OVERRIDE_LABELS.OVERRIDE_BTN_CANCEL}
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
                  {ORDERS_PROG_LABELS.PROG_LOADING}
                </>
              ) : (
                ORDERS_OVERRIDE_LABELS.OVERRIDE_BTN_CONFIRM
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
