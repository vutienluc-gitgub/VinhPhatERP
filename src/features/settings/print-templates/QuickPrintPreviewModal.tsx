import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

import type { PrintTemplateEntity } from '@/domain/print';
import { Button, Icon } from '@/shared/components';
import { exportShipmentToPdf } from '@/shared/services/print/shipment';
import type { ShipmentDocument } from '@/domain/shipments/types';

import { PRINT_TEMPLATE_LABELS } from './print-templates.constants';

const PREVIEW_SHIPMENT_FIXTURE: ShipmentDocument = {
  id: 'fixture-shipment-preview',
  shipment_number: 'XK2604-0001',
  order_id: 'order-1',
  customer_id: 'customer-1',
  shipment_date: '2026-04-02',
  delivery_address: '123 Đường Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM',
  carrier: 'Xe tải Vĩnh Phát (51C-123.45)',
  tracking_number: null,
  status: 'shipped',
  notes: 'Giao trong giờ hành chính. Liên hệ trước khi đến 15 phút.',
  created_by: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  last_chat_at: null,
  delivery_staff_id: null,
  shipping_rate_id: null,
  shipping_cost: 0,
  loading_fee: 0,
  total_weight_kg: null,
  total_meters: null,
  vehicle_info: null,
  prepared_at: null,
  shipped_at: null,
  delivered_at: null,
  delivery_proof: null,
  receiver_name: 'Trần Văn B',
  receiver_phone: '0909 888 999',
  employee_id: null,
  tenant_id: null,
  journey_status: null,
  signed_at: null,
  customer_signature_url: null,
  proof_photos: null,
  orders: { order_number: 'DH2604-0012' },
  customers: {
    name: 'Công ty TNHH May Mặc Thời Trang Á Đông',
    code: 'KH-ADONG-01',
    address: '456 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM',
    phone: '0909 123 456',
    contact_person: 'Nguyễn Thị Thu',
  },
  shipment_items: [
    {
      id: 'item-1',
      shipment_id: 'fixture-shipment-preview',
      finished_roll_id: 'roll-101',
      fabric_type: 'Vải Cotton 100% 2 chiều 230gsm',
      color_name: 'Trắng Sứ (W-01)',
      quantity: 120.5,
      unit: 'm',
      roll_number: 'C01',
      roll_length_m: null,
      warehouse_location: null,
      notes: 'Đạt chuẩn kiểm kim',
      price_per_meter: null,
      sort_order: 1,
      tenant_id: null,
      total_amount: null,
    },
    {
      id: 'item-2',
      shipment_id: 'fixture-shipment-preview',
      finished_roll_id: 'roll-102',
      fabric_type: 'Vải Cotton 100% 2 chiều 230gsm',
      color_name: 'Trắng Sứ (W-01)',
      quantity: 118.0,
      unit: 'm',
      roll_number: 'C02',
      roll_length_m: null,
      warehouse_location: null,
      notes: null,
      price_per_meter: null,
      sort_order: 2,
      tenant_id: null,
      total_amount: null,
    },
    {
      id: 'item-3',
      shipment_id: 'fixture-shipment-preview',
      finished_roll_id: 'roll-103',
      fabric_type: 'Vải CVC 65/35 Cá Sấu 4 chiều',
      color_name: 'Xanh Navy (NV-09)',
      quantity: 145.2,
      unit: 'm',
      roll_number: 'C03',
      roll_length_m: null,
      warehouse_location: null,
      notes: null,
      price_per_meter: null,
      sort_order: 3,
      tenant_id: null,
      total_amount: null,
    },
  ],
};

interface QuickPrintPreviewModalProps {
  template: PrintTemplateEntity | null;
  onClose: () => void;
}

