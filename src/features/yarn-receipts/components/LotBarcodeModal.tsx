import { useRef } from 'react';

import { Button } from '@/shared/components';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { BarcodeDisplay } from '@/shared/components/BarcodeDisplay';
import { buildBarcodeValue } from '@/shared/lib/identifier.service';
import { openPrintWindow } from '@/shared/lib/print-template.engine';
import { LOT_TAG_CSS } from '@/shared/lib/print-template.css';
import { formatPackaging } from '@/shared/utils/packaging.util';
import type { YarnReceipt } from '@/features/yarn-receipts/types';

/* ── Constants ── */

const LABELS = {
  title: 'Barcode Truy xuất Lô',
  receiptNumber: 'Số phiếu',
  supplier: 'Nhà cung cấp',
  receiptDate: 'Ngày nhập',
  yarnType: 'Loại sợi',
  lotNumber: 'Mã lô',
  quantity: 'Số lượng',
  packaging: 'Đóng gói',
  print: 'In Barcode',
  close: 'Đóng',
  noItems: 'Không có dòng hàng nào',
} as const;

type LotBarcodeModalProps = {
  receipt: YarnReceipt;
  onClose: () => void;
};

export function LotBarcodeModal({ receipt, onClose }: LotBarcodeModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const items = receipt.yarn_receipt_items ?? [];
  const supplierName = receipt.suppliers?.name ?? '—';

  const handlePrint = () => {
    openPrintWindow(printAreaRef.current, {
      title: `Barcode - ${receipt.receipt_number}`,
      css: LOT_TAG_CSS,
    });
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
            const barcodeData = buildBarcodeValue(
              'yarn_lot',
              item.lot_number ?? '',
            );
            return (
              <div key={item.id} className="form-item-box lot-card">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="lot-header">
                      {LABELS.yarnType}: {item.yarn_type ?? '—'}
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
                  <div className="barcode-wrapper w-full flex justify-center bg-white p-2 rounded">
                    <BarcodeDisplay value={barcodeData} />
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
