import React, { useState } from 'react';

import { generateVietQrUrl } from '@/domain/portal/portal-payment.utils';

import { PORTAL_ORDER_DETAIL_TEXT } from './orders.constants';

interface PortalVietQrCardProps {
  amount: number;
  orderNumber: string;
  customerCode?: string;
}

const DEFAULT_BANK_INFO = {
  bankName: 'MSB - Ngân hàng TMCP Hàng Hải Việt Nam',
  bankBin: '970426',
  accountNumber: '80000346931',
  accountName: 'CÔNG TY TNHH SẢN XUẤT THƯƠNG MẠI DỆT MAY VĨNH PHÁT',
};

export const PortalVietQrCard: React.FC<PortalVietQrCardProps> = ({
  amount,
  orderNumber,
  customerCode = 'KH',
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const transferMemo = `${customerCode} ${orderNumber} TT`.slice(0, 50);

  const qrUrl = generateVietQrUrl({
    bankBin: DEFAULT_BANK_INFO.bankBin,
    accountNumber: DEFAULT_BANK_INFO.accountNumber,
    amount,
    memo: transferMemo,
    accountName: DEFAULT_BANK_INFO.accountName,
  });

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div
      style={{
        border: '1px dashed var(--border)',
        borderRadius: '12px',
        padding: '1.25rem',
        background: 'var(--surface)',
      }}
    >
      <div style={{ marginBottom: '1rem' }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: '1rem',
            color: 'var(--foreground)',
          }}
        >
          {PORTAL_ORDER_DETAIL_TEXT.QR_TITLE}
        </div>
        <div
          style={{
            fontSize: '0.8rem',
            color: 'var(--muted-foreground)',
            marginTop: '0.25rem',
          }}
        >
          {PORTAL_ORDER_DETAIL_TEXT.QR_SUBTITLE}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1.5rem',
          alignItems: 'center',
        }}
      >
        {/* QR Image */}
        <div
          style={{
            background: 'var(--surface-strong)',
            padding: '0.5rem',
            borderRadius: '10px',
            border: '1px solid var(--border)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            textAlign: 'center',
          }}
        >
          <img
            src={qrUrl}
            alt="VietQR Payment"
            style={{
              width: '180px',
              height: '180px',
              objectFit: 'contain',
              display: 'block',
            }}
            loading="lazy"
          />
          <span
            style={{
              fontSize: '0.72rem',
              color: 'var(--muted-foreground)',
              display: 'block',
              marginTop: '0.35rem',
            }}
          >
            Quét bằng App Ngân Hàng
          </span>
        </div>

        {/* Transfer Details */}
        <div
          style={{
            flex: 1,
            minWidth: '260px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--muted-foreground)',
                display: 'block',
              }}
            >
              {PORTAL_ORDER_DETAIL_TEXT.BANK_NAME}
            </span>
            <span
              style={{
                fontWeight: 600,
                fontSize: '0.9rem',
                color: 'var(--foreground)',
              }}
            >
              {DEFAULT_BANK_INFO.bankName}
            </span>
          </div>

          <div>
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--muted-foreground)',
                display: 'block',
              }}
            >
              {PORTAL_ORDER_DETAIL_TEXT.ACCOUNT_NAME}
            </span>
            <span
              style={{
                fontWeight: 600,
                fontSize: '0.85rem',
                color: 'var(--foreground)',
              }}
            >
              {DEFAULT_BANK_INFO.accountName}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--muted-foreground)',
                  display: 'block',
                }}
              >
                {PORTAL_ORDER_DETAIL_TEXT.ACCOUNT_NUMBER}
              </span>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: '1rem',
                  color: 'var(--primary)',
                }}
              >
                {DEFAULT_BANK_INFO.accountNumber}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(DEFAULT_BANK_INFO.accountNumber, 'acc')}
              className="portal-btn portal-btn--secondary"
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
            >
              {copiedField === 'acc'
                ? PORTAL_ORDER_DETAIL_TEXT.COPY_SUCCESS
                : PORTAL_ORDER_DETAIL_TEXT.BTN_COPY}
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--muted-foreground)',
                  display: 'block',
                }}
              >
                {PORTAL_ORDER_DETAIL_TEXT.TRANSFER_MEMO}
              </span>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  color: 'var(--foreground)',
                }}
              >
                {transferMemo}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(transferMemo, 'memo')}
              className="portal-btn portal-btn--secondary"
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
            >
              {copiedField === 'memo'
                ? PORTAL_ORDER_DETAIL_TEXT.COPY_SUCCESS
                : PORTAL_ORDER_DETAIL_TEXT.BTN_COPY}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
