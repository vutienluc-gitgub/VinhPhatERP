import { useState } from 'react';
import toast from 'react-hot-toast';

import { printTemplateSchema, type PrintTemplateEntity } from '@/domain/print';
import { Button, Icon } from '@/shared/components';

interface TemplateImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: PrintTemplateEntity[];
  onImportSuccess: (importedTemplate: PrintTemplateEntity) => void;
}

export function TemplateImportExportModal({
  isOpen,
  onClose,
  templates,
  onImportSuccess,
}: TemplateImportExportModalProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [selectedExportTemplateId, setSelectedExportTemplateId] =
    useState<string>(templates[0]?.id || '');
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadJson = () => {
    const target = templates.find((t) => t.id === selectedExportTemplateId);
    if (!target) return;

    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(target, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `${target.code.toLowerCase()}_v${target.revision}.vperp-tpl.json`,
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Đã tải file cấu hình mẫu in');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportJsonText(content);
      validateJson(content);
    };
    reader.readAsText(file);
  };

  const validateJson = (text: string) => {
    setValidationError(null);
    try {
      const parsed = JSON.parse(text) as unknown;
      const parseResult = printTemplateSchema.safeParse(parsed);
      if (!parseResult.success) {
        const firstErr =
          parseResult.error.issues[0]?.message || 'Schema không hợp lệ';
        setValidationError(`Lỗi xác thực cấu trúc: ${firstErr}`);
        return null;
      }
      return parseResult.data as PrintTemplateEntity;
    } catch {
      setValidationError(
        'Cú pháp JSON không hợp lệ. Vui lòng kiểm tra lại file.',
      );
      return null;
    }
  };

  const handleExecuteImport = () => {
    const validated = validateJson(importJsonText);
    if (!validated) return;

    // Generate unique ID for imported template to prevent collision
    const safeEntity: PrintTemplateEntity = {
      ...validated,
      id: `tpl-import-${Date.now().toString(36)}`,
      name: `${validated.name} (Đã nhập)`,
      code: `${validated.code}_IMP`,
      isSystem: false,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onImportSuccess(safeEntity);
    toast.success('Đã nhập mẫu in thành công vào danh sách bản nháp');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-surface rounded-2xl border border-default shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-default bg-surface-secondary/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Icon name="ArrowDownUp" size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">
                Xuất / Nhập Mẫu In JSON (.vperp-tpl.json)
              </h3>
              <span className="text-xs text-muted">
                Sao lưu hoặc chuyển giao cấu hình mẫu in giữa các môi trường
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-muted hover:text-foreground flex items-center justify-center"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-default bg-surface-secondary/30 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'export'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            <Icon name="Download" size={14} />
            Xuất File Cấu Hình (Export)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'import'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            <Icon name="Upload" size={14} />
            Nhập Mẫu In Mới (Import)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-4">
          {activeTab === 'export' ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Chọn mẫu in muốn xuất file:
                </label>
                <select
                  value={selectedExportTemplateId}
                  onChange={(e) => setSelectedExportTemplateId(e.target.value)}
                  className="field-input text-sm"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code} • rev.{t.revision})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-4 rounded-xl bg-surface-secondary/50 border border-default flex flex-col gap-1 text-xs text-muted">
                <span className="font-bold text-foreground">
                  Thông tin file sẽ xuất:
                </span>
                <span>• Định dạng: JSON chuẩn (.vperp-tpl.json)</span>
                <span>
                  • Bao gồm: Toàn bộ kích thước mm, margin, và danh sách khối
                  layout.
                </span>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleDownloadJson}
                  className="gap-1.5 font-bold shadow-sm"
                >
                  <Icon name="Download" size={15} />
                  Tải File .vperp-tpl.json
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Tải file từ máy tính hoặc dán nội dung JSON:
                </label>
                <input
                  type="file"
                  accept=".json,.vperp-tpl.json"
                  onChange={handleFileUpload}
                  className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:opacity-90"
                />
              </div>

              <div className="flex flex-col gap-1">
                <textarea
                  rows={5}
                  value={importJsonText}
                  onChange={(e) => {
                    setImportJsonText(e.target.value);
                    if (e.target.value.trim()) validateJson(e.target.value);
                  }}
                  placeholder="Dán nội dung JSON của mẫu in vào đây..."
                  className="field-input text-xs font-mono"
                />
              </div>

              {validationError ? (
                <div className="p-2.5 rounded-lg bg-danger-soft text-danger text-xs font-medium border border-danger/30 flex items-center gap-2">
                  <Icon name="AlertCircle" size={14} className="shrink-0" />
                  <span>{validationError}</span>
                </div>
              ) : importJsonText.trim() ? (
                <div className="p-2.5 rounded-lg bg-success-soft text-success text-xs font-medium border border-success/30 flex items-center gap-2">
                  <Icon name="CheckCircle2" size={14} className="shrink-0" />
                  <span>
                    Cấu trúc JSON hợp lệ và sẵn sàng nhập vào hệ thống!
                  </span>
                </div>
              ) : null}

              <div className="flex justify-end gap-2 pt-2 border-t border-default">
                <Button variant="outline" size="sm" onClick={onClose}>
                  Hủy Bỏ
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!importJsonText.trim() || Boolean(validationError)}
                  onClick={handleExecuteImport}
                  className="font-bold shadow-sm gap-1.5"
                >
                  <Icon name="Check" size={15} />
                  Xác Nhận Nhập Mẫu
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
