import { QRCodeSVG } from 'qrcode.react';

import type { FabricRollPackingItem } from '@/domain/inventory/packing-list.types';
import type { PageDimensions } from '@/domain/print';

import { PackingRollsPreview } from './packing-list/PackingRollsPreview';
import type { PrintItem } from './print-dialog.constants';

export interface PrintCanvasPreviewProps {
  page: PageDimensions;
  zoomLevel: number;
  isDotMatrix: boolean;
  isCourier: boolean;
  isLandscape: boolean;
  templateName: string;
  companyName: string;
  docNumber: string;
  customerName: string;
  carrierInfo: string;
  deliveryAddress: string;
  items: PrintItem[];
  totalQuantity: number;
  variant?: 'shipment' | 'packing_list';
  packingRolls?: FabricRollPackingItem[];
  packingMeta?: {
    customerName?: string;
    licensePlate?: string;
    driverName?: string;
    notes?: string;
  };
}

/** Renders the paper sheet shown in the print dialog preview viewport. */
export function PrintCanvasPreview({
  page,
  zoomLevel,
  isDotMatrix,
  isCourier,
  isLandscape,
  templateName,
  companyName,
  docNumber,
  customerName,
  carrierInfo,
  deliveryAddress,
  items,
  totalQuantity,
  variant = 'shipment',
  packingRolls = [],
  packingMeta,
}: PrintCanvasPreviewProps) {
  return (
    <div className="flex-1 overflow-auto p-8 bg-surface-secondary/70 flex items-center justify-center min-h-[440px]">
      <div
        style={{
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'top center',
          width: `${page.widthMm * 3.78}px`,
          minHeight: `${page.heightMm * 3.78}px`,
          paddingTop: `${page.marginTopMm * 3.78}px`,
          paddingBottom: `${page.marginBottomMm * 3.78}px`,
          paddingLeft: `${(page.marginLeftMm + (isDotMatrix ? 8 : 0)) * 3.78}px`,
          paddingRight: `${(page.marginRightMm + (isDotMatrix ? 8 : 0)) * 3.78}px`,
          fontFamily: isCourier ? 'Courier, monospace' : 'Inter, sans-serif',
        }}
        className={`relative bg-surface text-foreground rounded shadow-2xl border border-default p-6 flex flex-col justify-between select-none ${
          isLandscape ? 'aspect-[200/148]' : ''
        }`}
      >
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

        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between border-b border-default pb-3">
            <div className="flex items-center gap-3">
              <img
                src="/brand/logo-symbol-monochrome-black.svg"
                alt="Logo"
                className="w-8 h-8 object-contain shrink-0"
              />
              <div className="flex flex-col">
                <span className="font-extrabold text-sm uppercase tracking-wide">
                  {companyName}
                </span>
                <span className="text-[11px] text-muted">
                  80A Trương Phước Phan, P. Bình Trị Đông, TP.HCM
                </span>
                <span className="text-[11px] text-muted">
                  MST: 0318633734 • Hotline: 0975097499
                </span>
              </div>
            </div>
            <QRCodeSVG value={docNumber} size={42} />
          </div>

          <div className="text-center py-1">
            <h2 className="text-base font-extrabold uppercase tracking-wider">
              {templateName}
            </h2>
            <span className="text-xs font-mono text-muted">
              Số: {docNumber} • Ngày: 02/04/2026
            </span>
          </div>

          {variant === 'packing_list' ? (
            <PackingRollsPreview rolls={packingRolls} meta={packingMeta} />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs py-2 bg-surface-secondary/40 rounded p-2.5 border border-default">
                <div>
                  <span className="text-muted">Khách hàng: </span>
                  <strong className="text-foreground">{customerName}</strong>
                </div>
                <div>
                  <span className="text-muted">Vận chuyển: </span>
                  <span className="text-foreground">{carrierInfo}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted">Địa chỉ giao: </span>
                  <span className="text-foreground">{deliveryAddress}</span>
                </div>
              </div>

              <div className="border border-default rounded overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface-secondary/80 text-[11px] font-bold border-b border-default text-muted uppercase">
                    <tr>
                      <th className="py-1.5 px-2 text-center w-8">STT</th>
                      <th className="py-1.5 px-2 text-center w-16">Mã Cây</th>
                      <th className="py-1.5 px-2">Tên Hàng / Quy Cách</th>
                      <th className="py-1.5 px-2">Màu Sắc</th>
                      <th className="py-1.5 px-2 text-right">Số Lượng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-default">
                    {items.map((item, i) => (
                      <tr key={i}>
                        <td className="py-1.5 px-2 text-center font-mono">
                          {i + 1}
                        </td>
                        <td className="py-1.5 px-2 text-center font-mono font-bold">
                          {item.roll_number || `C0${i + 1}`}
                        </td>
                        <td className="py-1.5 px-2 font-medium">
                          {item.fabric_type || 'Vải Cotton 100%'}
                        </td>
                        <td className="py-1.5 px-2">
                          {item.color_name || 'Trắng Sứ'}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono font-bold">
                          {item.quantity} m
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-surface-secondary/40 font-bold border-t border-default">
                      <td colSpan={4} className="py-1.5 px-2 text-right">
                        Tổng cộng:
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono text-primary">
                        {totalQuantity.toFixed(1)} m ({items.length} cây)
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-6 text-center text-xs">
                <div>
                  <span className="font-bold block">Người Lập Phiếu</span>
                  <span className="text-[10px] text-muted">(Ký tên)</span>
                </div>
                <div>
                  <span className="font-bold block">Thủ Kho Xuất</span>
                  <span className="text-[10px] text-muted">(Ký tên)</span>
                </div>
                <div>
                  <span className="font-bold block">Khách Hàng Nhận</span>
                  <span className="text-[10px] text-muted">(Ký tên)</span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="text-[10px] text-muted text-center pt-3 border-t border-default/60 mt-4">
          * Quý khách vui lòng kiểm tra kỹ số lượng và quy cách trước khi nhận
          hàng.
        </div>
      </div>
    </div>
  );
}
