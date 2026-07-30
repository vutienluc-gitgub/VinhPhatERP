import { useState } from 'react';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';

import {
  usePublicPoDetails,
  useConfirmPublicPo,
  useRejectPublicPo,
} from '@/features/supplier-portal/hooks/useSupplierPortal';
import { Icon, Button } from '@/shared/components';
import { MoneyText } from '@/shared/value';
import { POComments } from '@/features/supplier-portal/components/POComments';

export function SupplierPOPage() {
  const { id: token } = useParams<{ id: string }>();
  const {
    data: po,
    isLoading,
    error,
    refetch,
  } = usePublicPoDetails(token ?? null);
  const confirmMutation = useConfirmPublicPo();
  const rejectMutation = useRejectPublicPo();

  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleConfirm = async () => {
    if (!token) return;
    try {
      await confirmMutation.mutateAsync({ token });
      refetch();
    } catch {
      // Error handled by mutation
    }
  };

  const handleReject = async () => {
    if (!token || !rejectReason.trim()) return;
    try {
      await rejectMutation.mutateAsync({ token, reason: rejectReason.trim() });
      refetch();
    } catch {
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-3xl w-full space-y-6">
          <div className="h-24 bg-surface-secondary rounded-xl animate-pulse" />
          <div className="h-48 bg-surface-secondary rounded-xl animate-pulse" />
          <div className="h-64 bg-surface-secondary rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !po) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Icon name="XCircle" size={48} className="text-destructive mb-4" />
        <h2 className="text-lg font-bold text-foreground text-center">
          Không tìm thấy thông tin Đơn đặt hàng
        </h2>
        <p className="text-muted text-center mt-2 text-sm max-w-md">
          Liên kết có thể không chính xác hoặc đơn hàng không tồn tại.
        </p>
      </div>
    );
  }

  const isActionable = po.status === 'sent';
  const isConfirmedBySupplier = po.status === 'supplier_confirmed';
  const isRejectedBySupplier = po.status === 'supplier_rejected';
  const isCanceled = ['rejected', 'cancelled'].includes(po.status);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Header */}
      <div className="bg-[#0f3460] text-white py-6 px-4 md:px-8">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold mb-1">
              ĐƠN ĐẶT HÀNG {po.po_code}
            </h1>
            <p className="text-info text-sm">Vinh Phát Hưng</p>
          </div>
          {isConfirmedBySupplier && (
            <div className="bg-success/20 text-success-light px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
              <Icon name="CheckCircle" size={16} /> Đã xác nhận
            </div>
          )}
          {isRejectedBySupplier && (
            <div className="bg-red-500/20 text-red-200 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
              <Icon name="XCircle" size={16} /> Đã từ chối
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6 -mt-4">
        {/* Confirmed banner */}
        {isConfirmedBySupplier && po.confirmed_at && (
          <div className="bg-success-soft border border-success/30 rounded-xl p-4 text-center">
            <div className="w-12 h-12 bg-success text-white rounded-full flex items-center justify-center mx-auto mb-3">
              <Icon name="Check" size={24} />
            </div>
            <h3 className="text-success-strong font-bold text-lg mb-1">
              Đơn hàng đã được xác nhận
            </h3>
            <p className="text-success-strong/80 text-sm">
              Lúc {dayjs(po.confirmed_at).format('HH:mm - DD/MM/YYYY')}
            </p>
          </div>
        )}

        {/* Rejected by supplier banner */}
        {isRejectedBySupplier && (
          <div className="bg-danger-soft border border-danger/30 rounded-xl p-5 text-center">
            <div className="w-12 h-12 bg-danger text-white rounded-full flex items-center justify-center mx-auto mb-3">
              <Icon name="X" size={24} />
            </div>
            <h3 className="text-danger font-bold text-lg mb-2">
              Bạn đã từ chối đơn hàng này
            </h3>
            {po.confirmed_at && (
              <p className="text-danger/70 text-sm">
                Lúc {dayjs(po.confirmed_at).format('HH:mm - DD/MM/YYYY')}
              </p>
            )}
          </div>
        )}

        {/* Canceled by ERP */}
        {isCanceled && (
          <div className="bg-danger-soft border border-danger/30 rounded-xl p-4 text-center">
            <h3 className="text-danger font-bold text-lg mb-1">
              Đơn hàng đã bị hủy hoặc từ chối
            </h3>
          </div>
        )}

        {/* PO Info */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-5 md:p-6 relative z-10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted mb-4 border-b border-border pb-2">
            THÔNG TIN CHUNG
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted mb-1">Nhà cung cấp</p>
              <p className="font-semibold text-foreground">
                {po.supplier_name}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">Ngày đặt</p>
              <p className="font-semibold">
                {dayjs(po.order_date).format('DD/MM/YYYY')}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-muted mb-1">Tổng cộng (VND)</p>
              <p className="font-bold text-lg text-primary">
                <MoneyText value={po.total_amount} />
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {po.notes && (
          <div className="bg-white rounded-xl shadow-sm border border-border p-5 md:p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted mb-4 border-b border-border pb-2">
              GHI CHÚ TỪ NGƯỜI MUA
            </h2>
            <p className="whitespace-pre-wrap text-sm">{po.notes}</p>
          </div>
        )}

        {/* Items */}
        <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="p-5 md:p-6 border-b border-border">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted">
              DANH SÁCH MẶT HÀNG
            </h2>
          </div>
          <div className="divide-y divide-border">
            {po.items.map((item, index) => (
              <div
                key={item.id}
                className="p-4 md:p-6 hover:bg-slate-50 transition-colors"
              >
                <div className="flex justify-between gap-4 mb-2">
                  <h3 className="font-semibold text-foreground">
                    {index + 1}. {item.material_name}
                  </h3>
                  <div className="text-right">
                    <p className="font-bold">
                      <MoneyText value={item.line_total} />
                    </p>
                  </div>
                </div>
                <div className="flex justify-between text-sm text-muted">
                  <span>
                    Số lượng:{' '}
                    <span className="font-medium text-foreground">
                      {item.order_qty} {item.uom}
                    </span>
                  </span>
                  <span>
                    Đơn giá:{' '}
                    <span className="font-medium text-foreground">
                      <MoneyText value={item.unit_price} />
                    </span>
                  </span>
                </div>
                {item.notes && (
                  <p className="text-xs text-muted italic mt-2 bg-slate-50 p-2 rounded">
                    {item.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA: Confirm + Reject */}
        {isActionable && (
          <div className="bg-white rounded-xl shadow-sm border border-border p-5 md:p-6">
            <h3 className="font-semibold mb-2 text-center">
              Phản hồi đơn hàng
            </h3>
            <p className="text-sm text-muted mb-5 text-center">
              Vui lòng kiểm tra kỹ thông tin đơn hàng, số lượng và đơn giá trước
              khi phản hồi.
            </p>

            {!showRejectForm ? (
              <div className="space-y-3">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full justify-center text-lg font-bold py-6"
                  onClick={handleConfirm}
                  isLoading={confirmMutation.isPending}
                >
                  <Icon name="CheckCircle" size={20} className="mr-2" />
                  XÁC NHẬN ĐƠN ĐẶT HÀNG
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full justify-center text-danger border-danger/30 hover:bg-danger-soft"
                  onClick={() => setShowRejectForm(true)}
                >
                  <Icon name="XCircle" size={18} className="mr-2" />
                  Không thể đáp ứng
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-danger-soft/50 border border-danger/20 rounded-lg p-4">
                  <label
                    htmlFor="reject-reason"
                    className="block text-sm font-semibold text-danger mb-2"
                  >
                    Lý do không thể đáp ứng{' '}
                    <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="reject-reason"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="VD: Không đủ hàng tồn kho, sai giá, sai ngày giao..."
                    rows={3}
                    className="w-full border border-danger/30 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-danger/50 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="w-full justify-center"
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectReason('');
                    }}
                  >
                    Quay lại
                  </Button>
                  <Button
                    variant="danger"
                    className="w-full justify-center"
                    onClick={handleReject}
                    isLoading={rejectMutation.isPending}
                    disabled={!rejectReason.trim()}
                  >
                    <Icon name="Send" size={16} className="mr-2" />
                    Gửi phản hồi
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Chat / Comments */}
        <POComments token={token!} />
      </div>
    </div>
  );
}
