import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';

import {
  resolvePrintTemplate,
  useRecordPrintJob,
  type DocumentType,
  type PrintTemplateEntity,
} from '@/domain/print';
import type { FabricRollPackingItem } from '@/domain/inventory/packing-list.types';
import {
  usePrintTemplateDefaults,
  usePrintTemplates,
} from '@/features/settings/print-templates/usePrintTemplates';
import { Button, Icon } from '@/shared/components';
import { exportShipmentToPdf } from '@/shared/services/print/shipment';
import {
  printPackingList,
  type PackingListPrintMeta,
} from '@/shared/services/print/packing-list';
import type { ShipmentDocument } from '@/domain/shipments/types';
import { sumBy } from '@/shared/utils/array.util';

import { PrintCanvasPreview } from './PrintCanvasPreview';
import { type PrintItem, DEFAULT_PRINT_ITEMS } from './print-dialog.constants';

export interface BusinessPrintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: DocumentType;
  documentId: string;
  documentData?: Record<string, unknown>;
  shipmentDoc?: ShipmentDocument;
  customTitle?: string;
  /** Rolls to render when documentType === 'packing_list'. */
  packingRolls?: FabricRollPackingItem[];
  packingMeta?: PackingListPrintMeta;
}

export function BusinessPrintDialog({
  isOpen,
  onClose,
  documentType,
  documentId,
  documentData,
  shipmentDoc,
  customTitle,
  packingRolls,
  packingMeta,
}: BusinessPrintDialogProps) {
  const { data: templates = [] } = usePrintTemplates();
  const { data: defaultsMap = {} } = usePrintTemplateDefaults();
  const recordJobMutation = useRecordPrintJob();

  const compatibleTemplates = useMemo(() => {
    return templates.filter(
      (t) => t.documentType === documentType && t.status === 'active',
    );
  }, [templates, documentType]);

  const defaultResolved = useMemo(() => {
    return resolvePrintTemplate({
      documentType,
      templates,
      defaultsMap,
    });
  }, [documentType, templates, defaultsMap]);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [zoomLevel, setZoomLevel] = useState<number>(0.95);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  const currentTemplate: PrintTemplateEntity | null = useMemo(() => {
    if (selectedTemplateId) {
      return (
        templates.find((t) => t.id === selectedTemplateId) || defaultResolved
      );
    }
    return defaultResolved;
  }, [selectedTemplateId, templates, defaultResolved]);

  if (!isOpen || !currentTemplate) return null;

  const page = currentTemplate.layout.page;
  const isDotMatrix = currentTemplate.targetPrinterProfile === 'dot_matrix';
  const isLandscape = currentTemplate.orientation === 'landscape';
  const isCourier =
    currentTemplate.layout.styles?.fontFamily === 'Courier_Mono';
  const isPackingList = documentType === 'packing_list';

  // Extract variables from documentData or shipmentDoc
  const companyName = 'CÔNG TY TNHH DỆT MAY VĨNH PHÁT';
  const docNumber =
    shipmentDoc?.shipment_number ||
    (documentData?.code as string) ||
    documentId ||
    'XK2604-0001';
  const customerName =
    shipmentDoc?.customers?.name ||
    (documentData?.customer_name as string) ||
    'Công ty TNHH May Mặc Thời Trang Á Đông';
  const deliveryAddress =
    shipmentDoc?.delivery_address ||
    (documentData?.delivery_address as string) ||
    '123 Đường Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM';
  const carrierInfo =
    shipmentDoc?.carrier ||
    (documentData?.carrier as string) ||
    'Xe tải Vĩnh Phát (51C-123.45)';

  const items: PrintItem[] =
    shipmentDoc?.shipment_items ||
    (documentData?.items as PrintItem[]) ||
    DEFAULT_PRINT_ITEMS;

  const totalQuantity = sumBy(items, (item) => Number(item.quantity) || 0);

  const handleExecutePrint = async () => {
    setIsPrinting(true);
    try {
      if (isPackingList) {
        printPackingList(packingRolls ?? [], {
          documentNumber: docNumber,
          ...packingMeta,
        });
      } else if (shipmentDoc) {
        const format =
          currentTemplate.paperFormat === 'A5' ? 'A5_DOT_MATRIX' : 'A4';
        await exportShipmentToPdf(shipmentDoc, {
          format,
          companyName,
          showLogo: true,
          showQr: true,
          footerNote:
            'Vui lòng kiểm tra kỹ số lượng và chất lượng vải trước khi rời kho.',
          dotMatrixWidth: `${page.widthMm}mm`,
          dotMatrixHeight: `${page.heightMm}mm`,
          margin: {
            left: `${page.marginLeftMm}mm`,
            right: `${page.marginRightMm}mm`,
          },
        });
      } else {
        window.print();
      }

      // Record Audit Print Job
      await recordJobMutation.mutateAsync({
        documentType,
        documentId,
        templateId: currentTemplate.id,
        outputType:
          currentTemplate.targetPrinterProfile === 'laser' ? 'pdf' : 'browser',
        status: 'completed',
      });

      toast.success('Đã gửi lệnh in chứng từ thành công');
      onClose();
    } catch {
      toast.error('Lỗi khi thực hiện lệnh in');
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-5xl max-h-[90vh] bg-surface rounded-2xl border border-default shadow-2xl flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-default bg-surface-secondary/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Icon name="Printer" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">
                {customTitle || 'In Chứng Từ Nghiệp Vụ'}
              </h3>
              <span className="text-xs text-muted font-mono">
                Số chứng từ:{' '}
                <strong className="text-foreground">{docNumber}</strong> • Loại:{' '}
                {documentType}
              </span>
            </div>
          </div>

          {/* Template Selector & Zoom */}
          <div className="flex items-center gap-3">
            {compatibleTemplates.length > 1 && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted font-medium">Mẫu in:</span>
                <select
                  value={currentTemplate.id}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="field-input text-xs h-8 font-semibold"
                >
                  {compatibleTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.paperFormat} - {t.targetPrinterProfile})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Zoom Toolset */}
            <div className="flex items-center gap-1 bg-surface border border-default rounded-lg p-0.5">
              <button
                type="button"
                onClick={() =>
                  setZoomLevel((z) =>
                    Math.max(0.6, Number((z - 0.1).toFixed(1))),
                  )
                }
                className="w-6 h-6 flex items-center justify-center rounded text-muted hover:text-foreground text-xs font-bold"
              >
                -
              </button>
              <span className="text-xs font-mono font-semibold px-1 text-foreground">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() =>
                  setZoomLevel((z) =>
                    Math.min(1.3, Number((z + 0.1).toFixed(1))),
                  )
                }
                className="w-6 h-6 flex items-center justify-center rounded text-muted hover:text-foreground text-xs font-bold"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-muted hover:text-foreground flex items-center justify-center"
            >
              <Icon name="X" size={18} />
            </button>
          </div>
        </div>

        <PrintCanvasPreview
          page={page}
          zoomLevel={zoomLevel}
          isDotMatrix={isDotMatrix}
          isCourier={isCourier}
          isLandscape={isLandscape}
          templateName={currentTemplate.name}
          companyName={companyName}
          docNumber={docNumber}
          customerName={customerName}
          carrierInfo={carrierInfo}
          deliveryAddress={deliveryAddress}
          items={items}
          totalQuantity={totalQuantity}
          variant={isPackingList ? 'packing_list' : 'shipment'}
          packingRolls={packingRolls}
          packingMeta={packingMeta}
        />

        {/* Modal Footer Actions */}
        <div className="px-6 py-3.5 border-t border-default flex items-center justify-between bg-surface">
          <div className="flex items-center gap-2 text-xs text-muted">
            <Icon name="CheckCircle2" size={14} className="text-success" />
            <span>
              Mẫu in đang áp dụng:{' '}
              <strong className="text-foreground">
                {currentTemplate.name}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isPrinting}
            >
              Đóng
            </Button>
            <Button
              size="sm"
              onClick={handleExecutePrint}
              disabled={isPrinting}
              className="gap-2 font-bold shadow-sm"
            >
              <Icon name="Printer" size={16} />
              {isPrinting ? 'Đang gửi lệnh in...' : 'In Ngay (Print)'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
