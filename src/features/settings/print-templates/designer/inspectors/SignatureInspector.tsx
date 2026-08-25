import type { SignatureBlock, SignatureSlot } from '@/domain/print';
import { Button, Icon } from '@/shared/components';

interface SignatureInspectorProps {
  block: SignatureBlock;
  onUpdateBlock: (updatedBlock: SignatureBlock) => void;
}

export function SignatureInspector({
  block,
  onUpdateBlock,
}: SignatureInspectorProps) {
  const handleUpdateSlot = (index: number, updates: Partial<SignatureSlot>) => {
    const nextSlots = block.slots.map((slot, i) =>
      i === index ? { ...slot, ...updates } : slot,
    );
    onUpdateBlock({
      ...block,
      slots: nextSlots,
    });
  };

  const handleAddSlot = () => {
    if (block.slots.length >= 4) return;
    onUpdateBlock({
      ...block,
      slots: [
        ...block.slots,
        { title: 'Người Ký Mới', subtitle: '(Ký, ghi rõ họ tên)' },
      ],
    });
  };

  const handleDeleteSlot = (index: number) => {
    if (block.slots.length <= 1) return;
    onUpdateBlock({
      ...block,
      slots: block.slots.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="flex flex-col gap-3.5 p-4 text-xs">
      <div className="flex items-center gap-2 pb-2 border-b border-default">
        <Icon name="PenTool" size={15} className="text-primary" />
        <span className="font-bold text-foreground text-xs uppercase tracking-wide">
          Cấu Hình Khung Chữ Ký
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-foreground">
          Số Lượng Ô Ký ({block.slots.length}/4):
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={block.slots.length >= 4}
          onClick={handleAddSlot}
          className="text-[10px] h-6 px-2 gap-1"
        >
          <Icon name="Plus" size={12} />
          Thêm Ô Ký
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {block.slots.map((slot, idx) => (
          <div
            key={idx}
            className="p-2.5 rounded-lg border border-default bg-surface-secondary/40 flex flex-col gap-1.5"
          >
            <div className="flex items-center justify-between gap-1">
              <input
                type="text"
                value={slot.title}
                onChange={(e) =>
                  handleUpdateSlot(idx, { title: e.target.value })
                }
                placeholder="Tiêu đề ô ký..."
                className="field-input text-xs h-7 font-bold flex-1"
              />
              <button
                type="button"
                onClick={() => handleDeleteSlot(idx)}
                disabled={block.slots.length <= 1}
                className="w-6 h-6 rounded hover:bg-danger-soft hover:text-danger text-muted flex items-center justify-center disabled:opacity-20"
              >
                <Icon name="Trash2" size={12} />
              </button>
            </div>

            <input
              type="text"
              value={slot.subtitle || ''}
              onChange={(e) =>
                handleUpdateSlot(idx, { subtitle: e.target.value })
              }
              placeholder="Ghi chú dưới (vd: Ký, đóng dấu)..."
              className="field-input text-xs h-6 text-muted"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
