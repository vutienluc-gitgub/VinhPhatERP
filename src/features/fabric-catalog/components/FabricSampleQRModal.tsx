import { useRef, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

import { Button } from '@/shared/components';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { QRCodeDisplay } from '@/shared/components/QRCodeDisplay';
import { buildQRPayload } from '@/shared/lib/identifier.service';
import { openPrintWindow } from '@/shared/lib/print-template.engine';
import { SAMPLE_TAG_CSS } from '@/shared/lib/print-template.css';
import type { FabricCatalog } from '@/features/fabric-catalog/types';
import {
  drawTagToCanvas,
  formatSpecs,
  LABELS_PRINT,
} from '@/features/fabric-catalog/fabric-sample-qr.utils';

const MODAL_LABELS = {
  title: 'In Tem Mẫu Vải',
  print: 'In Tem',
  download: 'Tải Ảnh',
  close: 'Đóng',
  printTitlePrefix: 'Tem Mẫu - ',
  downloadPrefix: 'Tem_Mau_',
  downloadError: 'Lỗi khi tải ảnh tem mẫu.',
} as const;

const QR_SIZE = 150;

type FabricSampleQRModalProps = {
  catalog: FabricCatalog;
  onClose: () => void;
};

export function FabricSampleQRModal({
  catalog,
  onClose,
}: FabricSampleQRModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const qrWrapperRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handlePrint = () => {
    openPrintWindow(printAreaRef.current, {
      title: `${MODAL_LABELS.printTitlePrefix}${catalog.code}`,
      css: SAMPLE_TAG_CSS,
    });
  };

  const handleDownload = useCallback(async () => {
    try {
      setIsDownloading(true);

      const qrCanvasEl = qrWrapperRef.current?.querySelector('canvas');
      const tagCanvas = drawTagToCanvas(catalog, qrCanvasEl ?? null);

      if (!tagCanvas) {
        toast.error(MODAL_LABELS.downloadError);
        return;
      }

      const dataUrl = tagCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${MODAL_LABELS.downloadPrefix}${catalog.code}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      toast.error(MODAL_LABELS.downloadError);
      console.error('[DownloadImageError]', err);
    } finally {
      setIsDownloading(false);
    }
  }, [catalog]);

  const qrData = buildQRPayload('fabric_catalog', catalog.slug || catalog.id, {
    code: catalog.code,
    name: catalog.name,
  });

  const specsDisplay = formatSpecs(catalog.target_width_cm, catalog.target_gsm);

  return (
    <AdaptiveSheet
      open={true}
      onClose={onClose}
      title={`${MODAL_LABELS.title} — ${catalog.code}`}
      maxWidth={400}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            {MODAL_LABELS.close}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={handleDownload}
              leftIcon="Download"
              isLoading={isDownloading}
            >
              {MODAL_LABELS.download}
            </Button>
            <Button
              variant="primary"
              type="button"
              onClick={handlePrint}
              leftIcon="Printer"
            >
              {MODAL_LABELS.print}
            </Button>
          </div>
        </>
      }
    >
      <div ref={printAreaRef} className="flex flex-col items-center">
        {!catalog.is_public && (
          <div className="w-full mb-4 p-3 bg-warning-50 text-warning-900 border border-warning-200 rounded-md text-sm text-center">
            ⚠️ Mẫu vải này <b>chưa được bật Công khai</b>. Khách hàng quét mã QR
            sẽ không xem được.
          </div>
        )}
        <div className="sample-tag w-full p-4 border border-border rounded-lg bg-white shadow-sm flex flex-col items-center">
          <div className="text-lg font-bold tag-header">{catalog.name}</div>
          <div className="text-primary font-semibold text-base mb-3 tag-code">
            {catalog.code}
          </div>

          <div className="w-full text-left bg-surface/50 p-3 rounded-md mb-4 flex flex-col gap-1">
            <div className="text-sm tag-detail">
              <span className="text-muted mr-1">
                {LABELS_PRINT.composition}:
              </span>
              <span className="font-medium">
                {catalog.composition || LABELS_PRINT.noValue}
              </span>
            </div>
            {specsDisplay && (
              <div className="text-sm tag-detail">
                <span className="text-muted mr-1">{LABELS_PRINT.specs}:</span>
                <span className="font-medium">{specsDisplay}</span>
              </div>
            )}
            <div className="text-sm tag-detail">
              <span className="text-muted mr-1">{LABELS_PRINT.unit}:</span>
              <span className="font-medium">{catalog.unit}</span>
            </div>
          </div>

          <div
            ref={qrWrapperRef}
            className="qr-wrapper flex justify-center p-2 bg-white rounded"
          >
            <QRCodeDisplay value={qrData} size={QR_SIZE} />
          </div>
          <div className="text-[10px] text-muted mt-2">
            {LABELS_PRINT.scanHint}
          </div>
        </div>
      </div>
    </AdaptiveSheet>
  );
}
