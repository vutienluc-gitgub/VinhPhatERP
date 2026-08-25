import type { PrintLayout, PrintTemplateEntity } from '@/domain/print';
import { Icon } from '@/shared/components';

interface PageInspectorProps {
  template: PrintTemplateEntity;
  layout: PrintLayout;
  onUpdateLayout: (newLayout: PrintLayout) => void;
  onUpdateTemplate: (updates: Partial<PrintTemplateEntity>) => void;
}

export function PageInspector({
  template,
  layout,
  onUpdateLayout,
  onUpdateTemplate,
}: PageInspectorProps) {
  const page = layout.page;
  const styles = layout.styles;

  const handleDimensionChange = (key: keyof typeof page, value: number) => {
    onUpdateLayout({
      ...layout,
      page: {
        ...page,
        [key]: value,
      },
    });
  };

  const handleApplyPreset = (
    width: number,
    height: number,
    left: number,
    right: number,
  ) => {
    onUpdateLayout({
      ...layout,
      page: {
        ...page,
        widthMm: width,
        heightMm: height,
        marginLeftMm: left,
        marginRightMm: right,
      },
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4 text-xs">
      <div className="flex items-center gap-2 pb-2 border-b border-default">
        <Icon name="Sliders" size={15} className="text-primary" />
        <span className="font-bold text-foreground text-xs uppercase tracking-wide">
          Cấu Hình Khổ Giấy & Căn Lề
        </span>
      </div>

      {/* Preset Quick Buttons */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold text-muted">
          Kích Thước Mẫu Chuẩn:
        </span>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => handleApplyPreset(200, 148, 3, 3)}
            className="p-1.5 rounded border border-default bg-surface hover:bg-surface-secondary text-[10px] font-semibold text-center"
          >
            200 × 148 mm (A5 Kim)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset(210, 297, 10, 10)}
            className="p-1.5 rounded border border-default bg-surface hover:bg-surface-secondary text-[10px] font-semibold text-center"
          >
            210 × 297 mm (A4 Laser)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset(80, 60, 2, 2)}
            className="p-1.5 rounded border border-default bg-surface hover:bg-surface-secondary text-[10px] font-semibold text-center"
          >
            80 × 60 mm (Tem K80)
          </button>
        </div>
      </div>

      {/* Page Dimensions (mm) */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-muted">
            Chiều Rộng (mm)
          </label>
          <input
            type="number"
            value={page.widthMm}
            onChange={(e) =>
              handleDimensionChange('widthMm', Number(e.target.value))
            }
            className="field-input text-xs font-mono font-bold"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-muted">
            Chiều Cao (mm)
          </label>
          <input
            type="number"
            value={page.heightMm}
            onChange={(e) =>
              handleDimensionChange('heightMm', Number(e.target.value))
            }
            className="field-input text-xs font-mono font-bold"
          />
        </div>
      </div>

      {/* Margins (mm) */}
      <div className="flex flex-col gap-2 pt-2 border-t border-default/60">
        <span className="text-[11px] font-bold text-foreground">
          Căn Lề Giấy (mm):
        </span>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted">Lề Trái (Left)</label>
            <input
              type="number"
              value={page.marginLeftMm}
              onChange={(e) =>
                handleDimensionChange('marginLeftMm', Number(e.target.value))
              }
              className="field-input text-xs font-mono"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted">Lề Phải (Right)</label>
            <input
              type="number"
              value={page.marginRightMm}
              onChange={(e) =>
                handleDimensionChange('marginRightMm', Number(e.target.value))
              }
              className="field-input text-xs font-mono"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted">Lề Trên (Top)</label>
            <input
              type="number"
              value={page.marginTopMm}
              onChange={(e) =>
                handleDimensionChange('marginTopMm', Number(e.target.value))
              }
              className="field-input text-xs font-mono"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted">Lề Dưới (Bottom)</label>
            <input
              type="number"
              value={page.marginBottomMm}
              onChange={(e) =>
                handleDimensionChange('marginBottomMm', Number(e.target.value))
              }
              className="field-input text-xs font-mono"
            />
          </div>
        </div>
      </div>

      {/* Orientation & Font Style */}
      <div className="flex flex-col gap-2 pt-2 border-t border-default/60">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-muted">
            Kiểu Font Chữ In:
          </label>
          <select
            value={styles?.fontFamily || 'Inter'}
            onChange={(e) =>
              onUpdateLayout({
                ...layout,
                styles: {
                  ...styles,
                  fontFamily: e.target.value as
                    | 'Inter'
                    | 'Roboto'
                    | 'Courier_Mono',
                  baseFontSizePt: styles?.baseFontSizePt || 10,
                },
              })
            }
            className="field-input text-xs"
          >
            <option value="Inter">Inter (Hiện đại - Chuẩn Laser / PDF)</option>
            <option value="Roboto">Roboto (Chuẩn Văn Phòng)</option>
            <option value="Courier_Mono">
              Courier Monospace (Nét Kim Dot-Matrix)
            </option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-muted">
            Chiều Giấy In:
          </label>
          <select
            value={template.orientation}
            onChange={(e) =>
              onUpdateTemplate({
                orientation: e.target.value as 'portrait' | 'landscape',
              })
            }
            className="field-input text-xs"
          >
            <option value="landscape">
              Khổ Ngang (Landscape - Phù hợp A5 Kim)
            </option>
            <option value="portrait">
              Khổ Đứng (Portrait - Phù hợp A4 Laser)
            </option>
          </select>
        </div>
      </div>
    </div>
  );
}
