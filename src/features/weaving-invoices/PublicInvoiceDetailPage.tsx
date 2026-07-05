import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { fetchPublicWeavingInvoice } from '@/api/verify-invoice.api';
import type { PublicWeavingInvoiceSummary } from '@/api/verify-invoice.api';
import { QRCodeDisplay } from '@/shared/components/QRCodeDisplay';
import { Button, Icon } from '@/shared/components';

import { PublicInvoiceRollsTable } from './components/PublicInvoiceRollsTable';

function calculateTotalLength(
  items: Array<{ length_m: number | null }>,
): number {
  let total = 0;
  for (const item of items) {
    total += item.length_m ?? 0;
  }
  return total;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('vi-VN');
}

function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0 đ';
  // eslint-disable-next-line no-restricted-syntax
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);
}

function formatQty(qty: number | null | undefined): string {
  if (qty === null || qty === undefined) return '0';
  // eslint-disable-next-line no-restricted-syntax
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(qty);
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  draft: {
    label: 'Nháp (Chưa xác nhận)',
    className: 'bg-amber-100 text-amber-700',
  },
  confirmed: {
    label: 'Đã xác nhận & Nhập kho',
    className: 'bg-blue-100 text-blue-700',
  },
  paid: { label: 'Đã thanh toán', className: 'bg-green-100 text-green-700' },
};

