import { useState, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';

import {
  resolvePrintTemplate,
  useRecordPrintJob,
  type DocumentType,
  type PrintTemplateEntity,
} from '@/domain/print';
import {
  usePrintTemplateDefaults,
  usePrintTemplates,
} from '@/features/settings/print-templates/usePrintTemplates';
import { Button, Icon } from '@/shared/components';
import { exportShipmentToPdf } from '@/shared/services/print/shipment';
import type { ShipmentDocument } from '@/domain/shipments/types';

export interface BusinessPrintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: DocumentType;
  documentId: string;
  documentData?: Record<string, unknown>;
  shipmentDoc?: ShipmentDocument;
  customTitle?: string;
}

export function BusinessPrintDialog({
  isOpen,
  onClose,
  documentType,
  documentId,
  documentData,
  shipmentDoc,
  customTitle,
}: BusinessPrintDialogProps) {
  const { data: templates = [] } = usePrintTemplates();
  const { data: defaultsMap = {} } = usePrintTemplateDefaults();
  const recordJobMutation = useRecordPrintJob();

  // Find compatible templates
  const compatibleTemplates = useMemo(() => {
    return templates.filter(
      (t) => t.documentType === documentType && t.status === 'active',
    );
  }, [templates, documentType]);

  // Initial resolved template
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

  const items = shipmentDoc?.shipment_items ||
    (documentData?.items as Array<{
      roll_number: string;
      fabric_type: string;
      color_name: string;
      quantity: number;
    }>) || [
      {
        roll_number: 'C01',
        fabric_type: 'Vải Cotton 100% 2 chiều 230gsm',
        color_name: 'Trắng Sứ (W-01)',
        quantity: 120.5,
      },
      {
        roll_number: 'C02',
        fabric_type: 'Vải Cotton 100% 2 chiều 230gsm',
        color_name: 'Trắng Sứ (W-01)',
        quantity: 118.0,
      },
      {
        roll_number: 'C03',
        fabric_type: 'Vải CVC 65/35 Cá Sấu 4 chiều',
        color_name: 'Xanh Navy (NV-09)',
        quantity: 145.2,
      },
    ];

  const totalQuantity = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0,
  );

  const handleExecutePrint = async () => {
    setIsPrinting(true);
    try {
      if (shipmentDoc) {
        const format =
          currentTemplate.paperFormat === 'A5' ? 'A5_DOT_MATRIX' : 'A4';
        await exportShipmentToPdf(shipmentDoc, {
          format,
          companyName,
          logoUrl: '/favicon.svg',
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

        {/* Paper Canvas Viewport */}
        <div className="flex-1 overflow-auto p-8 bg-surface-secondary/70 flex items-center justify-center min-h-[440px]">
          <div
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top center',
              width: `${page.widthMm * 3.78}px`,
              minHeight: `${page.heightMm * 3.78}px`,
              paddingTop: `${page.marginTopMm * 3.78}px`,
              paddingBottom: `${page.marginBottomMm * 3.78}px`,
              paddingLeft: `${(page.marginLeftMm + (isDotMatrix ? 8 : 0)) * 3.78}px`,
              paddingRight: `${(page.marginRightMm + (isDotMatrix ? 8 : 0)) * 3.78}px`,
              fontFamily: isCourier
                ? 'Courier, monospace'
                : 'Inter, sans-serif',
            }}
            className={`relative bg-surface text-foreground rounded shadow-2xl border border-default p-6 flex flex-col justify-between select-none ${
              isLandscape ? 'aspect-[200/148]' : ''
            }`}
          >
            {/* Dot-matrix Tractor Holes */}
            {isDotMatrix && (
              <>
                <div className="absolute left-2 top-3 bottom-3 flex flex-col justify-between items-center w-2 pointer-events-none opacity-30">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <span
                      key={i}
                      className="w-2.5 h-2.5 rounded-full border border-foreground/50 bg-surface-secondary"
                    />
                  ))}
                </div>
                <div className="absolute right-2 top-3 bottom-3 flex flex-col justify-between items-center w-2 pointer-events-none opacity-30">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <span
                      key={i}
                      className="w-2.5 h-2.5 rounded-full border border-foreground/50 bg-surface-secondary"
                    />
                  ))}
                </div>
              </>
            )}

            {/* Document Content */}
            <div className="flex flex-col gap-3">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-default pb-3">
                <div className="flex flex-col">
                  <span className="font-extrabold text-sm uppercase tracking-wide">
                    {companyName}
                  </span>
                  <span className="text-[11px] text-muted">
                    Lô 12 Đường Số 3, KCN Tân Bình, P. Tây Thạnh, TP.HCM
                  </span>
                  <span className="text-[11px] text-muted">
                    MST: 0314567890 • Hotline: 028 3815 1234
                  </span>
                </div>
                <QRCodeSVG value={docNumber} size={42} />
              </div>

              {/* Title */}
              <div className="text-center py-1">
                <h2 className="text-base font-extrabold uppercase tracking-wider">
                  {currentTemplate.name}
                </h2>
                <span className="text-xs font-mono text-muted">
                  Số: {docNumber} • Ngày: 02/04/2026
                </span>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs py-2 bg-surface-secondary/40 rounded p-2.5 border border-default">
                <div>
                  <span className="text-muted">Khách hàng: </span>
                  <strong className="text-foreground">{customerName}</strong>
                </div>
                <div>
                  <span className="text-muted">Vận chuyển: </span>
                  <span className="text-foreground">{carrierInfo}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted">Địa chỉ giao: </span>
                  <span className="text-foreground">{deliveryAddress}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-default rounded overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface-secondary/80 text-[11px] font-bold border-b border-default text-muted uppercase">
                    <tr>
                      <th className="py-1.5 px-2 text-center w-8">STT</th>
                      <th className="py-1.5 px-2 text-center w-16">Mã Cây</th>
                      <th className="py-1.5 px-2">Tên Hàng / Quy Cách</th>
                      <th className="py-1.5 px-2">Màu Sắc</th>
                      <th className="py-1.5 px-2 text-right">Số Lượng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-default">
                    {items.map((item, i) => (
                      <tr key={i}>
                        <td className="py-1.5 px-2 text-center font-mono">
                          {i + 1}
                        </td>
                        <td className="py-1.5 px-2 text-center font-mono font-bold">
                          {item.roll_number || `C0${i + 1}`}
                        </td>
                        <td className="py-1.5 px-2 font-medium">
                          {item.fabric_type || 'Vải Cotton 100%'}
                        </td>
                        <td className="py-1.5 px-2">
                          {item.color_name || 'Trắng Sứ'}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono font-bold">
                          {item.quantity} m
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-surface-secondary/40 font-bold border-t border-default">
                      <td colSpan={4} className="py-1.5 px-2 text-right">
                        Tổng cộng:
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono text-primary">
                        {totalQuantity.toFixed(1)} m ({items.length} cây)
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-2 pt-6 text-center text-xs">
                <div>
                  <span className="font-bold block">Người Lập Phiếu</span>
                  <span className="text-[10px] text-muted">(Ký tên)</span>
                </div>
                <div>
                  <span className="font-bold block">Thủ Kho Xuất</span>
                  <span className="text-[10px] text-muted">(Ký tên)</span>
                </div>
                <div>
                  <span className="font-bold block">Khách Hàng Nhận</span>
                  <span className="text-[10px] text-muted">(Ký tên)</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-[10px] text-muted text-center pt-3 border-t border-default/60 mt-4">
              * Quý khách vui lòng kiểm tra kỹ số lượng và quy cách trước khi
              nhận hàng.
            </div>
          </div>
        </div>

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
