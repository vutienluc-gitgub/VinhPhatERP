import type { TemplateBlock } from '@/domain/print';
import { Button, Icon } from '@/shared/components';

interface BlockPaletteProps {
  blocks: TemplateBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string | null) => void;
  onToggleBlock: (blockId: string) => void;
  onMoveBlock: (blockId: string, direction: 'up' | 'down') => void;
  onAddBlock: (type: TemplateBlock['type']) => void;
  onDeleteBlock: (blockId: string) => void;
}

export function BlockPalette({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onToggleBlock,
  onMoveBlock,
  onAddBlock,
  onDeleteBlock,
}: BlockPaletteProps) {
  const getBlockIcon = (type: TemplateBlock['type']) => {
    switch (type) {
      case 'text':
        return 'Type';
      case 'image':
        return 'Image';
      case 'table':
        return 'Table';
      case 'qr':
        return 'QrCode';
      case 'barcode':
        return 'ScanLine';
      case 'line':
        return 'Minus';
      case 'signature':
        return 'PenTool';
      case 'page_number':
        return 'Hash';
      default:
        return 'Square';
    }
  };

  const getBlockTitle = (block: TemplateBlock) => {
    switch (block.type) {
      case 'text':
        return block.content
          ? block.content.slice(0, 24) +
              (block.content.length > 24 ? '...' : '')
          : 'Khối Văn Bản';
      case 'image':
        return 'Logo / Hình Ảnh';
      case 'table':
        return `Bảng Hàng Hóa (${block.columns.length} cột)`;
      case 'qr':
        return `Mã QR (${block.sizeMm}mm)`;
      case 'barcode':
        return `Mã Vạch (${block.format})`;
      case 'line':
        return 'Đường Kẻ Phân Cách';
      case 'signature':
        return `Khung Chữ Ký (${block.slots.length} ô)`;
      case 'page_number':
        return 'Đánh Số Trang';
      default:
        return 'Khối Giao Diện';
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface border-r border-default overflow-hidden select-none">
      {/* Palette Header */}
      <div className="p-3.5 border-b border-default bg-surface-secondary/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="Layers" size={15} className="text-primary" />
          <span className="font-bold text-xs text-foreground uppercase tracking-wide">
            Khối Giao Diện ({blocks.length})
          </span>
        </div>
      </div>

      {/* Blocks List */}
      <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-1.5">
        {blocks
          .sort((a, b) => a.order - b.order)
          .map((block, idx) => {
            const isSelected = selectedBlockId === block.id;

            return (
              <div
                key={block.id}
                onClick={() => onSelectBlock(block.id)}
                className={`p-2 rounded-xl border text-xs flex items-center justify-between gap-2 cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary text-foreground shadow-sm'
                    : 'border-default bg-surface hover:bg-surface-secondary text-muted hover:text-foreground'
                } ${!block.enabled ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Icon
                    name={getBlockIcon(block.type)}
                    size={14}
                    className={isSelected ? 'text-primary' : 'text-muted'}
                  />
                  <span className="font-medium truncate">
                    {getBlockTitle(block)}
                  </span>
                </div>

                {/* Block Item Actions */}
                <div
                  className="flex items-center gap-0.5 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Move Up */}
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => onMoveBlock(block.id, 'up')}
                    className="w-5 h-5 rounded hover:bg-surface-secondary flex items-center justify-center text-muted hover:text-foreground disabled:opacity-20"
                    title="Di chuyển lên"
                  >
                    <Icon name="ChevronUp" size={12} />
                  </button>

                  {/* Move Down */}
                  <button
                    type="button"
                    disabled={idx === blocks.length - 1}
                    onClick={() => onMoveBlock(block.id, 'down')}
                    className="w-5 h-5 rounded hover:bg-surface-secondary flex items-center justify-center text-muted hover:text-foreground disabled:opacity-20"
                    title="Di chuyển xuống"
                  >
                    <Icon name="ChevronDown" size={12} />
                  </button>

                  {/* Toggle Visibility */}
                  <button
                    type="button"
                    onClick={() => onToggleBlock(block.id)}
                    className="w-5 h-5 rounded hover:bg-surface-secondary flex items-center justify-center text-muted hover:text-foreground"
                    title={block.enabled ? 'Ẩn khối' : 'Hiện khối'}
                  >
                    <Icon
                      name={block.enabled ? 'Eye' : 'EyeOff'}
                      size={12}
                      className={block.enabled ? 'text-primary' : 'text-muted'}
                    />
                  </button>

                  {/* Delete Block */}
                  <button
                    type="button"
                    onClick={() => onDeleteBlock(block.id)}
                    className="w-5 h-5 rounded hover:bg-danger-soft hover:text-danger flex items-center justify-center text-muted"
                    title="Xóa khối"
                  >
                    <Icon name="Trash2" size={12} />
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      {/* Add New Block Bar */}
      <div className="p-2.5 border-t border-default bg-surface-secondary/40 flex flex-col gap-1.5">
        <span className="text-[10px] font-bold text-muted uppercase tracking-wider px-1">
          + Thêm Thành Phần
        </span>
        <div className="grid grid-cols-3 gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAddBlock('text')}
            className="text-[11px] h-7 px-1 flex items-center justify-center gap-1 bg-surface"
          >
            <Icon name="Type" size={11} />
            Chữ
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAddBlock('table')}
            className="text-[11px] h-7 px-1 flex items-center justify-center gap-1 bg-surface"
          >
            <Icon name="Table" size={11} />
            Bảng
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAddBlock('qr')}
            className="text-[11px] h-7 px-1 flex items-center justify-center gap-1 bg-surface"
          >
            <Icon name="QrCode" size={11} />
            Mã QR
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAddBlock('signature')}
            className="text-[11px] h-7 px-1 flex items-center justify-center gap-1 bg-surface"
          >
            <Icon name="PenTool" size={11} />
            Ký Tên
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAddBlock('image')}
            className="text-[11px] h-7 px-1 flex items-center justify-center gap-1 bg-surface"
          >
            <Icon name="Image" size={11} />
            Logo
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAddBlock('line')}
            className="text-[11px] h-7 px-1 flex items-center justify-center gap-1 bg-surface"
          >
            <Icon name="Minus" size={11} />
            Kẻ Dòng
          </Button>
        </div>
      </div>
    </div>
  );
}