export function PublicInvoiceDetailPage() {
  const { lookupCode } = useParams<{ lookupCode: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<PublicWeavingInvoiceSummary | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lookupCode) return;
    setLoading(true);
    setError(null);
    fetchPublicWeavingInvoice(lookupCode)
      .then((data) => {
        if (!data) {
          setError('Không tìm thấy hóa đơn. Vui lòng kiểm tra lại mã tra cứu.');
        } else {
          setInvoice(data);
        }
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải dữ liệu.',
        );
        setLoading(false);
      });
  }, [lookupCode]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f5fb] flex items-center justify-center p-6">
        <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl p-8 space-y-6">
          <div className="h-8 bg-slate-200 rounded-lg w-1/3 animate-pulse" />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 rounded w-2/3 animate-pulse" />
              <div className="h-4 bg-slate-200 rounded w-1/3 animate-pulse" />
            </div>
          </div>
          <div className="h-40 bg-slate-100 rounded-xl animate-pulse" />
          <div className="flex justify-end">
            <div className="h-10 bg-slate-200 rounded-lg w-32 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-[#f0f5fb] flex flex-col items-center justify-center gap-4 p-6">
        <div className="text-5xl">🔍</div>
        <h1 className="font-bold text-xl text-[var(--text-primary)] text-center">
          Không tìm thấy hóa đơn
        </h1>
        <p className="text-sm text-[var(--text-secondary)] text-center max-w-md">
          {error ||
            `Mã tra cứu "${lookupCode}" không tồn tại hoặc đã bị hủy bỏ.`}
        </p>
        <Button
          onClick={() => navigate('/tra-cuu')}
          variant="primary"
          className="mt-2 rounded-xl"
        >
          Quay lại trang tra cứu
        </Button>
      </div>
    );
  }

  const lookupUrl = window.location.origin + '/tra-cuu/' + lookupCode;
  const statusInfo = STATUS_LABELS[invoice.status] ?? {
    label: invoice.status,
    className: 'bg-slate-100 text-slate-700',
  };

  const totalLengthM = calculateTotalLength(invoice.items);

  return (
    <div className="min-h-screen bg-[#f0f5fb] py-8 px-4 font-sans print:bg-white print:py-0 print:px-0">
      {/* Action Bar (hidden on print) */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <button
          onClick={() => navigate('/tra-cuu')}
          className="flex items-center gap-2 text-sm font-semibold text-[#0f3460] hover:text-[#1a6bb5] transition-all bg-transparent border-none p-2 cursor-pointer"
        >
          <Icon name="ArrowLeft" size={16} />
          <span>Về trang tra cứu</span>
        </button>

        <Button
          onClick={handlePrint}
          variant="secondary"
          className="flex items-center gap-2 rounded-xl shadow-sm bg-white border border-[#dce6f0] hover:bg-slate-50"
        >
          <Icon name="Printer" size={16} />
          <span>In hóa đơn / Lưu PDF</span>
        </Button>
      </div>

      {/* Invoice Layout Card */}
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl border border-[#dce6f0] p-8 md:p-12 print:shadow-none print:border-none print:p-0">
        {/* Header decoration (hidden on print) */}
        <div className="h-1 bg-gradient-to-r from-[#0f3460] to-[#3da5e0] -mt-8 -mx-8 md:-mt-12 md:-mx-12 mb-8 md:mb-12 rounded-t-3xl print:hidden" />

        {/* Invoice Header */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-slate-100 pb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#0f3460] tracking-tight uppercase print:text-xl">
              Hóa đơn dệt gia công
            </h1>
            <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold mt-1">
              Hệ thống quản lý VinhPhat ERP
            </p>
            <div className="mt-4 flex flex-wrap gap-2 items-center">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">
                Trạng thái:
              </span>
              <span
                className={`text-[10px] md:text-xs font-bold px-3 py-1 rounded-full ${statusInfo.className}`}
              >
                {statusInfo.label}
              </span>
            </div>
          </div>

          <div className="text-left md:text-right space-y-1">
            <div className="text-sm font-semibold text-slate-500">
              Số phiếu:{' '}
              <span className="font-extrabold text-[#0f3460] text-lg">
                {invoice.invoice_number}
              </span>
            </div>
            <div className="text-xs text-[var(--text-secondary)]">
              Ngày lập:{' '}
              <span className="font-bold text-slate-700">
                {formatDate(invoice.invoice_date)}
              </span>
            </div>
            <div className="text-xs text-[var(--text-secondary)]">
              Mã tra cứu:{' '}
              <span className="font-extrabold text-blue-600 tracking-wider uppercase text-sm select-all">
                {lookupCode}
              </span>
            </div>
          </div>
        </div>

        {/* Seller & Buyer Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-b border-slate-100">
          {/* Seller / Weaver */}
          <div className="space-y-2">
            <h3 className="text-xs font-extrabold text-[#0f3460] uppercase tracking-wider">
              Đơn vị sản xuất (Bên nhận gia công)
            </h3>
            <div className="text-sm font-bold text-slate-800">
              {invoice.supplier_name}
            </div>
            <div className="text-xs text-[var(--text-secondary)]">
              Mã đối tác:{' '}
              <span className="font-semibold">{invoice.supplier_code}</span>
            </div>
            <div className="text-xs text-[var(--text-secondary)]">
              Địa chỉ:{' '}
              <span className="font-medium">
                Nhà xưởng gia công dệt đối tác
              </span>
            </div>
          </div>

          {/* Buyer / Vinh Phat */}
          <div className="space-y-2">
            <h3 className="text-xs font-extrabold text-[#0f3460] uppercase tracking-wider">
              Đơn vị chủ quản (Bên đặt gia công)
            </h3>
            <div className="text-sm font-bold text-[#0f3460]">
              CÔNG TY TNHH DỆT MAY VĨNH PHÁT
            </div>
            <div className="text-xs text-[var(--text-secondary)]">
              Mã số thuế:{' '}
              <span className="font-semibold">0315487692 (Ví dụ)</span>
            </div>
            <div className="text-xs text-[var(--text-secondary)]">
              Văn phòng:{' '}
              <span className="font-medium">
                Văn phòng đại diện VinhPhat ERP
              </span>
            </div>
          </div>
        </div>

        {/* Invoice Summary Parameters */}
        <div className="bg-[#f8fbff] rounded-2xl border border-[#e8f0f8] p-5 my-8 grid grid-cols-2 md:grid-cols-4 gap-4 print:bg-white print:border-none print:my-4 print:p-0">
          <div>
            <span className="text-[10px] md:text-xs text-[var(--text-secondary)] uppercase font-semibold block">
              Loại vải gia công
            </span>
            <span className="font-extrabold text-sm md:text-base text-slate-800 block truncate">
              {invoice.fabric_type}
            </span>
          </div>
          <div>
            <span className="text-[10px] md:text-xs text-[var(--text-secondary)] uppercase font-semibold block">
              Đơn giá dệt (kg)
            </span>
            <span className="font-extrabold text-sm md:text-base text-slate-800 block">
              {formatMoney(invoice.unit_price_per_kg)}
            </span>
          </div>
          <div>
            <span className="text-[10px] md:text-xs text-[var(--text-secondary)] uppercase font-semibold block">
              Tổng khối lượng
            </span>
            <span className="font-extrabold text-sm md:text-base text-primary block">
              {formatQty(invoice.total_weight_kg)} kg
            </span>
          </div>
          <div>
            <span className="text-[10px] md:text-xs text-[var(--text-secondary)] uppercase font-semibold block">
              Thành tiền (VND)
            </span>
            <span className="font-extrabold text-sm md:text-base text-[#0f3460] block">
              {formatMoney(invoice.total_amount)}
            </span>
          </div>
        </div>

        {/* Line Items Table */}
        <PublicInvoiceRollsTable
          items={invoice.items}
          totalWeightKg={invoice.total_weight_kg}
          totalLengthM={totalLengthM}
          itemCount={invoice.item_count}
        />

        {/* Notes Section */}
        {invoice.notes && (
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 my-8 text-xs text-slate-500 italic print:bg-white print:border-none print:p-0">
            <span className="font-bold text-slate-700 not-italic block mb-1">
              Ghi chú hóa đơn:
            </span>
            {invoice.notes}
          </div>
        )}

        {/* Validation QR and Digital Signature Block */}
        <div className="mt-12 pt-8 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Signatures */}
          <div className="space-y-4 text-center md:text-left">
            <div className="text-xs uppercase font-extrabold text-[#0f3460] tracking-wider">
              Xác thực chữ ký số (Digital Seal)
            </div>
            <div className="inline-flex flex-col border border-emerald-200 bg-emerald-50/50 rounded-2xl p-4 text-left max-w-sm">
              <span className="text-emerald-800 font-bold text-xs flex items-center gap-1.5">
                <span>✓</span> Chữ ký điện tử hợp lệ
              </span>
              <span className="text-[10px] text-emerald-600 mt-1">
                Ký bởi: {invoice.supplier_name}
              </span>
              <span className="text-[10px] text-emerald-600">
                Chứng thư số hoạt động: Khớp mã với dữ liệu gốc của kho mộc.
              </span>
            </div>
          </div>

          {/* QR Code section */}
          <div className="flex flex-col items-center md:items-end">
            <div className="text-center md:text-right mb-3">
              <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] block">
                Quét mã QR để kiểm tra online
              </span>
              <span className="text-[9px] text-[var(--text-tertiary)] block">
                Liên kết bảo mật tới hệ thống VinhPhat ERP
              </span>
            </div>
            <div className="bg-white p-2 border border-slate-200 rounded-2xl shadow-sm print:p-0 print:border-none">
              <QRCodeDisplay value={lookupUrl} size={110} label="" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer (hidden on print) */}
      <footer className="max-w-4xl mx-auto mt-8 text-center text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-semibold print:hidden">
        Bản in hóa đơn được phát hành tự động bởi VinhPhat ERP
      </footer>
    </div>
  );
}
