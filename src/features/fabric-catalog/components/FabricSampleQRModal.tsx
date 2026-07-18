import { useRef, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

import { Button } from '@/shared/components';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { PUBLIC_COMPONENT_LABELS as COMP_LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';
import { buildQRPayload } from '@/shared/lib/identifier.service';
import { openPrintWindow } from '@/shared/lib/print-template.engine';
import { FABRIC_SAMPLE_HORIZONTAL_CSS } from '@/shared/lib/print-template.css';
import type { FabricCatalog } from '@/features/fabric-catalog/types';
import { drawTagToCanvas } from '@/features/fabric-catalog/fabric-sample-qr.utils';

import { QRFabricLabel } from './QRFabricLabel';

const MODAL_LABELS = {
  title: COMP_LABELS.QR_MODAL_TITLE,
  print: 'In Tem',
  download: COMP_LABELS.QR_MODAL_DOWNLOAD,
  close: COMP_LABELS.QR_MODAL_CLOSE,
  printTitlePrefix: COMP_LABELS.QR_MODAL_PRINT_PREFIX,
  downloadPrefix: 'Tem_Mau_',
  downloadError: COMP_LABELS.QR_MODAL_DOWNLOAD_ERR,
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
  const qrWrapperRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handlePrint = () => {
    openPrintWindow(printAreaRef.current, {
      title: `${MODAL_LABELS.printTitlePrefix}${catalog.code}`,
      css: FABRIC_SAMPLE_HORIZONTAL_CSS,
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
      <div className="flex flex-col items-center">
        {!catalog.is_public && (
          <div className="w-full mb-4 p-3 bg-warning-50 text-warning-900 border border-warning-200 rounded-md text-sm text-center">
            <span
              dangerouslySetInnerHTML={{
                __html: COMP_LABELS.QR_MODAL_NOT_PUBLIC,
              }}
            />
          </div>
        )}
        <div ref={printAreaRef}>
          <div
            ref={qrWrapperRef}
            className="border border-border rounded-lg overflow-hidden bg-white shadow-sm flex justify-center items-center p-2"
            style={{ width: 'fit-content', margin: '0 auto' }}
          >
            <QRFabricLabel
              code={catalog.code}
              name={catalog.name}
              qrValue={qrData}
            />
          </div>
        </div>
      </div>
    </AdaptiveSheet>
  );
}
