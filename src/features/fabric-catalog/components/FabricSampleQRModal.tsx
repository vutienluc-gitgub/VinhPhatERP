import { useRef, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

import { Button } from '@/shared/components';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { PUBLIC_COMPONENT_LABELS as COMP_LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';
import { openPrintWindow } from '@/shared/lib/print-template.engine';
import { FABRIC_SAMPLE_HORIZONTAL_CSS } from '@/shared/lib/print-template.css';
import type { FabricCatalog } from '@/features/fabric-catalog/types';
import { mapCatalogToFabricLabel } from '@/features/fabric-catalog/label/mapper';
import { LabelRegistry, exportSvgToPng } from '@/shared/lib/label-engine';

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
  const [isDownloading, setIsDownloading] = useState(false);

  // 1. Prepare Model via Mapper
  const labelData = mapCatalogToFabricLabel(catalog);

  // 2. Load Template Plugin
  const template = LabelRegistry.get('fabric-80x40');

  const handlePrint = () => {
    openPrintWindow(printAreaRef.current, {
      title: `${MODAL_LABELS.printTitlePrefix}${catalog.code}`,
      css: FABRIC_SAMPLE_HORIZONTAL_CSS,
    });
  };

  const handleDownload = useCallback(async () => {
    try {
      setIsDownloading(true);

      // 3. Render purely to SVG string via Engine
      const svgString = await template.renderSVG(labelData);

      // 4. Export SVG to PNG independently of DOM
      // Render at 10x scale for 80x40mm -> 800x400px (approx 254 DPI)
      const dataUrl = await exportSvgToPng(svgString, 800, 400);

      const link = document.createElement('a');
      link.download = `${MODAL_LABELS.downloadPrefix}${catalog.code}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      toast.error(MODAL_LABELS.downloadError);
      console.error('[LabelEngine] Download Error:', err);
    } finally {
      setIsDownloading(false);
    }
  }, [labelData, template, catalog.code]);

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
            className="border border-border rounded-lg overflow-hidden bg-white shadow-sm flex justify-center items-center p-2"
            style={{ width: 'fit-content', margin: '0 auto' }}
          >
            {template.renderHTML && template.renderHTML(labelData)}
          </div>
        </div>
      </div>
    </AdaptiveSheet>
  );
}
