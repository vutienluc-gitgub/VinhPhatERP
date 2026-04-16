import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';

import { usePortalQuotationDetail } from '@/application/crm/portal';
import { formatCurrency } from '@/shared/utils/format';
import { Button, Icon } from '@/shared/components';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';

export function PortalQuotationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { quotation, loading, error, acceptQuotation, rejectQuotation } =
    usePortalQuotationDetail(id!);
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  // States for Modals
  const [acceptSheetOpen, setAcceptSheetOpen] = useState(false);
  const [rejectSheetOpen, setRejectSheetOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    if (!quotation?.valid_until || quotation.status !== 'sent') return;

    const interval = setInterval(() => {
      const now = dayjs();
      const expiry = dayjs(quotation.valid_until);
      const diff = expiry.diff(now);

      if (diff <= 0) {
        setTimeLeft('Đã hết hạn');
        clearInterval(interval);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const mins = Math.floor((diff / (1000 * 60)) % 60);
        setTimeLeft(`${days > 0 ? `${days}n ` : ''}${hours}g ${mins}p`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [quotation]);

  if (loading)
    return <div className="portal-loading">Đang tải chi tiết báo giá…</div>;
  if (error || !quotation)
    return (
      <div className="portal-error">{error || 'Không tìm thấy dữ liệu'}</div>
    );

  const handleAcceptConfirm = async () => {
    setIsProcessing(true);
    const result = await acceptQuotation();
    setIsProcessing(false);
    if (result && result.success) {
      toast.success(
        'Đã chấp nhận báo giá. Chúng tôi sẽ sớm lên đơn hàng cho bạn.',
      );
      setAcceptSheetOpen(false);
    } else {
      toast.error(result?.error || 'Không thể chấp nhận báo giá');
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối.');
      return;
    }
    setIsProcessing(true);
    const result = await rejectQuotation(rejectReason);
    setIsProcessing(false);
    if (result && result.success) {
      toast.success('Đã phản hồi từ chối báo giá.');
      setRejectSheetOpen(false);
    } else {
      toast.error(result?.error || 'Không thể từ chối báo giá');
    }
  };

  const isExpired =
    quotation.valid_until && dayjs().isAfter(dayjs(quotation.valid_until));

  return (
    <div className="portal-section">
      <div className="mb-6 flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <Icon name="ArrowLeft" size={20} />
        </button>
        <h1 className="portal-page-title mb-0">
          Chi tiết báo giá {quotation.quotation_number}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="portal-card p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Icon name="List" size={20} className="text-primary" />
              Danh mục hàng hóa
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100">
                  <tr className="text-slate-500 uppercase text-[10px] tracking-wider">
                    <th className="text-left pb-3 font-medium">Sản phẩm</th>
                    <th className="text-center pb-3 font-medium">SL</th>
                    <th className="text-right pb-3 font-medium">Đơn giá</th>
                    <th className="text-right pb-3 font-medium">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {quotation.items?.map((item) => (
                    <tr
                      key={item.id}
                      className="group hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-4">
                        <div className="font-semibold text-slate-800">
                          {item.fabric_type}
                        </div>
                        <div className="text-xs text-slate-500">
                          {item.color_name || 'Mộc'}
                        </div>
                      </td>
                      <td className="py-4 text-center text-slate-600">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="py-4 text-right text-slate-600 font-medium">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="py-4 text-right font-bold text-slate-800">
                        {formatCurrency(item.amount)} đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {quotation.notes && (
            <div className="portal-card p-5 bg-blue-50/30 border-blue-100">
              <h3 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                <Icon name="Info" size={16} />
                Ghi chú / Điều khoản
              </h3>
              <p className="text-sm text-blue-800 whitespace-pre-wrap">
                {quotation.notes}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6">
          <div className="portal-card p-6 sticky top-4">
            <h2 className="text-lg font-bold mb-4">Tổng cộng</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-2xl font-black text-primary">
                <span>{formatCurrency(quotation.total_amount)} đ</span>
              </div>

              <div className="h-px bg-slate-100" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Ngày báo giá</span>
                  <span className="font-medium">
                    {dayjs(quotation.quotation_date).format('DD/MM/YYYY')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Hiệu lực đến</span>
                  <span
                    className={`font-medium ${isExpired ? 'text-red-500' : ''}`}
                  >
                    {quotation.valid_until
                      ? dayjs(quotation.valid_until).format('DD/MM/YYYY')
                      : 'Không hạn'}
                  </span>
                </div>
              </div>

              {timeLeft && quotation.status === 'sent' && (
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                  <div className="text-[10px] uppercase tracking-wider text-orange-600 font-bold mb-1">
                    Thời gian còn lại
                  </div>
                  <div className="text-xl font-black text-orange-700 font-mono">
                    {timeLeft}
                  </div>
                </div>
              )}

              <div className="pt-4 space-y-3">
                {quotation.status === 'sent' && !isExpired ? (
                  <>
                    <Button
                      variant="primary"
                      className="w-full h-12 text-lg font-bold shadow-md hover:shadow-lg transition-shadow"
                      onClick={() => setAcceptSheetOpen(true)}
                    >
                      <Icon name="CheckCircle" size={20} className="mr-2" />
                      Chấp nhận báo giá
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => setRejectSheetOpen(true)}
                    >
                      Từ chối báo giá
                    </Button>
                    <p className="text-[10px] text-slate-400 text-center italic mt-4">
                      Cam kết báo giá được bảo lưu trong thời gian hiệu lực.
                    </p>
                  </>
                ) : quotation.status === 'confirmed' ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                    <div className="text-green-700 font-bold mb-4 flex items-center gap-2">
                      <Icon name="CheckCircle2" size={24} />
                      Đã xác nhận đặt hàng
                    </div>
                    <div className="relative border-l-2 border-green-200 ml-3 space-y-6">
                      <div className="relative">
                        <div className="absolute -left-[21px] bg-green-500 w-3 h-3 rounded-full border-4 border-white"></div>
                        <div className="pl-4">
                          <h4 className="text-sm font-bold text-slate-800">
                            Báo giá được duyệt
                          </h4>
                          <p className="text-xs text-slate-500">
                            Chờ kinh doanh lên đơn
                          </p>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[21px] bg-slate-300 w-3 h-3 rounded-full border-4 border-white"></div>
                        <div className="pl-4">
                          <h4 className="text-sm font-bold text-slate-400">
                            Lên đơn hàng (SO)
                          </h4>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[21px] bg-slate-300 w-3 h-3 rounded-full border-4 border-white"></div>
                        <div className="pl-4">
                          <h4 className="text-sm font-bold text-slate-400">
                            Chuẩn bị sản xuất
                          </h4>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-lg text-center font-bold text-slate-500">
                    Báo giá này{' '}
                    {quotation.status === 'rejected'
                      ? 'đã bị từ chối'
                      : 'đã hết hiệu lực'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Accept Sheet */}
      <AdaptiveSheet
        open={acceptSheetOpen}
        onClose={() => setAcceptSheetOpen(false)}
        title="Xác nhận đặt hàng"
        maxWidth={500}
        footer={
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setAcceptSheetOpen(false)}
            >
              Quay lại
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleAcceptConfirm}
              disabled={!termsAccepted || isProcessing}
            >
              <Icon name="Check" size={18} className="mr-2" />
              {isProcessing ? 'Đang xử lý...' : 'Xác nhận'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-slate-700 py-2">
          <div className="bg-blue-50 text-blue-800 p-4 rounded-lg flex items-start gap-3">
            <Icon name="Info" size={20} className="mt-0.5 shrink-0" />
            <p className="text-sm">
              Bạn đang xác nhận chuyển đổi báo giá{' '}
              <strong>{quotation.quotation_number}</strong> thành đơn hàng chính
              thức với tổng giá trị{' '}
              <strong>{formatCurrency(quotation.total_amount)} đ</strong>.
            </p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors mt-6">
            <input
              type="checkbox"
              className="mt-1 w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
            />
            <span className="text-sm select-none">
              Tôi xác nhận đồng ý với các điều khoản, đơn giá và số lượng trong
              báo giá này.
            </span>
          </label>
        </div>
      </AdaptiveSheet>

      {/* Reject Sheet */}
      <AdaptiveSheet
        open={rejectSheetOpen}
        onClose={() => setRejectSheetOpen(false)}
        title="Từ chối báo giá"
        maxWidth={500}
        footer={
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setRejectSheetOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleRejectConfirm}
              disabled={isProcessing}
            >
              {isProcessing ? 'Đang xử lý...' : 'Xác nhận từ chối'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          <p className="text-sm text-slate-600">
            Vui lòng cho chúng tôi biết lý do bạn từ chối báo giá này để Vĩnh
            Phát có thể cải thiện chất lượng dịch vụ:
          </p>
          <textarea
            className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"
            rows={4}
            placeholder="Ví dụ: Đơn giá cao, thời gian giao hàng lâu..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </div>
      </AdaptiveSheet>
    </div>
  );
}
