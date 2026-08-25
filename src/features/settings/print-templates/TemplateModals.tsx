import { useState } from 'react';

import type {
  DocumentType,
  PaperFormat,
  PrinterProfileType,
  PrintTemplateEntity,
} from '@/domain/print';
import { Button, Icon } from '@/shared/components';

import { PRINT_TEMPLATE_LABELS } from './print-templates.constants';

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: Omit<
      PrintTemplateEntity,
      'id' | 'createdAt' | 'updatedAt' | 'revision'
    >,
  ) => Promise<void>;
}

export function CreateTemplateModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateTemplateModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [docType, setDocType] = useState<DocumentType>('shipment_delivery');
  const [printerType, setPrinterType] =
    useState<PrinterProfileType>('dot_matrix');
  const [format, setFormat] = useState<PaperFormat>('A5');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim() || null,
        artifactType: docType === 'roll_tag' ? 'label' : 'document',
        documentType: docType,
        targetPrinterProfile: printerType,
        paperFormat: format,
        orientation: format === 'A5' ? 'landscape' : 'portrait',
        status: 'active',
        isSystem: false,
        layout: {
          schemaVersion: 1,
          coordinateSystem: 'mm',
          page: {
            widthMm: format === 'A4' ? 210 : format === 'A5' ? 200 : 80,
            heightMm: format === 'A4' ? 297 : format === 'A5' ? 148 : 60,
            marginTopMm: 5,
            marginBottomMm: 5,
            marginLeftMm: 5,
            marginRightMm: 5,
          },
          blocks: [
            {
              id: 'b-title',
              order: 1,
              enabled: true,
              type: 'text',
              content: name.trim().toUpperCase(),
              fontSizePt: 14,
              fontWeight: 'bold',
              align: 'center',
            },
          ],
        },
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-surface rounded-2xl border border-default shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-default flex items-center justify-between bg-surface-secondary/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Icon name="Plus" size={16} />
            </div>
            <h3 className="font-bold text-base text-foreground">
              {PRINT_TEMPLATE_LABELS.MODAL_CREATE_TITLE}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-muted hover:text-foreground flex items-center justify-center"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">
              {PRINT_TEMPLATE_LABELS.FIELD_TEMPLATE_NAME} *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Phiếu Xuất Kho Chi Nhánh 2"
              className="field-input text-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">
              {PRINT_TEMPLATE_LABELS.FIELD_TEMPLATE_CODE} *
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="XK_CN2_A5"
              className="field-input text-sm font-mono uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">
                {PRINT_TEMPLATE_LABELS.FIELD_DOC_TYPE}
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as DocumentType)}
                className="field-input text-sm"
              >
                <option value="shipment_delivery">Phiếu Xuất Kho</option>
                <option value="inventory_receipt">Phiếu Nhập Kho</option>
                <option value="production_order">Lệnh Sản Xuất</option>
                <option value="roll_tag">Tem Cây Vải</option>
                <option value="sales_statement">Bảng Kê Giao Hàng</option>
                <option value="payment_receipt">Phiếu Thu Tiền</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">
                {PRINT_TEMPLATE_LABELS.FIELD_PRINTER_TYPE}
              </label>
              <select
                value={printerType}
                onChange={(e) => {
                  const pType = e.target.value as PrinterProfileType;
                  setPrinterType(pType);
                  if (pType === 'dot_matrix') setFormat('A5');
                  else if (pType === 'laser') setFormat('A4');
                  else setFormat('K80');
                }}
                className="field-input text-sm"
              >
                <option value="dot_matrix">In Kim (3 liên)</option>
                <option value="laser">Laser / PDF</option>
                <option value="thermal_receipt">In Nhiệt K80</option>
                <option value="thermal_label">Tem Barcode</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">
              {PRINT_TEMPLATE_LABELS.FIELD_DESCRIPTION}
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ghi chú mục đích sử dụng của mẫu in..."
              className="field-input text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-default">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {PRINT_TEMPLATE_LABELS.BTN_CANCEL}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !name.trim() || !code.trim()}
              className="font-bold"
            >
              {isSubmitting ? 'Đang tạo...' : PRINT_TEMPLATE_LABELS.BTN_CONFIRM}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface DuplicateTemplateModalProps {
  template: PrintTemplateEntity | null;
  onClose: () => void;
  onSubmit: (params: {
    templateId: string;
    newName: string;
    newCode: string;
  }) => Promise<void>;
}

export function DuplicateTemplateModal({
  template,
  onClose,
  onSubmit,
}: DuplicateTemplateModalProps) {
  const [name, setName] = useState(
    template ? `${template.name} (Bản sao)` : '',
  );
  const [code, setCode] = useState(template ? `${template.code}_COPY` : '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!template) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        templateId: template.id,
        newName: name.trim(),
        newCode: code.trim().toUpperCase(),
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-surface rounded-2xl border border-default shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-default flex items-center justify-between bg-surface-secondary/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Icon name="Copy" size={16} />
            </div>
            <h3 className="font-bold text-base text-foreground">
              {PRINT_TEMPLATE_LABELS.MODAL_DUPLICATE_TITLE}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-muted hover:text-foreground flex items-center justify-center"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">
              Tên mẫu in mới *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field-input text-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">
              Mã định danh mới *
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="field-input text-sm font-mono uppercase"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-default">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {PRINT_TEMPLATE_LABELS.BTN_CANCEL}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !name.trim() || !code.trim()}
              className="font-bold"
            >
              {isSubmitting
                ? 'Đang nhân bản...'
                : PRINT_TEMPLATE_LABELS.BTN_CONFIRM}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
