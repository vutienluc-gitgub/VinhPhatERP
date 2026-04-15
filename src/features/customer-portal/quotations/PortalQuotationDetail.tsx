import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';

import { usePortalQuotationDetail } from '@/features/customer-portal/hooks/usePortalQuotations';
import { formatCurrency } from '@/shared/utils/format';
import { Button, Icon } from '@/shared/components';

export function PortalQuotationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { quotation, loading, error, acceptQuotation, rejectQuotation } =
    usePortalQuotationDetail(id!);
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

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

  const handleAccept = async () => {
    if (
      !window.confirm(
        'Bạn đồng ý với các điều khoản và đơn giá trong báo giá này?',
      )
    )
      return;
    setIsProcessing(true);
    const result = await acceptQuotation();
    setIsProcessing(false);
    if (result && result.success) {
      toast.success(
        'Đã chấp nhận báo giá. Chúng tôi sẽ sớm lên đơn hàng cho bạn.',
      );
    } else {
      toast.error(result?.error || 'Không thể chấp nhận báo giá');
    }
  };

  const handleReject = async () => {
    const reason = window.prompt(
      'Vui lòng cho biết lý do bạn từ chối báo giá này:',
    );
    if (reason === null) return;
    setIsProcessing(true);
    const result = await rejectQuotation(reason);
    setIsProcessing(false);
    if (result && result.success) {
      toast.success('Đã phản hồi từ chối báo giá.');
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
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
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
                <thead className="border-b border-gray-100">
                  <tr className="text-gray-500 uppercase text-[10px] tracking-wider">
                    <th className="text-left pb-3 font-medium">Sản phẩm</th>
                    <th className="text-center pb-3 font-medium">SL</th>
                    <th className="text-right pb-3 font-medium">Đơn giá</th>
                    <th className="text-right pb-3 font-medium">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {quotation.items?.map((item) => (
                    <tr
                      key={item.id}
                      className="group hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="py-4">
                        <div className="font-semibold text-gray-800">
                          {item.fabric_type}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.color_name || 'Mộc'}
                        </div>
                      </td>
                      <td className="py-4 text-center text-gray-600">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="py-4 text-right text-gray-600 font-medium">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="py-4 text-right font-bold text-gray-800">
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

              <div className="h-px bg-gray-100" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Ngày báo giá</span>
                  <span className="font-medium">
                    {dayjs(quotation.quotation_date).format('DD/MM/YYYY')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Hiệu lực đến</span>
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
                      className="w-full h-12 text-lg"
                      onClick={handleAccept}
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Đang xử lý...' : 'Chấp nhận báo giá'}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full text-red-600 border-red-200 hover:bg-red-50"
                      onClick={handleReject}
                      disabled={isProcessing}
                    >
                      Từ chối
                    </Button>
                  </>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg text-center font-bold text-gray-500">
                    Báo giá này{' '}
                    {quotation.status === 'confirmed'
                      ? 'đã được chấp nhận'
                      : quotation.status === 'rejected'
                        ? 'đã bị từ chối'
                        : 'đã hết hiệu lực'}
                  </div>
                )}
              </div>

              <p className="text-[10px] text-gray-400 text-center italic mt-4">
                Bằng việc nhấn "Chấp nhận", bạn đồng ý chuyển báo giá này thành
                yêu cầu đặt hàng chính thức.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
