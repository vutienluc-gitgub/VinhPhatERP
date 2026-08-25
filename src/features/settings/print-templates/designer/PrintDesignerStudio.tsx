import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

import type {
  PrintLayout,
  PrintTemplateEntity,
  TemplateBlock,
} from '@/domain/print';
import { Button, Icon } from '@/shared/components';
import { exportShipmentToPdf } from '@/shared/services/print/shipment';
import type { ShipmentDocument } from '@/domain/shipments/types';
import { PRINT_TEMPLATE_MESSAGES } from '@/features/settings/print-templates/print-templates.constants';

import { CanvasRuler } from './CanvasRuler';
import { BlockPalette } from './BlockPalette';
import { PaperCanvas } from './PaperCanvas';
import { PropertyInspector } from './inspectors/PropertyInspector';

const DESIGNER_PREVIEW_FIXTURE: ShipmentDocument = {
  id: 'fixture-designer-preview',
  shipment_number: 'XK2604-0001',
  order_id: 'order-1',
  customer_id: 'customer-1',
  shipment_date: '2026-04-02',
  delivery_address: '123 Đường Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM',
  carrier: 'Xe tải Vĩnh Phát (51C-123.45)',
  tracking_number: null,
  status: 'shipped',
  notes: 'Giao trong giờ hành chính. Liên hệ trước khi đến 15 phút.',
  created_by: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  last_chat_at: null,
  delivery_staff_id: null,
  shipping_rate_id: null,
  shipping_cost: 0,
  loading_fee: 0,
  total_weight_kg: null,
  total_meters: null,
  vehicle_info: null,
  prepared_at: null,
  shipped_at: null,
  delivered_at: null,
  delivery_proof: null,
  receiver_name: 'Trần Văn B',
  receiver_phone: '0909 888 999',
  employee_id: null,
  tenant_id: null,
  journey_status: null,
  signed_at: null,
  customer_signature_url: null,
  proof_photos: null,
  orders: { order_number: 'DH2604-0012' },
  customers: {
    name: 'Công ty TNHH May Mặc Thời Trang Á Đông',
    code: 'KH-ADONG-01',
    address: '456 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM',
    phone: '0909 123 456',
    contact_person: 'Nguyễn Thị Thu',
  },
  shipment_items: [
    {
      id: 'item-1',
      shipment_id: 'fixture-designer-preview',
      finished_roll_id: 'roll-101',
      fabric_type: 'Vải Cotton 100% 2 chiều 230gsm',
      color_name: 'Trắng Sứ (W-01)',
      quantity: 120.5,
      unit: 'm',
      roll_number: 'C01',
      roll_length_m: null,
      warehouse_location: null,
      notes: 'Đạt chuẩn kiểm kim',
      price_per_meter: null,
      sort_order: 1,
      tenant_id: null,
      total_amount: null,
    },
    {
      id: 'item-2',
      shipment_id: 'fixture-designer-preview',
      finished_roll_id: 'roll-102',
      fabric_type: 'Vải Cotton 100% 2 chiều 230gsm',
      color_name: 'Trắng Sứ (W-01)',
      quantity: 118.0,
      unit: 'm',
      roll_number: 'C02',
      roll_length_m: null,
      warehouse_location: null,
      notes: null,
      price_per_meter: null,
      sort_order: 2,
      tenant_id: null,
      total_amount: null,
    },
    {
      id: 'item-3',
      shipment_id: 'fixture-designer-preview',
      finished_roll_id: 'roll-103',
      fabric_type: 'Vải CVC 65/35 Cá Sấu 4 chiều',
      color_name: 'Xanh Navy (NV-09)',
      quantity: 145.2,
      unit: 'm',
      roll_number: 'C03',
      roll_length_m: null,
      warehouse_location: null,
      notes: null,
      price_per_meter: null,
      sort_order: 3,
      tenant_id: null,
      total_amount: null,
    },
  ],
};

interface PrintDesignerStudioProps {
  initialTemplate: PrintTemplateEntity;
  onBack: () => void;
  onSave: (template: PrintTemplateEntity) => Promise<void>;
}

