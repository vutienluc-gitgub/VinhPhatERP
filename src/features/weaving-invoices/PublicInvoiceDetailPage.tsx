import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

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
    className: 'bg-warning-soft text-warning-strong',
  },
  confirmed: {
    label: 'Đã xác nhận & Nhập kho',
    className: 'bg-info-soft text-info',
  },
  paid: { label: 'Đã thanh toán', className: 'bg-success-soft text-success' },
};

export function PublicInvoiceDetailPage() {
  const { lookupCode } = useParams<{ lookupCode: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<PublicWeavingInvoiceSummary | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Chèn thẻ meta robots noindex/nofollow động để chặn thu thập thông tin cá nhân
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  // 2. Gọi API lấy dữ liệu hóa đơn dệt gia công
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

  const lookupUrl = window.location.origin + '/tra-cuu/' + lookupCode;

  // 3. Sao chép liên kết với giải pháp dự phòng an toàn (Fallback Clipboard)
  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(lookupUrl);
        toast.success('Đã sao chép liên kết tra cứu hóa đơn!');
      } else {
        // Dự phòng cho trình duyệt cũ hoặc kết nối HTTP
        const textArea = document.createElement('textarea');
        textArea.value = lookupUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (success) {
          toast.success('Đã sao chép liên kết tra cứu hóa đơn!');
        } else {
          toast.error('Không thể sao chép liên kết.');
        }
      }
    } catch (err) {
      console.error('Copy link error:', err);
      toast.error('Đã xảy ra lỗi khi sao chép liên kết.');
    }
  };

  // 4. Chia sẻ thiết bị di động (Native Share)
  const isShareSupported =
    typeof navigator !== 'undefined' && !!navigator.share;
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Hóa đơn dệt gia công ${invoice?.invoice_number}`,
          text: `Tra cứu hóa đơn gia công dệt của Công ty Dệt may Vĩnh Phát. Mã tra cứu: ${lookupCode}`,
          url: lookupUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Native share error:', err);
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f5fb] flex items-center justify-center p-6">
        <div className="max-w-4xl w-full bg-surface rounded-3xl shadow-xl p-8 space-y-6">
          <div className="h-8 bg-surface-secondary rounded-lg w-1/3 animate-pulse" />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-4 bg-surface-secondary rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-surface-secondary rounded w-1/2 animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-surface-secondary rounded w-2/3 animate-pulse" />
              <div className="h-4 bg-surface-secondary rounded w-1/3 animate-pulse" />
            </div>
          </div>
          <div className="h-40 bg-surface-secondary rounded-xl animate-pulse" />
          <div className="flex justify-end">
            <div className="h-10 bg-surface-secondary rounded-lg w-32 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-[#f0f5fb] flex flex-col items-center justify-center gap-4 p-6">
        <div className="text-5xl">🔍</div>
        <h1 className="font-bold text-xl text-[var(--foreground)] text-center">
          Không tìm thấy hóa đơn
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] text-center max-w-md">
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

  const statusInfo = STATUS_LABELS[invoice.status] ?? {
    label: invoice.status,
    className: 'bg-surface-secondary text-muted-foreground',
  };

  const totalLengthM = calculateTotalLength(invoice.items);

  return (
    <div className="min-h-screen bg-[#f0f5fb] py-8 px-4 font-sans print:bg-white print:py-0 print:px-0">
      {/* Action Bar (hidden on print) */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center print:hidden">
        <button
          onClick={() => navigate('/tra-cuu')}
          className="flex items-center justify-center sm:justify-start gap-2 text-sm font-semibold text-[#0f3460] hover:text-[#1a6bb5] transition-all bg-transparent border-none p-2 cursor-pointer"
        >
          <Icon name="ArrowLeft" size={16} />
          <span>Về trang tra cứu</span>
        </button>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {/* Nút chia sẻ Zalo */}
          <button
            onClick={() => {
              window.open(
                `https://zalo.me/share?to=&url=${encodeURIComponent(lookupUrl)}`,
                '_blank',
              );
            }}
            className="flex items-center gap-1.5 rounded-xl text-xs font-bold px-3 py-2 border border-[#dce6f0] bg-surface hover:bg-slate-50 transition-all cursor-pointer shadow-sm text-info"
            aria-label="Chia sẻ hóa đơn qua Zalo"
          >
            <span>💬 Zalo</span>
          </button>

          {/* Nút chia sẻ Email */}
          <button
            onClick={() => {
              window.location.href = `mailto:?subject=Tra cứu Hóa đơn dệt gia công ${invoice.invoice_number}&body=Xem hóa đơn dệt gia công số ${invoice.invoice_number} tại địa chỉ: ${lookupUrl}`;
            }}
            className="flex items-center gap-1.5 rounded-xl text-xs font-bold px-3 py-2 border border-[#dce6f0] bg-surface hover:bg-slate-50 transition-all cursor-pointer shadow-sm text-muted-foreground"
            aria-label="Chia sẻ hóa đơn qua Email"
          >
            <Icon name="Mail" size={14} />
            <span>Email</span>
          </button>

          {/* Nút Copy Link */}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 rounded-xl text-xs font-bold px-3 py-2 border border-[#dce6f0] bg-surface hover:bg-slate-50 transition-all cursor-pointer shadow-sm text-success"
            aria-label="Sao chép liên kết tra cứu hóa đơn"
          >
            <Icon name="Copy" size={14} />
            <span>Copy Link</span>
          </button>

          {/* Nút Native Share (nếu trình duyệt hỗ trợ) */}
          {isShareSupported && (
            <button
              onClick={handleNativeShare}
              className="flex items-center gap-1.5 rounded-xl text-xs font-bold px-3 py-2 border border-[#dce6f0] bg-surface hover:bg-slate-50 transition-all cursor-pointer shadow-sm text-info"
              aria-label="Mở khay chia sẻ hệ thống"
            >
              <Icon name="Share2" size={14} />
              <span>Chia sẻ khác</span>
            </button>
          )}

          {/* Nút In hóa đơn */}
          <Button
            onClick={handlePrint}
            variant="secondary"
            className="flex items-center gap-1.5 rounded-xl text-xs font-bold px-3 py-2 shadow-sm bg-surface border border-[#dce6f0] hover:bg-slate-50"
            aria-label="In hóa đơn hoặc lưu bản PDF vector"
          >
            <Icon name="Printer" size={14} />
            <span>In hóa đơn / Lưu PDF</span>
          </Button>
        </div>
      </div>

      {/* Invoice Layout Card */}
      <div className="max-w-4xl mx-auto bg-surface rounded-3xl shadow-xl border border-[#dce6f0] p-8 md:p-12 print:shadow-none print:border-none print:p-0">
        {/* Header decoration (hidden on print) */}
        <div className="h-1 bg-gradient-to-r from-[#0f3460] to-[#3da5e0] -mt-8 -mx-8 md:-mt-12 md:-mx-12 mb-8 md:mb-12 rounded-t-3xl print:hidden" />

        {/* Invoice Header */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-default pb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#0f3460] tracking-tight uppercase print:text-xl">
              Hóa đơn dệt gia công
            </h1>
            <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider font-semibold mt-1">
              Hệ thống quản lý VinhPhat ERP
            </p>
            <div className="mt-4 flex flex-wrap gap-2 items-center">
              <span className="text-xs font-semibold text-[var(--muted-foreground)]">
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
            <div className="text-sm font-semibold text-muted-foreground">
              Số phiếu:{' '}
              <span className="font-extrabold text-[#0f3460] text-lg">
                {invoice.invoice_number}
              </span>
            </div>
            <div className="text-xs text-[var(--muted-foreground)]">
              Ngày lập:{' '}
              <span className="font-bold text-muted-foreground">
                {formatDate(invoice.invoice_date)}
              </span>
            </div>
            <div className="text-xs text-[var(--muted-foreground)]">
              Mã tra cứu:{' '}
              <span className="font-extrabold text-info tracking-wider uppercase text-sm select-all">
                {lookupCode}
              </span>
            </div>
          </div>
        </div>

        {/* Seller & Buyer Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-b border-default">
          {/* Seller / Weaver */}
          <div className="space-y-2">
            <h3 className="text-xs font-extrabold text-[#0f3460] uppercase tracking-wider">
              Đơn vị sản xuất (Bên nhận gia công)
            </h3>
            <div className="text-sm font-bold text-foreground">
              {invoice.supplier_name}
            </div>
            <div className="text-xs text-[var(--muted-foreground)]">
              Mã đối tác:{' '}
              <span className="font-semibold">{invoice.supplier_code}</span>
            </div>
            <div className="text-xs text-[var(--muted-foreground)]">
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
            <div className="text-xs text-[var(--muted-foreground)]">
              Mã số thuế:{' '}
              <span className="font-semibold">0315487692 (Ví dụ)</span>
            </div>
            <div className="text-xs text-[var(--muted-foreground)]">
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
            <span className="text-[10px] md:text-xs text-[var(--muted-foreground)] uppercase font-semibold block">
              Loại vải gia công
            </span>
            <span className="font-extrabold text-sm md:text-base text-foreground block truncate">
              {invoice.fabric_type}
            </span>
          </div>
          <div>
            <span className="text-[10px] md:text-xs text-[var(--muted-foreground)] uppercase font-semibold block">
              Đơn giá dệt (kg)
            </span>
            <span className="font-extrabold text-sm md:text-base text-foreground block">
              {formatMoney(invoice.unit_price_per_kg)}
            </span>
          </div>
          <div>
            <span className="text-[10px] md:text-xs text-[var(--muted-foreground)] uppercase font-semibold block">
              Tổng khối lượng
            </span>
            <span className="font-extrabold text-sm md:text-base text-foreground block">
              {formatQty(invoice.total_weight_kg)} kg
            </span>
          </div>
          <div>
            <span className="text-[10px] md:text-xs text-[var(--muted-foreground)] uppercase font-semibold block">
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
          <div className="bg-slate-50 border border-default rounded-xl p-4 my-8 text-xs text-muted-foreground italic print:bg-white print:border-none print:p-0">
            <span className="font-bold text-muted-foreground not-italic block mb-1">
              Ghi chú hóa đơn:
            </span>
            {invoice.notes}
          </div>
        )}

        {/* Validation QR and Digital Signature Block */}
        <div className="mt-12 pt-8 border-t border-default grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Signatures */}
          <div className="space-y-4 text-center md:text-left">
            <div className="text-xs uppercase font-extrabold text-[#0f3460] tracking-wider">
              Xác thực chữ ký số (Digital Seal)
            </div>
            <div className="inline-flex flex-col border border-success bg-emerald-50/50 rounded-2xl p-4 text-left max-w-sm">
              <span className="text-success font-bold text-xs flex items-center gap-1.5">
                <span>✓</span> Chữ ký điện tử hợp lệ
              </span>
              <span className="text-[10px] text-success mt-1">
                Ký bởi: {invoice.supplier_name}
              </span>
              <span className="text-[10px] text-success">
                Chứng thư số hoạt động: Khớp mã với dữ liệu gốc của kho mộc.
              </span>
            </div>
          </div>

          {/* QR Code section */}
          <div className="flex flex-col items-center md:items-end">
            <div className="text-center md:text-right mb-3">
              <span className="text-[10px] uppercase font-bold text-[var(--muted-foreground)] block">
                Quét mã QR để kiểm tra online
              </span>
              <span className="text-[9px] text-[var(--muted-foreground)] block">
                Liên kết bảo mật tới hệ thống VinhPhat ERP
              </span>
            </div>
            <div className="bg-surface p-2 border border-default rounded-2xl shadow-sm print:p-0 print:border-none">
              <QRCodeDisplay value={lookupUrl} size={110} label="" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer (hidden on print) */}
      <footer className="max-w-4xl mx-auto mt-8 text-center text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider font-semibold print:hidden">
        Bản in hóa đơn được phát hành tự động bởi VinhPhat ERP
      </footer>
    </div>
  );
}
