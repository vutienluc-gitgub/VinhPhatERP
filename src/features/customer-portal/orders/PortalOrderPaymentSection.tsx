import React from 'react';

import {
  amountToVietnameseWords,
  formatVndAmount,
} from '@/domain/portal/portal-payment.utils';
import type { OrderPaymentSummary } from '@/domain/portal/types';

import { PORTAL_ORDER_DETAIL_TEXT } from './orders.constants';
import { PortalVietQrCard } from './PortalVietQrCard';

interface PortalOrderPaymentSectionProps {
  paymentSummary: OrderPaymentSummary;
  orderNumber: string;
  customerCode?: string;
}

export const PortalOrderPaymentSection: React.FC<
  PortalOrderPaymentSectionProps
> = ({ paymentSummary, orderNumber, customerCode = 'KH' }) => {
  const amountInWords = amountToVietnameseWords(paymentSummary.grandTotal);

  return (
    <div className="portal-table-wrap">
      <div className="portal-card-header">
        <span>{PORTAL_ORDER_DETAIL_TEXT.PAYMENT_TITLE}</span>
        {paymentSummary.remainingBalance === 0 ? (
          <span className="portal-badge portal-badge--paid">
            Đã thanh toán đủ
          </span>
        ) : (
          <span className="portal-badge portal-badge--partial">
            Cần thanh toán: {formatVndAmount(paymentSummary.remainingBalance)} đ
          </span>
        )}
      </div>

      <div className="portal-card-body">
        {/* Payment Calculation Table */}
        <div className="portal-detail-grid" style={{ marginBottom: '1.25rem' }}>
          <div className="portal-detail-item">
            <label>{PORTAL_ORDER_DETAIL_TEXT.SUBTOTAL}</label>
            <p style={{ fontWeight: 600 }}>
              {formatVndAmount(paymentSummary.subtotal)} đ
            </p>
          </div>
          <div className="portal-detail-item">
            <label>{PORTAL_ORDER_DETAIL_TEXT.VAT_LABEL}</label>
            <p style={{ fontWeight: 600, color: 'var(--primary)' }}>
              +{formatVndAmount(paymentSummary.vatAmount)} đ
            </p>
          </div>
          <div className="portal-detail-item">
            <label>{PORTAL_ORDER_DETAIL_TEXT.GRAND_TOTAL}</label>
            <p
              style={{
                fontWeight: 700,
                fontSize: '1.1rem',
                color: 'var(--success)',
              }}
            >
              {formatVndAmount(paymentSummary.grandTotal)} đ
            </p>
          </div>
          <div className="portal-detail-item">
            <label>{PORTAL_ORDER_DETAIL_TEXT.PAID_AMOUNT}</label>
            <p style={{ fontWeight: 600 }}>
              {formatVndAmount(paymentSummary.paidAmount)} đ
            </p>
          </div>
          <div className="portal-detail-item">
            <label>{PORTAL_ORDER_DETAIL_TEXT.REMAINING_AMOUNT}</label>
            <p
              style={{
                fontWeight: 700,
                color:
                  paymentSummary.remainingBalance > 0
                    ? 'var(--danger)'
                    : 'var(--success)',
              }}
            >
              {formatVndAmount(paymentSummary.remainingBalance)} đ
            </p>
          </div>
        </div>

        {/* Written Amount */}
        <div
          style={{
            padding: '0.75rem 1rem',
            background: 'var(--surface-secondary)',
            borderRadius: '8px',
            marginBottom: '1.25rem',
            fontSize: '0.875rem',
          }}
        >
          <span style={{ fontWeight: 600, color: 'var(--muted-foreground)' }}>
            {PORTAL_ORDER_DETAIL_TEXT.IN_WORDS_LABEL}{' '}
          </span>
          <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>
            {amountInWords}
          </span>
        </div>

        {/* VietQR Section (only show when remaining balance > 0) */}
        {paymentSummary.remainingBalance > 0 && (
          <PortalVietQrCard
            amount={paymentSummary.remainingBalance}
            orderNumber={orderNumber}
            customerCode={customerCode}
          />
        )}
      </div>
    </div>
  );
};
