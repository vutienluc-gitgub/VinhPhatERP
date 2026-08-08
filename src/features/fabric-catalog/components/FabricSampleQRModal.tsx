import { useRef, useState, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';

import { Button } from '@/shared/components';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { PUBLIC_COMPONENT_LABELS as COMP_LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';
import { openPrintWindow } from '@/shared/lib/print-template.engine';
import type { FabricCatalog } from '@/features/fabric-catalog/types';
import { mapCatalogToFabricLabel } from '@/features/fabric-catalog/label/mapper';
import {
  LabelRegistry,
  LabelEngine,
  exportSvgToPng,
  computeLayout,
  HtmlRenderer,
} from '@/shared/lib/label-engine';

const MODAL_LABELS = {
  title: COMP_LABELS.QR_MODAL_TITLE,
  print: 'In Tem (Print CSS)',
  download: COMP_LABELS.QR_MODAL_DOWNLOAD,
  downloadZpl: 'Tải ZPL',
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

  // 2. Fetch Template and Layout
  const template = LabelRegistry.get('fabric-80x40');
  const layoutTree = useMemo(
    () => template.buildLayout(labelData),
    [template, labelData],
  );
  const absoluteNodes = useMemo(
    () => computeLayout(layoutTree, 0, 0, template.widthPx, template.heightPx),
    [layoutTree, template],
  );

  const handlePrint = async () => {
    try {
      const svgString = await LabelEngine.exportSVG('fabric-80x40', labelData);
      const tempDiv = document.createElement('div');
      tempDiv.className = 'ast-label-wrapper';
      tempDiv.innerHTML = svgString;

      // Define page size dynamically based on template config if needed, but we hardcoded it in AST_LABEL_CSS
      openPrintWindow(tempDiv, {
        title: `${MODAL_LABELS.printTitlePrefix}${catalog.code}`,
        css: `
          @page { size: ${template.widthMm}mm ${template.heightMm}mm; margin: 0; }
          html, body { 
            margin: 0; padding: 0; overflow: hidden; background: #ffffff; 
            display: flex; justify-content: center; align-items: center; 
            width: ${template.widthMm}mm; height: ${template.heightMm}mm;
          }
          .ast-label-wrapper { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
          .ast-label-wrapper svg { width: 100% !important; height: 100% !important; object-fit: contain; }
        `,
      });
    } catch (err) {
      toast.error('Lỗi khi mở giao diện in');
      console.error('[LabelEngine] Print Error:', err);
    }
  };

  const handleDownloadPng = useCallback(async () => {
    try {
      setIsDownloading(true);
      // 3. Render purely to SVG string via Engine
      const svgString = await LabelEngine.exportSVG('fabric-80x40', labelData);

      // 4. Export SVG to PNG independently of DOM
      const dataUrl = await exportSvgToPng(
        svgString,
        template.widthPx,
        template.heightPx,
      );

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
  }, [labelData, catalog.code, template]);

  const handleDownloadZpl = useCallback(() => {
    try {
      const zplString = LabelEngine.exportZPL('fabric-80x40', labelData);
      const blob = new Blob([zplString], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.download = `${MODAL_LABELS.downloadPrefix}${catalog.code}.zpl`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Lỗi khi xuất ZPL');
      console.error('[LabelEngine] ZPL Error:', err);
    }
  }, [labelData, catalog.code]);

  return (
    <AdaptiveSheet
      open={true}
      onClose={onClose}
      title={`${MODAL_LABELS.title} — ${catalog.code}`}
      maxWidth={450}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            {MODAL_LABELS.close}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={handleDownloadZpl}
              leftIcon="FileText"
            >
              {MODAL_LABELS.downloadZpl}
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={handleDownloadPng}
              leftIcon="Download"
              isLoading={isDownloading}
            >
              PNG
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
            className="border border-border rounded-lg overflow-hidden bg-surface shadow-sm flex justify-center items-center p-2"
            style={{ width: 'fit-content', margin: '0 auto' }}
          >
            {/* Scale down the 800x400 AST view for UI preview */}
            <div
              style={{
                transform: 'scale(0.45)',
                transformOrigin: 'top left',
                width: template.widthPx * 0.45,
                height: template.heightPx * 0.45,
              }}
            >
              <HtmlRenderer
                nodes={absoluteNodes}
                widthPx={template.widthPx}
                heightPx={template.heightPx}
              />
            </div>
          </div>
        </div>
      </div>
    </AdaptiveSheet>
  );
}
