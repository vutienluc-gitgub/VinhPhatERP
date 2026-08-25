import type { PrintTemplateEntity } from '@/domain/print';
import { ActionMenu, Badge, Icon } from '@/shared/components';

import { PRINT_TEMPLATE_LABELS } from './print-templates.constants';

interface PrintTemplateTableProps {
  templates: PrintTemplateEntity[];
  defaultsMap: Record<string, string>;
  onPreview: (template: PrintTemplateEntity) => void;
  onOpenDesigner: (template: PrintTemplateEntity) => void;
  onDuplicate: (template: PrintTemplateEntity) => void;
  onSetDefault: (template: PrintTemplateEntity) => void;
  onToggleArchive: (template: PrintTemplateEntity) => void;
}

export function PrintTemplateTable({
  templates,
  defaultsMap,
  onPreview,
  onOpenDesigner,
  onDuplicate,
  onSetDefault,
  onToggleArchive,
}: PrintTemplateTableProps) {
  const getDocumentTypeText = (docType: string) => {
    switch (docType) {
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
        return docType;
    }
  };

  const renderPrinterBadge = (printerType: string) => {
    switch (printerType) {
      case 'dot_matrix':
        return (
          <Badge variant="purple" icon="Printer" className="text-xs">
            In Kim 3 Liên
          </Badge>
        );
      case 'laser':
        return (
          <Badge variant="info" icon="FileText" className="text-xs">
            Laser / PDF
          </Badge>
        );
      case 'thermal_label':
        return (
          <Badge variant="success" icon="QrCode" className="text-xs">
            Tem Barcode
          </Badge>
        );
      case 'thermal_receipt':
        return (
          <Badge variant="primary" icon="Receipt" className="text-xs">
            In Nhiệt K80
          </Badge>
        );
      default:
        return (
          <Badge variant="gray" className="text-xs">
            {printerType}
          </Badge>
        );
    }
  };

  const renderPaperFormatBadge = (paperFormat: string) => {
    let label = paperFormat;
    if (paperFormat === 'DECAL_CUSTOM') label = 'Decal 75×50';
    else if (paperFormat === 'K80') label = 'Cuộn K80';

    return (
      <Badge variant="gray" className="font-mono text-xs font-bold">
        {label}
      </Badge>
    );
  };

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-default bg-surface shadow-sm">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="border-b border-default bg-surface-secondary text-xs font-bold text-foreground uppercase tracking-wide">
            <th className="py-3.5 px-4">Tên Mẫu In</th>
            <th className="py-3.5 px-4">Loại Chứng Từ</th>
            <th className="py-3.5 px-4">Thiết Bị In & Khổ Giấy</th>
            <th className="py-3.5 px-4">Kích Thước</th>
            <th className="py-3.5 px-4 text-center">Mặc Định</th>
            <th className="py-3.5 px-4 text-center">Trạng Thái</th>
            <th className="py-3.5 px-4 text-right">Thao Tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-default">
          {templates.map((tpl) => {
            const contextKey = `${tpl.documentType}:${tpl.targetPrinterProfile}:${tpl.paperFormat}`;
            const isDefault = defaultsMap[contextKey] === tpl.id;

            return (
              <tr
                key={tpl.id}
                className="hover:bg-surface-secondary/40 transition-colors"
              >
                <td className="py-3.5 px-4">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">
                        {tpl.name}
                      </span>
                      {tpl.isSystem ? (
                        <Badge
                          variant="purple"
                          icon="ShieldCheck"
                          className="text-[10px] py-0.5 px-2"
                        >
                          {PRINT_TEMPLATE_LABELS.SYSTEM_BADGE}
                        </Badge>
                      ) : (
                        <Badge
                          variant="info"
                          icon="PenTool"
                          className="text-[10px] py-0.5 px-2"
                        >
                          {PRINT_TEMPLATE_LABELS.CUSTOM_BADGE}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted font-mono">
                      {tpl.code}
                    </span>
                  </div>
                </td>

                <td className="py-3.5 px-4 text-foreground">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <Icon name="FileText" size={14} className="text-primary" />
                    {getDocumentTypeText(tpl.documentType)}
                  </span>
                </td>

                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    {renderPrinterBadge(tpl.targetPrinterProfile)}
                    {renderPaperFormatBadge(tpl.paperFormat)}
                  </div>
                </td>

                <td className="py-3.5 px-4 font-mono text-xs text-foreground font-medium">
                  {tpl.layout.page.widthMm} × {tpl.layout.page.heightMm} mm
                </td>

                <td className="py-3.5 px-4 text-center">
                  {isDefault ? (
                    <Badge variant="primary" icon="Star">
                      {PRINT_TEMPLATE_LABELS.DEFAULT_BADGE}
                    </Badge>
                  ) : tpl.status === 'active' ? (
                    <Badge
                      variant="gray"
                      icon="Star"
                      onFilter={() => onSetDefault(tpl)}
                      filterTooltip="Nhấn để đặt mẫu này làm mặc định cho thiết bị in tương ứng"
                      className="text-[11px] font-medium"
                    >
                      Đặt Mặc Định
                    </Badge>
                  ) : (
                    <span className="text-muted text-xs">—</span>
                  )}
                </td>

                <td className="py-3.5 px-4 text-center">
                  {tpl.status === 'active' ? (
                    <Badge variant="success" icon="CheckCircle2">
                      {PRINT_TEMPLATE_LABELS.STATUS_ACTIVE}
                    </Badge>
                  ) : tpl.status === 'draft' ? (
                    <Badge variant="warning" icon="FileEdit">
                      {PRINT_TEMPLATE_LABELS.STATUS_DRAFT}
                    </Badge>
                  ) : (
                    <Badge variant="gray" icon="Archive">
                      {PRINT_TEMPLATE_LABELS.STATUS_ARCHIVED}
                    </Badge>
                  )}
                </td>

                <td className="py-3.5 px-4 text-right">
                  <ActionMenu
                    items={[
                      {
                        icon: 'Eye',
                        onClick: () => onPreview(tpl),
                        label: PRINT_TEMPLATE_LABELS.BTN_QUICK_PREVIEW,
                      },
                      {
                        icon: 'PenTool',
                        onClick: () => onOpenDesigner(tpl),
                        label: PRINT_TEMPLATE_LABELS.BTN_OPEN_DESIGNER,
                      },
                      {
                        icon: 'Copy',
                        onClick: () => onDuplicate(tpl),
                        label: PRINT_TEMPLATE_LABELS.BTN_DUPLICATE,
                        separated: true,
                      },
                      ...(!isDefault && tpl.status === 'active'
                        ? [
                            {
                              icon: 'Star' as const,
                              onClick: () => onSetDefault(tpl),
                              label: PRINT_TEMPLATE_LABELS.BTN_SET_DEFAULT,
                            },
                          ]
                        : []),
                      ...(!tpl.isSystem
                        ? [
                            {
                              icon:
                                tpl.status === 'archived'
                                  ? 'RotateCcw'
                                  : 'Archive',
                              onClick: () => onToggleArchive(tpl),
                              label:
                                tpl.status === 'archived'
                                  ? PRINT_TEMPLATE_LABELS.BTN_RESTORE
                                  : PRINT_TEMPLATE_LABELS.BTN_ARCHIVE,
                              danger: tpl.status !== 'archived',
                              separated: true,
                            },
                          ]
                        : []),
                    ]}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