export function PrintDesignerStudio({
  initialTemplate,
  onBack,
  onSave,
}: PrintDesignerStudioProps) {
  const [template, setTemplate] =
    useState<PrintTemplateEntity>(initialTemplate);
  const [layout, setLayout] = useState<PrintLayout>(initialTemplate.layout);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(0.9);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleUpdateLayout = useCallback((newLayout: PrintLayout) => {
    setLayout(newLayout);
    setIsDirty(true);
  }, []);

  const handleUpdateTemplate = useCallback(
    (updates: Partial<PrintTemplateEntity>) => {
      setTemplate((prev) => ({ ...prev, ...updates }));
      setIsDirty(true);
    },
    [],
  );

  const handleToggleBlock = (blockId: string) => {
    const nextBlocks = layout.blocks.map((b) =>
      b.id === blockId ? { ...b, enabled: !b.enabled } : b,
    );
    handleUpdateLayout({ ...layout, blocks: nextBlocks });
  };

  const handleMoveBlock = (blockId: string, direction: 'up' | 'down') => {
    const sorted = [...layout.blocks].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((b) => b.id === blockId);
    if (index < 0) return;

    const currentItem = sorted[index];
    if (!currentItem) return;

    if (direction === 'up' && index > 0) {
      const prevItem = sorted[index - 1];
      if (prevItem) {
        const prevOrder = prevItem.order;
        prevItem.order = currentItem.order;
        currentItem.order = prevOrder;
      }
    } else if (direction === 'down' && index < sorted.length - 1) {
      const nextItem = sorted[index + 1];
      if (nextItem) {
        const nextOrder = nextItem.order;
        nextItem.order = currentItem.order;
        currentItem.order = nextOrder;
      }
    }

    handleUpdateLayout({ ...layout, blocks: sorted });
  };

  const handleAddBlock = (type: TemplateBlock['type']) => {
    const maxOrder = Math.max(0, ...layout.blocks.map((b) => b.order));
    const newId = `b_${type}_${Date.now().toString(36).slice(2, 6)}`;

    let newBlock: TemplateBlock;
    if (type === 'text') {
      newBlock = {
        id: newId,
        type: 'text',
        order: maxOrder + 1,
        enabled: true,
        content: 'Đoạn văn bản mới',
        fontSizePt: 10,
        fontWeight: 'normal',
        align: 'left',
      };
    } else if (type === 'table') {
      newBlock = {
        id: newId,
        type: 'table',
        order: maxOrder + 1,
        enabled: true,
        collectionBinding: 'shipment.items',
        showTotalRow: true,
        borderStyle: 'solid',
        rowHeightMm: 7,
        columns: [
          {
            key: 'stt',
            label: 'STT',
            widthPercent: 10,
            align: 'center',
            fieldBinding: 'index',
          },
          {
            key: 'item',
            label: 'Mặt Hàng',
            widthPercent: 60,
            align: 'left',
            fieldBinding: 'name',
          },
          {
            key: 'qty',
            label: 'Số Lượng',
            widthPercent: 30,
            align: 'right',
            fieldBinding: 'qty',
          },
        ],
      };
    } else if (type === 'qr') {
      newBlock = {
        id: newId,
        type: 'qr',
        order: maxOrder + 1,
        enabled: true,
        valueBinding: 'shipment.code',
        sizeMm: 20,
      };
    } else if (type === 'signature') {
      newBlock = {
        id: newId,
        type: 'signature',
        order: maxOrder + 1,
        enabled: true,
        slots: [{ title: 'Người Lập Phiếu' }, { title: 'Khách Hàng Nhận' }],
      };
    } else if (type === 'image') {
      newBlock = {
        id: newId,
        type: 'image',
        order: maxOrder + 1,
        enabled: true,
        fallbackUrl: '/favicon.svg',
        fit: 'contain',
      };
    } else {
      newBlock = {
        id: newId,
        type: 'line',
        order: maxOrder + 1,
        enabled: true,
        orientation: 'horizontal',
        style: 'solid',
        thicknessMm: 0.5,
      };
    }

    handleUpdateLayout({
      ...layout,
      blocks: [...layout.blocks, newBlock],
    });
    setSelectedBlockId(newId);
  };

  const handleDeleteBlock = (blockId: string) => {
    handleUpdateLayout({
      ...layout,
      blocks: layout.blocks.filter((b) => b.id !== blockId),
    });
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  };

  const handleTestPrint = () => {
    const page = layout.page;
    const format = template.paperFormat === 'A5' ? 'A5_DOT_MATRIX' : 'A4';
    void exportShipmentToPdf(DESIGNER_PREVIEW_FIXTURE, {
      format,
      companyName: 'CÔNG TY TNHH DỆT MAY VĨNH PHÁT',
      logoUrl: '/favicon.svg',
      showLogo: true,
      showQr: true,
      footerNote: 'Bản in thử nghiệm từ Visual Designer Studio.',
      dotMatrixWidth: `${page.widthMm}mm`,
      dotMatrixHeight: `${page.heightMm}mm`,
      margin: {
        left: `${page.marginLeftMm}mm`,
        right: `${page.marginRightMm}mm`,
      },
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        ...template,
        layout,
      });
      setIsDirty(false);
      toast.success(PRINT_TEMPLATE_MESSAGES.UPDATE_SUCCESS);
    } catch {
      toast.error('Lỗi khi lưu thiết kế mẫu in');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-surface text-foreground flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* Studio Header Bar */}
      <div className="h-14 px-4 border-b border-default bg-surface-secondary/70 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onBack}
            className="text-xs font-semibold gap-1.5 h-8"
          >
            <Icon name="ArrowLeft" size={14} />
            Quay lại Thư Viện
          </Button>

          <div className="h-5 w-[1px] bg-default" />

          <div className="flex items-center gap-2">
            <h2 className="font-bold text-sm text-foreground">
              {template.name}
            </h2>
            <span className="text-[11px] font-mono text-muted bg-surface px-1.5 py-0.5 rounded border border-default">
              {template.code} • rev.{template.revision}
            </span>
            {isDirty && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-warning-soft text-warning border border-warning/30">
                Chưa Lưu
              </span>
            )}
          </div>
        </div>

        {/* Header Right Action Tools */}
        <div className="flex items-center gap-3">
          {/* Zoom Controller */}
          <div className="flex items-center gap-1 bg-surface border border-default rounded-lg p-0.5">
            <button
              type="button"
              onClick={() =>
                setZoomLevel((z) => Math.max(0.6, Number((z - 0.1).toFixed(1))))
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
                setZoomLevel((z) => Math.min(1.4, Number((z + 0.1).toFixed(1))))
              }
              className="w-6 h-6 flex items-center justify-center rounded text-muted hover:text-foreground text-xs font-bold"
            >
              +
            </button>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTestPrint}
            className="text-xs font-semibold gap-1.5 h-8"
          >
            <Icon name="Printer" size={14} />
            In Thử PDF
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="text-xs font-bold gap-1.5 h-8 shadow-sm"
          >
            <Icon name="Check" size={14} />
            {isSaving ? 'Đang lưu...' : 'Lưu Bản Thiết Kế'}
          </Button>
        </div>
      </div>

      {/* 3-Column Studio Workspace */}
      <div className="flex-1 grid grid-cols-[280px_1fr_320px] overflow-hidden">
        {/* Left Column: Block Palette */}
        <BlockPalette
          blocks={layout.blocks}
          selectedBlockId={selectedBlockId}
          onSelectBlock={(id) => setSelectedBlockId(id)}
          onToggleBlock={handleToggleBlock}
          onMoveBlock={handleMoveBlock}
          onAddBlock={handleAddBlock}
          onDeleteBlock={handleDeleteBlock}
        />

        {/* Center Column: Interactive WYSIWYG Canvas with mm Rulers */}
        <div className="relative flex-1 bg-surface-secondary/50 overflow-auto flex flex-col">
          <CanvasRuler
            widthMm={layout.page.widthMm}
            heightMm={layout.page.heightMm}
            zoomLevel={zoomLevel}
          />
          <div className="mt-6 ml-8 flex-1 overflow-auto">
            <PaperCanvas
              template={template}
              layout={layout}
              selectedBlockId={selectedBlockId}
              zoomLevel={zoomLevel}
              onSelectBlock={(id) => setSelectedBlockId(id)}
            />
          </div>
        </div>

        {/* Right Column: Property Inspector */}
        <PropertyInspector
          template={template}
          layout={layout}
          selectedBlockId={selectedBlockId}
          documentType={template.documentType}
          onUpdateLayout={handleUpdateLayout}
          onUpdateTemplate={handleUpdateTemplate}
        />
      </div>
    </div>
  );
}
