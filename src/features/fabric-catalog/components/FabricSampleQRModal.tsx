import { useRef } from 'react';

import { Button } from '@/shared/components';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { QRCodeDisplay } from '@/shared/components/QRCodeDisplay';
import { buildQRPayload } from '@/shared/lib/identifier.service';
import { openPrintWindow } from '@/shared/lib/print-template.engine';
import { SAMPLE_TAG_CSS } from '@/shared/lib/print-template.css';
import type { FabricCatalog } from '@/features/fabric-catalog/types';

/* ── Constants ── */

const LABELS = {
  title: 'In Tem Mẫu Vải',
  composition: 'Thành phần',
  specs: 'Quy cách (chuẩn)',
  unit: 'Đơn vị',
  print: 'In Tem',
  close: 'Đóng',
  scanHint: 'Quét mã để xem chi tiết trên ERP',
} as const;

type FabricSampleQRModalProps = {
  catalog: FabricCatalog;
  onClose: () => void;
};

export function FabricSampleQRModal({
  catalog,
  onClose,
}: FabricSampleQRModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    openPrintWindow(printAreaRef.current, {
      title: `Tem Mẫu - ${catalog.code}`,
      css: SAMPLE_TAG_CSS,
    });
  };

  const qrData = buildQRPayload('fabric_catalog', catalog.id, {
    code: catalog.code,
    name: catalog.name,
  });

  return (
    <AdaptiveSheet
      open={true}
      onClose={onClose}
      title={`${LABELS.title} — ${catalog.code}`}
      maxWidth={400}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            {LABELS.close}
          </Button>
          <Button
            variant="primary"
            type="button"
            onClick={handlePrint}
            leftIcon="Printer"
          >
            {LABELS.print}
          </Button>
        </>
      }
    >
      <div ref={printAreaRef} className="flex flex-col items-center">
        <div className="sample-tag w-full p-4 border border-border rounded-lg bg-white shadow-sm flex flex-col items-center">
          <div className="text-lg font-bold tag-header">{catalog.name}</div>
          <div className="text-primary font-semibold text-base mb-3 tag-code">
            {catalog.code}
          </div>

          <div className="w-full text-left bg-surface/50 p-3 rounded-md mb-4 flex flex-col gap-1">
            <div className="text-sm tag-detail">
              <span className="text-muted mr-1">{LABELS.composition}:</span>
              <span className="font-medium">{catalog.composition || '—'}</span>
            </div>
            {(catalog.target_width_cm || catalog.target_gsm) && (
              <div className="text-sm tag-detail">
                <span className="text-muted mr-1">{LABELS.specs}:</span>
                <span className="font-medium">
                  {catalog.target_width_cm
                    ? `${catalog.target_width_cm}cm`
                    : ''}
                  {catalog.target_width_cm && catalog.target_gsm ? ' - ' : ''}
                  {catalog.target_gsm ? `${catalog.target_gsm}gsm` : ''}
                </span>
              </div>
            )}
            <div className="text-sm tag-detail">
              <span className="text-muted mr-1">{LABELS.unit}:</span>
              <span className="font-medium">{catalog.unit}</span>
            </div>
          </div>

          <div className="qr-wrapper flex justify-center p-2 bg-white rounded">
            <QRCodeDisplay value={qrData} size={150} />
          </div>
          <div className="text-[10px] text-muted mt-2">{LABELS.scanHint}</div>
        </div>
      </div>
    </AdaptiveSheet>
  );
}
