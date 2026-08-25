import { QRCodeSVG } from 'qrcode.react';

import type {
  PrintLayout,
  PrintTemplateEntity,
  TableBlock,
  TemplateBlock,
} from '@/domain/print';

interface PaperCanvasProps {
  template: PrintTemplateEntity;
  layout: PrintLayout;
  selectedBlockId: string | null;
  zoomLevel: number;
  onSelectBlock: (blockId: string | null) => void;
}

export function PaperCanvas({
  template,
  layout,
  selectedBlockId,
  zoomLevel,
  onSelectBlock,
}: PaperCanvasProps) {
  const isDotMatrix = template.targetPrinterProfile === 'dot_matrix';
  const isLandscape = template.orientation === 'landscape';
  const page = layout.page;
  const isCourier = layout.styles?.fontFamily === 'Courier_Mono';

  // Calculate pixel dimensions from mm (1mm ~= 3.78px at 96 DPI)
  const baseWidthPx = page.widthMm * 3.78;
  const baseHeightPx = page.heightMm * 3.78;

  const renderBlockContent = (block: TemplateBlock) => {
    switch (block.type) {
      case 'text':
        return (
          <div
            style={{
              fontSize: `${block.fontSizePt * 1.33}px`,
              fontWeight: block.fontWeight === 'bold' ? 700 : 400,
              textAlign: block.align,
            }}
            className="w-full text-foreground leading-snug"
          >
            {block.content || '(Nhấp đúp để nhập văn bản)'}
          </div>
        );

      case 'image':
        return (
          <div className="flex items-center justify-center p-1">
            <img
              src={block.fallbackUrl || '/favicon.svg'}
              alt="Logo"
              className="h-10 max-h-12 object-contain"
            />
          </div>
        );

      case 'table': {
        const tableBlock = block as TableBlock;
        return (
          <div
            className={`w-full overflow-hidden border rounded my-1 ${
              tableBlock.borderStyle === 'dashed'
                ? 'border-dashed border-foreground/40'
                : tableBlock.borderStyle === 'solid'
                  ? 'border-foreground/60'
                  : 'border-transparent'
            }`}
          >
            <table className="w-full text-[11px] border-collapse">
              <thead className="bg-surface-secondary/70 border-b border-foreground/30 font-bold">
                <tr>
                  {tableBlock.columns.map((col) => (
                    <th
                      key={col.key}
                      style={{
                        width: `${col.widthPercent}%`,
                        textAlign: col.align,
                      }}
                      className="py-1 px-1.5"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-default/60">
                <tr>
                  {tableBlock.columns.map((col) => (
                    <td
                      key={col.key}
                      style={{ textAlign: col.align }}
                      className="py-1 px-1.5"
                    >
                      {col.key === 'stt'
                        ? '1'
                        : col.key === 'roll_number'
                          ? 'C01'
                          : col.key === 'fabric_type'
                            ? 'Cotton 100% 230gsm'
                            : col.key === 'color_name'
                              ? 'Trắng Sứ'
                              : '120.5m'}
                    </td>
                  ))}
                </tr>
                <tr>
                  {tableBlock.columns.map((col) => (
                    <td
                      key={col.key}
                      style={{ textAlign: col.align }}
                      className="py-1 px-1.5"
                    >
                      {col.key === 'stt'
                        ? '2'
                        : col.key === 'roll_number'
                          ? 'C02'
                          : col.key === 'fabric_type'
                            ? 'Cotton 100% 230gsm'
                            : col.key === 'color_name'
                              ? 'Trắng Sứ'
                              : '118.0m'}
                    </td>
                  ))}
                </tr>
                <tr>
                  {tableBlock.columns.map((col) => (
                    <td
                      key={col.key}
                      style={{ textAlign: col.align }}
                      className="py-1 px-1.5"
                    >
                      {col.key === 'stt'
                        ? '3'
                        : col.key === 'roll_number'
                          ? 'C03'
                          : col.key === 'fabric_type'
                            ? 'CVC Cá Sấu 4 chiều'
                            : col.key === 'color_name'
                              ? 'Xanh Navy'
                              : '145.2m'}
                    </td>
                  ))}
                </tr>
              </tbody>
              {tableBlock.showTotalRow && (
                <tfoot>
                  <tr className="bg-surface-secondary/40 font-bold border-t border-foreground/40">
                    <td
                      colSpan={Math.max(1, tableBlock.columns.length - 1)}
                      className="py-1 px-2 text-right"
                    >
                      Tổng cộng:
                    </td>
                    <td className="py-1 px-1.5 text-right font-mono text-primary">
                      383.7m (3 cây)
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        );
      }

      case 'qr':
        return (
          <div className="flex justify-center p-1">
            <QRCodeSVG
              value="https://vinhphaterp.vn/verify"
              size={block.sizeMm * 3.78}
            />
          </div>
        );

      case 'barcode':
        return (
          <div className="flex flex-col items-center justify-center p-1">
            <div className="h-8 w-36 bg-foreground/80 flex items-center justify-center text-[9px] text-background font-mono">
              ||||| | |||| ||| |||||
            </div>
            {block.showText && (
              <span className="text-[10px] font-mono font-bold mt-0.5">
                C01-26040012
              </span>
            )}
          </div>
        );

      case 'line':
        return (
          <div
            style={{
              height: `${block.thicknessMm * 3.78}px`,
              borderTopStyle: block.style,
            }}
            className="w-full border-t border-foreground/40 my-1.5"
          />
        );

      case 'signature':
        return (
          <div className="grid grid-flow-col auto-cols-fr gap-2 pt-4 pb-2 text-center text-xs">
            {block.slots.map((slot, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="font-bold">{slot.title}</span>
                <span className="text-[10px] text-muted">
                  {slot.subtitle || '(Ký tên)'}
                </span>
                <div className="h-10" />
              </div>
            ))}
          </div>
        );

      case 'page_number':
        return (
          <div
            style={{ textAlign: block.align }}
            className="text-[10px] text-muted font-mono py-1"
          >
            Trang 1 / 1
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      onClick={() => onSelectBlock(null)}
      className="relative flex items-center justify-center min-w-full min-h-full p-12 bg-surface-secondary/70"
    >
      <div
        style={{
          width: `${baseWidthPx}px`,
          minHeight: `${baseHeightPx}px`,
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'top center',
          paddingTop: `${page.marginTopMm * 3.78}px`,
          paddingBottom: `${page.marginBottomMm * 3.78}px`,
          paddingLeft: `${(page.marginLeftMm + (isDotMatrix ? 8 : 0)) * 3.78}px`,
          paddingRight: `${(page.marginRightMm + (isDotMatrix ? 8 : 0)) * 3.78}px`,
          fontFamily: isCourier ? 'Courier, monospace' : 'Inter, sans-serif',
        }}
        className={`relative bg-surface text-foreground rounded-lg shadow-2xl border border-default flex flex-col justify-between select-none transition-transform duration-100 ${
          isLandscape ? 'aspect-[200/148]' : ''
        }`}
        onClick={(e) => {
          e.stopPropagation();
          onSelectBlock(null);
        }}
      >
        {/* Tractor feed holes simulation for Dot-matrix printer */}
        {isDotMatrix && (
          <>
            <div className="absolute left-2 top-3 bottom-3 flex flex-col justify-between items-center w-2 pointer-events-none opacity-30">
              {Array.from({ length: 12 }).map((_, i) => (
                <span
                  key={i}
                  className="w-2.5 h-2.5 rounded-full border border-foreground/50 bg-surface-secondary"
                />
              ))}
            </div>
            <div className="absolute right-2 top-3 bottom-3 flex flex-col justify-between items-center w-2 pointer-events-none opacity-30">
              {Array.from({ length: 12 }).map((_, i) => (
                <span
                  key={i}
                  className="w-2.5 h-2.5 rounded-full border border-foreground/50 bg-surface-secondary"
                />
              ))}
            </div>
          </>
        )}

        {/* Render Blocks List in Order */}
        <div className="flex flex-col gap-1 w-full">
          {layout.blocks
            .filter((b) => b.enabled)
            .sort((a, b) => a.order - b.order)
            .map((block) => {
              const isSelected = selectedBlockId === block.id;

              return (
                <div
                  key={block.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectBlock(block.id);
                  }}
                  className={`relative cursor-pointer transition-all duration-150 rounded p-1 ${
                    isSelected
                      ? 'ring-2 ring-primary ring-offset-1 bg-primary/5 shadow-sm'
                      : 'hover:outline hover:outline-1 hover:outline-primary/40'
                  }`}
                >
                  {renderBlockContent(block)}

                  {/* Selected Indicator Tag */}
                  {isSelected && (
                    <span className="absolute -top-2.5 -right-2 px-1.5 py-0.2 rounded bg-primary text-primary-foreground text-[8px] font-mono font-bold shadow">
                      {block.type.toUpperCase()}
                    </span>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
