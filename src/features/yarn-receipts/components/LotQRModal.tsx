import { useRef } from 'react';

import { Button } from '@/shared/components';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { QRCodeDisplay } from '@/shared/components/QRCodeDisplay';
import type { YarnReceipt } from '@/features/yarn-receipts/types';

/* ── Constants ── */

const LABELS = {
  title: 'QR Truy xuất Lô',
  receiptNumber: 'Số phiếu',
  supplier: 'Nhà cung cấp',
  receiptDate: 'Ngày nhập',
  yarnType: 'Loại sợi',
  lotNumber: 'Mã lô',
  quantity: 'Số lượng',
  packaging: 'Đóng gói',
  print: 'In QR',
  close: 'Đóng',
  noItems: 'Không có dòng hàng nào',
  conesUnit: 'côn/thùng',
  boxLabel: 'Thùng',
} as const;

type LotQRModalProps = {
  receipt: YarnReceipt;
  onClose: () => void;
};

/**
 * Builds the QR data string for a yarn receipt lot.
 * Format: VP-LOT:{receipt_number}:{lot_number}:{yarn_type}
 */
function buildQRData(
  receiptNumber: string,
  lotNumber: string,
  yarnType: string,
): string {
  const lot = lotNumber || 'N/A';
  const yarn = yarnType || 'N/A';
  return `VP-LOT:${receiptNumber}:${lot}:${yarn}`;
}

/**
 * Formats packaging info from item fields.
 */
function formatPackaging(item: Record<string, unknown>): string {
  const parts: string[] = [];

  const cones = Number(item.cones_per_box);
  if (!Number.isNaN(cones) && cones > 0) {
    parts.push(`${cones} ${LABELS.conesUnit}`);
  }

  const boxCount = Number(item.box_count);
  if (!Number.isNaN(boxCount) && boxCount > 0) {
    parts.push(`${boxCount} ${LABELS.boxLabel}`);
  }

  const boxNo = String(item.box_no ?? '');
  if (boxNo) {
    parts.push(`Box #${boxNo}`);
  }

  return parts.length > 0 ? parts.join(' | ') : '—';
}

export function LotQRModal({ receipt, onClose }: LotQRModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const items = receipt.yarn_receipt_items ?? [];
  const supplierName = receipt.suppliers?.name ?? '—';

  const handlePrint = () => {
    const printArea = printAreaRef.current;
    if (!printArea) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR - ${receipt.receipt_number}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 20px; }
            .lot-card { page-break-inside: avoid; margin-bottom: 24px; border: 1px solid #ddd; padding: 16px; border-radius: 8px; }
            .lot-header { font-weight: 600; font-size: 14px; margin-bottom: 8px; }
            .lot-detail { font-size: 12px; color: #555; margin: 2px 0; }
            .qr-wrapper { text-align: center; margin: 12px 0; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>${printArea.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <AdaptiveSheet
      open={true}
      onClose={onClose}
      title={`${LABELS.title} — ${receipt.receipt_number}`}
      maxWidth={520}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            {LABELS.close}
          </Button>
          {items.length > 0 && (
            <Button variant="primary" type="button" onClick={handlePrint}>
              {LABELS.print}
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-3 mb-3">
        <div className="text-sm text-muted">
          <strong>{LABELS.receiptNumber}:</strong> {receipt.receipt_number}
        </div>
        <div className="text-sm text-muted">
          <strong>{LABELS.supplier}:</strong> {supplierName}
        </div>
        <div className="text-sm text-muted">
          <strong>{LABELS.receiptDate}:</strong> {receipt.receipt_date}
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-muted text-center py-8">{LABELS.noItems}</p>
      ) : (
        <div ref={printAreaRef} className="flex flex-col gap-4">
          {items.map((item, idx) => {
            const qrData = buildQRData(
              receipt.receipt_number,
              item.lot_number ?? '',
              item.yarn_type ?? '',
            );
            return (
              <div key={item.id} className="form-item-box">
                <div className="flex items-start gap-4">
                  <QRCodeDisplay value={qrData} size={140} label={qrData} />
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="lot-card">
                      <div className="lot-header">
                        {LABELS.yarnType}: {item.yarn_type ?? '—'}
                      </div>
                    </div>
                    <p className="lot-detail text-sm">
                      <strong>{LABELS.lotNumber}:</strong>{' '}
                      {item.lot_number || '—'}
                    </p>
                    <p className="lot-detail text-sm">
                      <strong>{LABELS.quantity}:</strong>{' '}
                      {Number(item.quantity)} {item.unit ?? 'kg'}
                    </p>
                    <p className="lot-detail text-sm">
                      <strong>{LABELS.packaging}:</strong>{' '}
                      {formatPackaging(
                        item as unknown as Record<string, unknown>,
                      )}
                    </p>
                    <p className="lot-detail text-xs text-muted mt-1">
                      #{idx + 1}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdaptiveSheet>
  );
}
