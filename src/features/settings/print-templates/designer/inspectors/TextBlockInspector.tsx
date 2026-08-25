import type { TextBlock } from '@/domain/print';
import type { DocumentType } from '@/domain/print';
import { Icon } from '@/shared/components';
import { VariablePicker } from '@/features/settings/print-templates/designer/VariablePicker';

interface TextBlockInspectorProps {
  block: TextBlock;
  documentType: DocumentType;
  onUpdateBlock: (updatedBlock: TextBlock) => void;
}

export function TextBlockInspector({
  block,
  documentType,
  onUpdateBlock,
}: TextBlockInspectorProps) {
  const handleInsertVariable = (variableKey: string) => {
    onUpdateBlock({
      ...block,
      content: block.content ? `${block.content} ${variableKey}` : variableKey,
    });
  };

  return (
    <div className="flex flex-col gap-3.5 p-4 text-xs">
      <div className="flex items-center gap-2 pb-2 border-b border-default">
        <Icon name="Type" size={15} className="text-primary" />
        <span className="font-bold text-foreground text-xs uppercase tracking-wide">
          Thuộc Tính Khối Chữ
        </span>
      </div>

      {/* Content Textarea */}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-semibold text-foreground">
          Nội Dung Hiển Thị:
        </label>
        <textarea
          rows={3}
          value={block.content}
          onChange={(e) => onUpdateBlock({ ...block, content: e.target.value })}
          placeholder="Nhập nội dung hoặc chọn biến dữ liệu bên dưới..."
          className="field-input text-xs"
        />
      </div>

      {/* Variable Picker Helper */}
      <VariablePicker
        documentType={documentType}
        onInsertVariable={handleInsertVariable}
      />

      {/* Font Size & Alignment */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-muted">
            Cỡ Chữ (pt):
          </label>
          <input
            type="number"
            min={6}
            max={36}
            value={block.fontSizePt}
            onChange={(e) =>
              onUpdateBlock({
                ...block,
                fontSizePt: Number(e.target.value) || 10,
              })
            }
            className="field-input text-xs font-mono font-bold"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-muted">
            Kiểu Chữ:
          </label>
          <select
            value={block.fontWeight}
            onChange={(e) =>
              onUpdateBlock({
                ...block,
                fontWeight: e.target.value as 'normal' | 'bold',
              })
            }
            className="field-input text-xs"
          >
            <option value="normal">Bình thường (Normal)</option>
            <option value="bold">In đậm (Bold)</option>
          </select>
        </div>
      </div>

      {/* Text Align */}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-medium text-muted">Căn Lề:</label>
        <div className="grid grid-cols-3 gap-1 bg-surface-secondary p-0.5 rounded-lg border border-default">
          <button
            type="button"
            onClick={() => onUpdateBlock({ ...block, align: 'left' })}
            className={`py-1 rounded text-[11px] font-medium flex items-center justify-center gap-1 ${
              block.align === 'left'
                ? 'bg-surface text-foreground shadow-sm font-bold'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Icon name="AlignLeft" size={13} />
            Trái
          </button>
          <button
            type="button"
            onClick={() => onUpdateBlock({ ...block, align: 'center' })}
            className={`py-1 rounded text-[11px] font-medium flex items-center justify-center gap-1 ${
              block.align === 'center'
                ? 'bg-surface text-foreground shadow-sm font-bold'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Icon name="AlignCenter" size={13} />
            Giữa
          </button>
          <button
            type="button"
            onClick={() => onUpdateBlock({ ...block, align: 'right' })}
            className={`py-1 rounded text-[11px] font-medium flex items-center justify-center gap-1 ${
              block.align === 'right'
                ? 'bg-surface text-foreground shadow-sm font-bold'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Icon name="AlignRight" size={13} />
            Phải
          </button>
        </div>
      </div>
    </div>
  );
}
