import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { toast } from 'react-hot-toast';

import { usePortalQuotationDetail } from '@/application/crm/portal';
import { MoneyText } from '@/shared/value';
import { Button, Icon } from '@/shared/components';

import { QuotationAcceptSheet } from './QuotationAcceptSheet';
import { QuotationRejectSheet } from './QuotationRejectSheet';

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
          className="p-2 hover:bg-surface-secondary rounded-full transition-colors"
          aria-label="Quay lại"
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
              <Icon name="List" size={20} className="text-foreground" />
              Danh mục hàng hóa
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-default">
                  <tr className="text-muted-foreground uppercase text-[10px] tracking-wider">
                    <th className="text-left pb-3 font-medium">Sản phẩm</th>
                    <th className="text-center pb-3 font-medium">SL</th>
                    <th className="text-right pb-3 font-medium">Đơn giá</th>
                    <th className="text-right pb-3 font-medium">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {quotation.items?.map((item) => (
                    <tr
                      key={item.id}
                      className="group hover:bg-surface-secondary/50 transition-colors"
                    >
                      <td className="py-4">
                        <div className="font-semibold text-foreground">
                          {item.fabric_type}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.color_name || 'Mộc'}
                        </div>
                      </td>
                      <td className="py-4 text-center text-muted-foreground">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="py-4 text-right text-muted-foreground font-medium">
                        <MoneyText value={item.unit_price} suffix="" />
                      </td>
                      <td className="py-4 text-right font-bold text-foreground">
                        <MoneyText value={item.amount} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {quotation.notes && (
            <div className="portal-card p-5 bg-info-soft/30 border-info">
              <h3 className="text-sm font-bold text-info mb-2 flex items-center gap-2">
                <Icon name="Info" size={16} />
                Ghi chú / Điều khoản
              </h3>
              <p className="text-sm text-info whitespace-pre-wrap">
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
              <div className="flex justify-between items-center text-2xl font-black text-foreground">
                <span>
                  <MoneyText value={quotation.total_amount} />
                </span>
              </div>

              <div className="h-px bg-surface-secondary" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ngày báo giá</span>
                  <span className="font-medium">
                    {dayjs(quotation.quotation_date).format('DD/MM/YYYY')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Hiệu lực đến</span>
                  <span
                    className={`font-medium ${isExpired ? 'text-danger' : ''}`}
                  >
                    {quotation.valid_until
                      ? dayjs(quotation.valid_until).format('DD/MM/YYYY')
                      : 'Không hạn'}
                  </span>
                </div>
              </div>

              {timeLeft && quotation.status === 'sent' && (
                <div className="p-3 bg-warning-soft rounded-lg border border-warning">
                  <div className="text-[10px] uppercase tracking-wider text-warning font-bold mb-1">
                    Thời gian còn lại
                  </div>
                  <div className="text-xl font-black text-warning-strong font-mono">
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
                      className="w-full text-danger border-danger hover:bg-danger-soft"
                      onClick={() => setRejectSheetOpen(true)}
                    >
                      Từ chối báo giá
                    </Button>
                    <p className="text-[10px] text-muted-foreground text-center italic mt-4">
                      Cam kết báo giá được bảo lưu trong thời gian hiệu lực.
                    </p>
                  </>
                ) : quotation.status === 'confirmed' ? (
                  <div className="bg-success-soft border border-success rounded-lg p-5">
                    <div className="text-success font-bold mb-4 flex items-center gap-2">
                      <Icon name="CheckCircle2" size={24} />
                      Đã xác nhận đặt hàng
                    </div>
                    <div className="relative border-l-2 border-success ml-3 space-y-6">
                      <div className="relative">
                        <div className="absolute -left-[21px] bg-success-soft w-3 h-3 rounded-full border-4 border-transparent" />
                        <div className="pl-4">
                          <h4 className="text-sm font-bold text-foreground">
                            Báo giá được duyệt
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Chờ kinh doanh lên đơn
                          </p>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[21px] bg-surface-strong w-3 h-3 rounded-full border-4 border-transparent" />
                        <div className="pl-4">
                          <h4 className="text-sm font-bold text-muted-foreground">
                            Lên đơn hàng (SO)
                          </h4>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[21px] bg-surface-strong w-3 h-3 rounded-full border-4 border-transparent" />
                        <div className="pl-4">
                          <h4 className="text-sm font-bold text-muted-foreground">
                            Chuẩn bị sản xuất
                          </h4>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-surface-secondary rounded-lg text-center font-bold text-muted-foreground">
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

      {/* Accept Sheet Sub-component */}
      <QuotationAcceptSheet
        open={acceptSheetOpen}
        onClose={() => setAcceptSheetOpen(false)}
        quotationNumber={quotation.quotation_number}
        totalAmount={quotation.total_amount}
        onConfirm={handleAcceptConfirm}
        isProcessing={isProcessing}
      />

      {/* Reject Sheet Sub-component */}
      <QuotationRejectSheet
        open={rejectSheetOpen}
        onClose={() => setRejectSheetOpen(false)}
        reason={rejectReason}
        onReasonChange={setRejectReason}
        onConfirm={handleRejectConfirm}
        isProcessing={isProcessing}
      />
    </div>
  );
}
