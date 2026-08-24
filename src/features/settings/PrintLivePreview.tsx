import { QRCodeSVG } from 'qrcode.react';

import type { PrintSettingsFormValues } from '@/schema/company-settings.schema';
import { Button, Icon } from '@/shared/components';

import { SETTINGS_LABELS } from './settings.constants';

interface PrintLivePreviewProps {
  values: PrintSettingsFormValues;
  companyName?: string;
  logoUrl?: string;
  onTestPrint: () => void;
}

export function PrintLivePreview({
  values,
  companyName = 'CÔNG TY TNHH DỆT MAY VĨNH PHÁT',
  logoUrl = '/favicon.svg',
  onTestPrint,
}: PrintLivePreviewProps) {
  const isA4 = values.print_default_format === 'A4';
  const isA5 = values.print_default_format === 'A5_DOT_MATRIX';
  const isK80 = values.print_default_format === 'K80';

  return (
    <div className="flex flex-col gap-3 sticky top-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="Eye" size={16} className="text-primary" />
          <span className="text-sm font-bold text-foreground">
            {SETTINGS_LABELS.PRINT_LIVE_PREVIEW_TITLE}
          </span>
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {isA4 && 'Khổ A4 (210×297mm)'}
          {isA5 &&
            `In kim (${values.print_dot_matrix_width || '200mm'} × ${values.print_dot_matrix_height || '145mm'})`}
          {isK80 && 'In nhiệt K80 (80mm)'}
        </span>
      </div>

      {/* Scaled Preview Paper Canvas */}
      <div className="bg-surface-secondary border border-default rounded-xl p-4 flex items-center justify-center min-h-[380px] overflow-hidden shadow-inner">
        <div
          className={`bg-white text-slate-900 shadow-md transition-all duration-300 origin-top text-[10px] leading-snug select-none relative ${
            isA4 ? 'w-[280px] min-h-[396px] p-4' : ''
          } ${isA5 ? 'w-[330px] min-h-[232px] px-6 py-3 border border-black font-sans' : ''} ${
            isK80 ? 'w-[180px] min-h-[260px] p-2 font-mono text-[9px]' : ''
          }`}
          style={{
            transform: 'scale(0.92)',
          }}
        >
          {/* Tractor Feed Holes Visualizer for A5 Dot Matrix */}
          {isA5 && (
            <>
              {/* Left Sprocket Holes */}
              <div className="absolute left-1 top-0 bottom-0 flex flex-col justify-around py-2 pointer-events-none">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={`lh-${i}`}
                    className="w-2 h-2 rounded-full border border-slate-300 bg-slate-100 shadow-inner"
                  />
                ))}
              </div>
              {/* Left Perforation Line */}
              <div className="absolute left-4 top-0 bottom-0 border-r border-dashed border-slate-300 pointer-events-none" />

              {/* Right Sprocket Holes */}
              <div className="absolute right-1 top-0 bottom-0 flex flex-col justify-around py-2 pointer-events-none">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={`rh-${i}`}
                    className="w-2 h-2 rounded-full border border-slate-300 bg-slate-100 shadow-inner"
                  />
                ))}
              </div>
              {/* Right Perforation Line */}
              <div className="absolute right-4 top-0 bottom-0 border-r border-dashed border-slate-300 pointer-events-none" />
            </>
          )}

          {/* Header */}
          <div
            className={`pb-2 mb-2 flex items-start justify-between ${
              isA5 ? 'border-b border-black' : 'border-b border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {values.print_show_logo && (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className={`object-contain shrink-0 ${
                    isK80 ? 'w-5 h-5' : 'w-7 h-7'
                  }`}
                />
              )}
              <div>
                <div className="font-extrabold text-[10px] uppercase tracking-wide">
                  {companyName}
                </div>
                <div className="font-bold text-[11px] text-slate-800 uppercase">
                  PHIẾU XUẤT KHO
                </div>
              </div>
            </div>

            <div className="text-right text-[8px] text-slate-600">
              <div>Số: XK2604-0001</div>
              <div>02/04/2026</div>
            </div>
          </div>

          {/* Info Customer */}
          <div className="bg-slate-50 p-1.5 rounded mb-2 text-[8.5px] space-y-0.5 border border-slate-200">
            <div>
              <span className="text-slate-500">Khách:</span>{' '}
              <strong className="text-slate-800">Công ty May Á Đông</strong>
            </div>
            <div>
              <span className="text-slate-500">Giao tại:</span> 123 Đường Lê
              Lợi, Q.1, TP.HCM
            </div>
          </div>

          {/* Table Mockup */}
          <table className="w-full border-collapse mb-2 text-[8px]">
            <thead>
              <tr className="border-b border-slate-400 bg-slate-100 font-bold">
                <th className="py-0.5 px-1 text-left">STT</th>
                <th className="py-0.5 px-1 text-left">Loại vải</th>
                <th className="py-0.5 px-1 text-right">Mã cuộn</th>
                <th className="py-0.5 px-1 text-right">SL (m)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="py-0.5 px-1">1</td>
                <td className="py-0.5 px-1">Cotton 100% 2c</td>
                <td className="py-0.5 px-1 text-right">C01, C02</td>
                <td className="py-0.5 px-1 text-right font-bold">238.5</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="py-0.5 px-1">2</td>
                <td className="py-0.5 px-1">CVC 65/35 Cá Sấu</td>
                <td className="py-0.5 px-1 text-right">C03, C04</td>
                <td className="py-0.5 px-1 text-right font-bold">298.0</td>
              </tr>
            </tbody>
          </table>

          {/* Footer & QR */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-200 mt-auto">
            <div className="flex-1 pr-2">
              <div className="text-[7.5px] text-slate-500 italic">
                {values.print_footer_note ||
                  'Vui lòng kiểm tra hàng trước khi rời kho.'}
              </div>
            </div>
            {values.print_show_qr && (
              <div className="shrink-0 bg-white p-0.5 border border-slate-200 rounded">
                <QRCodeSVG
                  value="https://quantri.detmayvinhphat.com/verify/XK2604-0001"
                  size={28}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Test Print Action Button */}
      <Button
        type="button"
        variant="outline"
        className="w-full flex items-center justify-center gap-2 py-2.5 font-semibold text-foreground border-default hover:bg-surface-secondary"
        onClick={onTestPrint}
      >
        <Icon name="Printer" size={16} />
        {SETTINGS_LABELS.PRINT_BTN_TEST}
      </Button>
    </div>
  );
}
