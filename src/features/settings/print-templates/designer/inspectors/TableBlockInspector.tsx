import type { TableBlock, TableColumnConfig } from '@/domain/print';
import { Button, Icon } from '@/shared/components';

interface TableBlockInspectorProps {
  block: TableBlock;
  onUpdateBlock: (updatedBlock: TableBlock) => void;
}

export function TableBlockInspector({
  block,
  onUpdateBlock,
}: TableBlockInspectorProps) {
  const handleToggleTotalRow = () => {
    onUpdateBlock({
      ...block,
      showTotalRow: !block.showTotalRow,
    });
  };

  const handleBorderStyleChange = (style: 'solid' | 'dashed' | 'none') => {
    onUpdateBlock({
      ...block,
      borderStyle: style,
    });
  };

  const handleUpdateColumn = (
    index: number,
    updates: Partial<TableColumnConfig>,
  ) => {
    const nextColumns = block.columns.map((col, i) =>
      i === index ? { ...col, ...updates } : col,
    );
    onUpdateBlock({
      ...block,
      columns: nextColumns,
    });
  };

  const handleDeleteColumn = (index: number) => {
    if (block.columns.length <= 1) return;
    onUpdateBlock({
      ...block,
      columns: block.columns.filter((_, i) => i !== index),
    });
  };

  const handleAddColumn = () => {
    const newCol: TableColumnConfig = {
      key: `col_${Date.now().toString(36).slice(2, 6)}`,
      label: 'Cột Mới',
      widthPercent: 15,
      align: 'left',
      fieldBinding: 'custom_field',
    };
    onUpdateBlock({
      ...block,
      columns: [...block.columns, newCol],
    });
  };

  return (
    <div className="flex flex-col gap-3.5 p-4 text-xs">
      <div className="flex items-center gap-2 pb-2 border-b border-default">
        <Icon name="Table" size={15} className="text-primary" />
        <span className="font-bold text-foreground text-xs uppercase tracking-wide">
          Cấu Hình Bảng Hàng Hóa
        </span>
      </div>

      {/* Table Style Controls */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-muted">
            Kiểu Khung Viền:
          </label>
          <select
            value={block.borderStyle}
            onChange={(e) =>
              handleBorderStyleChange(
                e.target.value as 'solid' | 'dashed' | 'none',
              )
            }
            className="field-input text-xs"
          >
            <option value="dashed">Viền nét đứt (In Kim)</option>
            <option value="solid">Viền nét liền (Laser)</option>
            <option value="none">Không viền</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-muted">
            Dòng Tổng Cộng:
          </label>
          <button
            type="button"
            onClick={handleToggleTotalRow}
            className={`field-input text-xs font-semibold flex items-center justify-center gap-1.5 ${
              block.showTotalRow
                ? 'bg-primary/10 text-primary border-primary/40'
                : 'bg-surface text-muted'
            }`}
          >
            <Icon
              name={block.showTotalRow ? 'CheckSquare' : 'Square'}
              size={14}
            />
            {block.showTotalRow ? 'Đang Hiển Thị' : 'Đang Ẩn'}
          </button>
        </div>
      </div>

      {/* Columns List Management */}
      <div className="flex flex-col gap-2 pt-2 border-t border-default/60">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-foreground">
            Danh Sách Cột ({block.columns.length}):
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddColumn}
            className="text-[10px] h-6 px-2 gap-1"
          >
            <Icon name="Plus" size={12} />
            Thêm Cột
          </Button>
        </div>

        <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
          {block.columns.map((col, idx) => (
            <div
              key={col.key || idx}
              className="p-2 rounded-lg border border-default bg-surface-secondary/40 flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between gap-1.5">
                <input
                  type="text"
                  value={col.label}
                  onChange={(e) =>
                    handleUpdateColumn(idx, { label: e.target.value })
                  }
                  placeholder="Tiêu đề cột..."
                  className="field-input text-xs h-7 font-bold flex-1"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteColumn(idx)}
                  disabled={block.columns.length <= 1}
                  className="w-6 h-6 rounded hover:bg-danger-soft hover:text-danger text-muted flex items-center justify-center disabled:opacity-20"
                >
                  <Icon name="Trash2" size={12} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted shrink-0">Rộng:</span>
                  <input
                    type="number"
                    min={5}
                    max={80}
                    value={col.widthPercent}
                    onChange={(e) =>
                      handleUpdateColumn(idx, {
                        widthPercent: Number(e.target.value) || 10,
                      })
                    }
                    className="field-input text-xs h-6 font-mono text-center"
                  />
                  <span className="text-[10px] text-muted">%</span>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted shrink-0">Căn:</span>
                  <select
                    value={col.align}
                    onChange={(e) =>
                      handleUpdateColumn(idx, {
                        align: e.target.value as 'left' | 'center' | 'right',
                      })
                    }
                    className="field-input text-[11px] h-6 py-0 px-1"
                  >
                    <option value="left">Trái</option>
                    <option value="center">Giữa</option>
                    <option value="right">Phải</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