export function QuickPrintPreviewModal({
  template,
  onClose,
}: QuickPrintPreviewModalProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);

  if (!template) return null;

  const isDotMatrix = template.targetPrinterProfile === 'dot_matrix';
  const isLandscape = template.orientation === 'landscape';
  const page = template.layout.page;

  const handleTestPrint = () => {
    const format = template.paperFormat === 'A5' ? 'A5_DOT_MATRIX' : 'A4';
    void exportShipmentToPdf(PREVIEW_SHIPMENT_FIXTURE, {
      format,
      companyName: 'CÔNG TY TNHH DỆT MAY VĨNH PHÁT',
      logoUrl: '/favicon.svg',
      showLogo: true,
      showQr: true,
      footerNote:
        'Vui lòng kiểm tra kỹ số lượng và quy cách trước khi nhận bàn giao.',
      dotMatrixWidth: `${page.widthMm}mm`,
      dotMatrixHeight: `${page.heightMm}mm`,
      margin: {
        left: `${page.marginLeftMm}mm`,
        right: `${page.marginRightMm}mm`,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] bg-surface rounded-2xl border border-default shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-default flex items-center justify-between bg-surface-secondary/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Icon name="Printer" size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">
                {template.name}
              </h3>
              <span className="text-xs text-muted font-mono">
                {template.code} • {template.paperFormat} ({page.widthMm}×
                {page.heightMm}mm) • {template.targetPrinterProfile}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Zoom controls */}
            <div className="flex items-center gap-1 bg-surface border border-default rounded-lg p-0.5">
              <button
                type="button"
                onClick={() =>
                  setZoomLevel((z) =>
                    Math.max(0.7, Number((z - 0.1).toFixed(1))),
                  )
                }
                className="w-6 h-6 flex items-center justify-center rounded text-muted hover:text-foreground text-xs font-bold"
              >
                -
              </button>
              <span className="text-xs font-mono font-semibold px-1 text-foreground">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() =>
                  setZoomLevel((z) =>
                    Math.min(1.3, Number((z + 0.1).toFixed(1))),
                  )
                }
                className="w-6 h-6 flex items-center justify-center rounded text-muted hover:text-foreground text-xs font-bold"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-muted hover:text-foreground hover:bg-surface flex items-center justify-center transition-colors"
            >
              <Icon name="X" size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body: Realistic Paper Simulation */}
        <div className="flex-1 overflow-auto p-8 bg-surface-secondary/80 flex items-center justify-center min-h-[400px]">
          <div
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'center center',
              transition: 'transform 0.15s ease-out',
            }}
            className={`relative bg-surface text-foreground rounded-lg shadow-xl border border-default p-6 flex flex-col justify-between ${
              isLandscape
                ? 'w-[680px] min-h-[440px]'
                : 'w-[520px] min-h-[640px]'
            }`}
          >
            {/* Dot matrix tractor holes simulation */}
            {isDotMatrix && (
              <>
                <div className="absolute left-2 top-4 bottom-4 flex flex-col justify-between items-center w-2 pointer-events-none opacity-30">
                  {Array.from({ length: 14 }).map((_, i) => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full border border-foreground/40 bg-surface-secondary"
                    />
                  ))}
                </div>
                <div className="absolute right-2 top-4 bottom-4 flex flex-col justify-between items-center w-2 pointer-events-none opacity-30">
                  {Array.from({ length: 14 }).map((_, i) => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full border border-foreground/40 bg-surface-secondary"
                    />
                  ))}
                </div>
              </>
            )}

            {/* Header Area */}
            <div className={`flex flex-col gap-2 ${isDotMatrix ? 'px-6' : ''}`}>
              <div className="flex items-start justify-between border-b border-default pb-3">
                <div className="flex flex-col">
                  <span className="font-extrabold text-sm uppercase tracking-wide text-foreground">
                    CÔNG TY TNHH DỆT MAY VĨNH PHÁT
                  </span>
                  <span className="text-[11px] text-muted">
                    Lô 12 Đường Số 3, KCN Tân Bình, P. Tây Thạnh, TP.HCM
                  </span>
                  <span className="text-[11px] text-muted">
                    MST: 0314567890 • Hotline: 028 3815 1234
                  </span>
                </div>
                <QRCodeSVG value="XK2604-0001" size={44} />
              </div>

              {/* Title */}
              <div className="text-center py-2">
                <h2 className="text-base font-extrabold tracking-wider uppercase text-foreground">
                  {template.name}
                </h2>
                <span className="text-xs font-mono text-muted">
                  Số: XK2604-0001 • Ngày: 02/04/2026
                </span>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs py-2 bg-surface-secondary/40 rounded p-2.5 border border-default">
                <div>
                  <span className="text-muted">Khách hàng: </span>
                  <strong className="text-foreground">
                    Cty May Mặc Á Đông
                  </strong>
                </div>
                <div>
                  <span className="text-muted">Vận chuyển: </span>
                  <span className="text-foreground">Xe tải 51C-123.45</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted">Địa chỉ: </span>
                  <span className="text-foreground">
                    456 Đường Nguyễn Huệ, Quận 1, TP.HCM
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div className="mt-2 border border-default rounded overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface-secondary/80 text-[11px] font-bold border-b border-default text-muted uppercase">
                    <tr>
                      <th className="py-1.5 px-2 text-center w-8">STT</th>
                      <th className="py-1.5 px-2 text-center w-16">Mã Cây</th>
                      <th className="py-1.5 px-2">Tên Mặt Hàng</th>
                      <th className="py-1.5 px-2">Màu</th>
                      <th className="py-1.5 px-2 text-right">Số Mét (m)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-default">
                    <tr>
                      <td className="py-1.5 px-2 text-center font-mono">1</td>
                      <td className="py-1.5 px-2 text-center font-mono font-bold">
                        C01
                      </td>
                      <td className="py-1.5 px-2 font-medium">
                        Cotton 100% 2 chiều 230gsm
                      </td>
                      <td className="py-1.5 px-2">Trắng Sứ</td>
                      <td className="py-1.5 px-2 text-right font-mono font-bold">
                        120.5
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-2 text-center font-mono">2</td>
                      <td className="py-1.5 px-2 text-center font-mono font-bold">
                        C02
                      </td>
                      <td className="py-1.5 px-2 font-medium">
                        Cotton 100% 2 chiều 230gsm
                      </td>
                      <td className="py-1.5 px-2">Trắng Sứ</td>
                      <td className="py-1.5 px-2 text-right font-mono font-bold">
                        118.0
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-2 text-center font-mono">3</td>
                      <td className="py-1.5 px-2 text-center font-mono font-bold">
                        C03
                      </td>
                      <td className="py-1.5 px-2 font-medium">
                        CVC 65/35 Cá Sấu 4 chiều
                      </td>
                      <td className="py-1.5 px-2">Xanh Navy</td>
                      <td className="py-1.5 px-2 text-right font-mono font-bold">
                        145.2
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-surface-secondary/40 font-bold border-t border-default">
                      <td colSpan={4} className="py-1.5 px-2 text-right">
                        Tổng cộng:
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono text-primary">
                        383.7 m (3 cây)
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Signatures */}
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
            </div>

            {/* Footer note */}
            <div className="text-[10px] text-muted text-center pt-4 border-t border-default/60 mt-4">
              * Quý khách vui lòng kiểm tra kỹ số lượng và chất lượng vải trước
              khi rời kho.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-default flex items-center justify-between bg-surface">
          <span className="text-xs text-muted">
            {PRINT_TEMPLATE_LABELS.FIXTURE_LABEL}{' '}
            <strong className="text-foreground">
              {PRINT_TEMPLATE_LABELS.FIXTURE_SHORT}
            </strong>
          </span>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={onClose}>
              {PRINT_TEMPLATE_LABELS.BTN_CANCEL}
            </Button>
            <Button
              size="sm"
              onClick={handleTestPrint}
              className="gap-2 font-bold"
            >
              <Icon name="Printer" size={16} />
              {PRINT_TEMPLATE_LABELS.BTN_TEST_PRINT}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
