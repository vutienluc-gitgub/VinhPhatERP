import { useRef } from 'react';

import { Button } from '@/shared/components';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { QRCodeDisplay } from '@/shared/components/QRCodeDisplay';
import { buildQRPayload } from '@/shared/lib/identifier.service';
import { openPrintWindow } from '@/shared/lib/print-template.engine';
import { LOT_TAG_CSS } from '@/shared/lib/print-template.css';
import { formatPackaging } from '@/shared/utils/packaging.util';
import type { YarnReceipt } from '@/domain/inventory/yarn-receipts.types';
import { MODAL_LABELS as LABELS } from '@/features/yarn-receipts/yarn-receipts.constants';

/* ── Constants ── */

type LotQRModalProps = {
  receipt: YarnReceipt;
  onClose: () => void;
};

export function LotQRModal({ receipt, onClose }: LotQRModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const items = receipt.yarn_receipt_items ?? [];
  const supplierName = receipt.suppliers?.name ?? '—';

  const handlePrint = () => {
    openPrintWindow(printAreaRef.current, {
      title: `QR - ${receipt.receipt_number}`,
      css: LOT_TAG_CSS,
    });
  };

  return (
    <AdaptiveSheet
      open={true}
      onClose={onClose}
      title={`${LABELS.qrTitle} — ${receipt.receipt_number}`}
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
        <div className="text-sm text-muted-foreground">
          <strong>{LABELS.receiptNumber}:</strong> {receipt.receipt_number}
        </div>
        <div className="text-sm text-muted-foreground">
          <strong>{LABELS.supplier}:</strong> {supplierName}
        </div>
        <div className="text-sm text-muted-foreground">
          <strong>{LABELS.receiptDate}:</strong> {receipt.receipt_date}
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          {LABELS.noItems}
        </p>
      ) : (
        <div ref={printAreaRef} className="flex flex-col gap-4">
          {items.map((item, idx) => {
            const qrData = buildQRPayload('yarn_lot', item.lot_number ?? '', {
              receipt: receipt.receipt_number,
              yarn: item.yarn_type ?? '',
            });
            return (
              <div key={item.id} className="form-item-box">
                <div className="flex items-start gap-4">
                  <QRCodeDisplay
                    value={qrData}
                    size={140}
                    label={item.lot_number ?? '—'}
                  />
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
                    <p className="lot-detail text-xs text-muted-foreground mt-1">
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
