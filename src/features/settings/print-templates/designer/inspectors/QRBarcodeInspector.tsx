import type { BarcodeBlock, QRBlock, TemplateBlock } from '@/domain/print';
import { Icon } from '@/shared/components';

interface QRBarcodeInspectorProps {
  block: QRBlock | BarcodeBlock;
  onUpdateBlock: (updatedBlock: TemplateBlock) => void;
}

export function QRBarcodeInspector({
  block,
  onUpdateBlock,
}: QRBarcodeInspectorProps) {
  const isQr = block.type === 'qr';

  return (
    <div className="flex flex-col gap-3.5 p-4 text-xs">
      <div className="flex items-center gap-2 pb-2 border-b border-default">
        <Icon
          name={isQr ? 'QrCode' : 'ScanLine'}
          size={15}
          className="text-primary"
        />
        <span className="font-bold text-foreground text-xs uppercase tracking-wide">
          {isQr ? 'Cấu Hình Mã QR' : 'Cấu Hình Mã Vạch Barcode'}
        </span>
      </div>

      {isQr ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-muted">
              Kích Thước (mm):
            </label>
            <input
              type="number"
              min={10}
              max={60}
              value={block.sizeMm}
              onChange={(e) =>
                onUpdateBlock({
                  ...block,
                  sizeMm: Number(e.target.value) || 20,
                })
              }
              className="field-input text-xs font-mono font-bold"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-muted">
              Trường Dữ Liệu Tạo Mã:
            </label>
            <input
              type="text"
              value={block.valueBinding}
              onChange={(e) =>
                onUpdateBlock({
                  ...block,
                  valueBinding: e.target.value,
                })
              }
              placeholder="shipment.code"
              className="field-input text-xs font-mono"
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-muted">
              Định Dạng Mã Vạch:
            </label>
            <select
              value={block.format}
              onChange={(e) =>
                onUpdateBlock({
                  ...block,
                  format: e.target.value as 'CODE128' | 'EAN13' | 'QR',
                })
              }
              className="field-input text-xs"
            >
              <option value="CODE128">
                CODE128 (Chuẩn Tem Vải & Thùng Hàng)
              </option>
              <option value="EAN13">EAN-13 (Chuẩn Bán Lẻ Toàn Cầu)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-muted">
              Trường Dữ Liệu Mã Vạch:
            </label>
            <input
              type="text"
              value={block.valueBinding}
              onChange={(e) =>
                onUpdateBlock({
                  ...block,
                  valueBinding: e.target.value,
                })
              }
              placeholder="roll.number"
              className="field-input text-xs font-mono"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] font-medium text-muted">
              Hiện Chữ Số Bên Dưới:
            </span>
            <input
              type="checkbox"
              checked={block.showText}
              onChange={(e) =>
                onUpdateBlock({
                  ...block,
                  showText: e.target.checked,
                })
              }
              className="w-4 h-4 rounded text-primary"
            />
          </div>
        </div>
      )}
    </div>
  );
}
