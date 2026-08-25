import type { PrintTemplateEntity } from '@/domain/print';
import { ActionMenu, Badge, Icon } from '@/shared/components';

import { PRINT_TEMPLATE_LABELS } from './print-templates.constants';

interface PrintTemplateCardProps {
  template: PrintTemplateEntity;
  isDefault: boolean;
  onPreview: (template: PrintTemplateEntity) => void;
  onOpenDesigner: (template: PrintTemplateEntity) => void;
  onDuplicate: (template: PrintTemplateEntity) => void;
  onSetDefault: (template: PrintTemplateEntity) => void;
  onToggleArchive: (template: PrintTemplateEntity) => void;
}

export function PrintTemplateCard({
  template,
  isDefault,
  onPreview,
  onOpenDesigner,
  onDuplicate,
  onSetDefault,
  onToggleArchive,
}: PrintTemplateCardProps) {
  const isDotMatrix = template.targetPrinterProfile === 'dot_matrix';
  const isThermal =
    template.targetPrinterProfile === 'thermal_receipt' ||
    template.targetPrinterProfile === 'thermal_label';
  const isLandscape = template.orientation === 'landscape';

  const renderPrinterBadge = () => {
    switch (template.targetPrinterProfile) {
      case 'dot_matrix':
        return (
          <Badge
            variant="purple"
            icon="Printer"
            className="text-[11px] py-0.5 px-2 font-medium"
          >
            In Kim (3 liên)
          </Badge>
        );
      case 'laser':
        return (
          <Badge
            variant="info"
            icon="FileText"
            className="text-[11px] py-0.5 px-2 font-medium"
          >
            Laser / PDF
          </Badge>
        );
      case 'thermal_label':
        return (
          <Badge
            variant="success"
            icon="QrCode"
            className="text-[11px] py-0.5 px-2 font-medium"
          >
            Tem Barcode
          </Badge>
        );
      case 'thermal_receipt':
        return (
          <Badge
            variant="primary"
            icon="Receipt"
            className="text-[11px] py-0.5 px-2 font-medium"
          >
            In Nhiệt K80
          </Badge>
        );
      default:
        return (
          <Badge variant="gray" className="text-[11px] py-0.5 px-2 font-medium">
            {template.targetPrinterProfile}
          </Badge>
        );
    }
  };

  const getDocumentTypeText = () => {
    switch (template.documentType) {
      case 'shipment_delivery':
        return 'Phiếu Xuất Kho';
      case 'inventory_receipt':
        return 'Phiếu Nhập Kho';
      case 'production_order':
        return 'Lệnh Sản Xuất';
      case 'roll_tag':
        return 'Tem Cây Vải';
      case 'sales_statement':
        return 'Bảng Kê Giao Hàng';
      case 'payment_receipt':
        return 'Phiếu Thu Tiền';
      case 'fabric_inspection':
        return 'Kiểm Tra Vải KCS';
      default:
        return template.documentType;
    }
  };

  const getPaperFormatBadgeText = () => {
    switch (template.paperFormat) {
      case 'DECAL_CUSTOM':
        return 'Decal 75×50';
      case 'K80':
        return 'Cuộn K80';
      default:
        return template.paperFormat;
    }
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 flex flex-col bg-surface overflow-hidden hover:-translate-y-1 hover:shadow-lg ${
        template.status === 'archived'
          ? 'opacity-60 border-default bg-surface-secondary/50'
          : isDefault
            ? 'border-primary/50 shadow-sm ring-1 ring-primary/20'
            : 'border-default hover:border-primary/40'
      }`}
    >
      {/* 1. Card Top Header Status Bar */}
      <div className="px-3.5 py-2 bg-surface-secondary/40 border-b border-default/70 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {isDefault && (
            <Badge
              variant="primary"
              icon="Star"
              className="text-[10px] py-0.5 px-2 shadow-xs"
            >
              {PRINT_TEMPLATE_LABELS.DEFAULT_BADGE}
            </Badge>
          )}
          {template.isSystem ? (
            <Badge
              variant="purple"
              icon="ShieldCheck"
              className="text-[10px] py-0.5 px-2 shadow-xs"
            >
              {PRINT_TEMPLATE_LABELS.SYSTEM_BADGE}
            </Badge>
          ) : (
            <Badge
              variant="info"
              icon="PenTool"
              className="text-[10px] py-0.5 px-2 shadow-xs"
            >
              {PRINT_TEMPLATE_LABELS.CUSTOM_BADGE}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Badge
            variant="gray"
            className="font-mono text-[10px] font-bold shadow-xs"
          >
            {getPaperFormatBadgeText()}
          </Badge>
          <ActionMenu
            items={[
              {
                icon: 'Eye',
                onClick: () => onPreview(template),
                label: 'Xem trước bản in',
              },
              {
                icon: 'PenTool',
                onClick: () => onOpenDesigner(template),
                label: 'Chỉnh sửa Designer',
              },
              {
                icon: 'Copy',
                onClick: () => onDuplicate(template),
                label: PRINT_TEMPLATE_LABELS.BTN_DUPLICATE,
                separated: true,
              },
              ...(!isDefault && template.status === 'active'
                ? [
                    {
                      icon: 'Star' as const,
                      onClick: () => onSetDefault(template),
                      label: PRINT_TEMPLATE_LABELS.BTN_SET_DEFAULT,
                    },
                  ]
                : []),
              ...(!template.isSystem
                ? [
                    {
                      icon:
                        template.status === 'archived'
                          ? 'RotateCcw'
                          : 'Archive',
                      onClick: () => onToggleArchive(template),
                      label:
                        template.status === 'archived'
                          ? PRINT_TEMPLATE_LABELS.BTN_RESTORE
                          : PRINT_TEMPLATE_LABELS.BTN_ARCHIVE,
                      danger: template.status !== 'archived',
                      separated: true,
                    },
                  ]
                : []),
            ]}
          />
        </div>
      </div>

      {/* 2. Mockup Canvas Preview */}
      <div
        className={`relative p-4 flex items-center justify-center bg-surface-secondary/20 border-b border-default cursor-pointer group ${
          isLandscape ? 'h-36' : 'h-44'
        }`}
        onClick={() => onPreview(template)}
      >
        {/* Mockup Paper Sheet */}
        <div
          className={`relative bg-surface rounded-md shadow-md border border-default/80 p-2.5 flex flex-col justify-between transition-transform duration-200 group-hover:scale-105 ${
            isLandscape ? 'w-52 h-28' : isThermal ? 'w-28 h-36' : 'w-36 h-40'
          }`}
        >
          {/* Tractor feed holes for dot-matrix */}
          {isDotMatrix && (
            <>
              <div className="absolute left-1 top-1 bottom-1 flex flex-col justify-between items-center w-1 pointer-events-none opacity-50">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/40" />
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/40" />
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/40" />
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/40" />
              </div>
              <div className="absolute right-1 top-1 bottom-1 flex flex-col justify-between items-center w-1 pointer-events-none opacity-50">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/40" />
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/40" />
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/40" />
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/40" />
              </div>
            </>
          )}

          {/* Mini Mockup Header */}
          <div className="flex items-start justify-between border-b border-default/40 pb-1 px-1">
            <div className="flex flex-col gap-0.5">
              <div className="h-1.5 w-16 bg-primary/60 rounded-full" />
              <div className="h-1 w-10 bg-muted/40 rounded-full" />
            </div>
            <div className="w-3.5 h-3.5 rounded bg-muted/20 border border-muted/30 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-foreground/30 rounded-xs" />
            </div>
          </div>

          {/* Mini Mockup Table Grid */}
          <div className="flex flex-col gap-1 px-1 my-auto">
            <div className="h-1.5 w-20 mx-auto bg-foreground/50 rounded-full my-0.5" />
            <div className="w-full bg-surface-secondary/70 rounded p-1 flex flex-col gap-1 border border-default/30">
              <div className="flex justify-between gap-1">
                <div className="h-1 w-4 bg-primary/40 rounded-full" />
                <div className="h-1 w-8 bg-muted/40 rounded-full" />
                <div className="h-1 w-6 bg-muted/40 rounded-full" />
              </div>
              <div className="flex justify-between gap-1">
                <div className="h-1 w-4 bg-muted/30 rounded-full" />
                <div className="h-1 w-8 bg-muted/30 rounded-full" />
                <div className="h-1 w-6 bg-muted/30 rounded-full" />
              </div>
            </div>
          </div>

          {/* Mini Mockup Footer Signatures */}
          <div className="flex items-center justify-between px-1 pt-1 border-t border-default/40 text-[6px] text-muted">
            <div className="h-1 w-6 bg-muted/40 rounded-full" />
            <div className="h-1 w-6 bg-muted/40 rounded-full" />
          </div>
        </div>

        {/* Hover Eye Overlay */}
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="px-3 py-1 rounded-full bg-surface/90 text-primary text-xs font-semibold shadow-sm border border-primary/20 flex items-center gap-1.5">
            <Icon name="Eye" size={14} />
            Xem Trước
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-bold text-sm text-foreground line-clamp-1">
              {template.name}
            </h4>
          </div>
          <p className="text-xs text-muted line-clamp-2">
            {template.description || 'Chưa có mô tả cho mẫu in này.'}
          </p>
        </div>

        {/* Metadata Badges */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-default/60">
          <Badge
            variant="gray"
            icon="FileText"
            className="text-[11px] py-0.5 px-2 font-semibold text-foreground"
          >
            {getDocumentTypeText()}
          </Badge>
          {renderPrinterBadge()}
          <Badge
            variant="gray"
            className="font-mono text-[11px] py-0.5 px-2 font-bold text-foreground"
          >
            {template.layout.page.widthMm}×{template.layout.page.heightMm}mm
          </Badge>
        </div>
      </div>
    </div>
  );
}
