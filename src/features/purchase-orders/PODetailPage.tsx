import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

import {
  usePurchaseOrder,
  useGoodsReceiptsByPo,
  useApprovePurchaseOrder,
  useRejectPurchaseOrder,
} from '@/application/purchase-orders';
import { Badge, Button } from '@/shared/components';
import { formatCurrency } from '@/shared/utils/format';
import type {
  PurchaseOrderItem,
  GoodsReceipt,
  GoodsReceiptItem,
  PurchaseOrder,
} from '@/domain/purchase-orders';
import { useAuth } from '@/shared/hooks/useAuth';

import { GoodsReceiptForm } from './GoodsReceiptForm';

export function PODetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showGrForm, setShowGrForm] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const { user } = useAuth();

  const { data: po, isLoading: poLoading } = usePurchaseOrder(id);
  const { data: receipts = [], isLoading: receiptsLoading } =
    useGoodsReceiptsByPo(id);

  const approveMutation = useApprovePurchaseOrder();
  const rejectMutation = useRejectPurchaseOrder();

  const handleApprove = async () => {
    if (!po) return;
    try {
      await approveMutation.mutateAsync(po.id);
      toast.success('Duyệt đơn đặt hàng thành công');
    } catch (err) {
      toast.error(
        'Duyệt thất bại: ' + (err instanceof Error ? err.message : String(err)),
      );
    }
  };

  const handleReject = async () => {
    if (!po || !rejectReason.trim()) return;
    try {
      await rejectMutation.mutateAsync({ id: po.id, reason: rejectReason });
      toast.success('Từ chối đơn đặt hàng thành công');
      setShowRejectModal(false);
      setRejectReason('');
    } catch (err) {
      toast.error(
        'Từ chối thất bại: ' +
          (err instanceof Error ? err.message : String(err)),
      );
    }
  };

  if (poLoading || receiptsLoading)
    return <div className="p-8 text-center">Đang tải...</div>;
  if (!po)
    return (
      <div className="p-8 text-center text-red-500">Không tìm thấy PO.</div>
    );

  return (
    <div className="page-container p-4 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold m-0 flex items-center gap-3">
            Chi tiết Đơn đặt hàng {po.po_code}
            <Badge
              variant={
                po.status === 'completed'
                  ? 'success'
                  : po.status === 'approved'
                    ? 'info'
                    : po.status === 'rejected'
                      ? 'danger'
                      : 'gray'
              }
            >
              {po.status}
            </Badge>
          </h1>
          <p className="text-muted mt-1">NCC: {po.supplier_name_snapshot}</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/purchase-orders')}>
          Trở về
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-lg border-b border-border pb-3 mb-4 m-0">
            Thông tin chung
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted">Ngày đặt:</span>
              <span className="font-medium">
                {dayjs(po.order_date).format('DD/MM/YYYY')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Ngày dự kiến giao:</span>
              <span className="font-medium">
                {po.expected_date
                  ? dayjs(po.expected_date).format('DD/MM/YYYY')
                  : '---'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Tổng tiền:</span>
              <span className="font-medium text-primary text-lg">
                {formatCurrency(po.total_amount)} đ
              </span>
            </div>
            {po.status === 'rejected' && po.rejection_reason && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                <span className="font-bold">Lý do từ chối:</span>{' '}
                {po.rejection_reason}
              </div>
            )}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
            <h3 className="font-semibold text-lg m-0">Thao tác</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {po.status === 'draft' &&
              (user?.role === 'admin' || user?.role === 'manager') && (
                <>
                  <Button
                    variant="primary"
                    isLoading={approveMutation.isPending}
                    onClick={handleApprove}
                  >
                    Duyệt PO
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setShowRejectModal(true)}
                  >
                    Từ chối
                  </Button>
                </>
              )}
            {(po.status === 'approved' || po.status === 'partial_received') &&
              (user?.role === 'admin' ||
                user?.role === 'manager' ||
                user?.role === 'staff') && (
                <Button variant="primary" onClick={() => setShowGrForm(true)}>
                  + Nhập kho (Goods Receipt)
                </Button>
              )}
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-gray-50/50">
          <h3 className="font-semibold text-lg m-0">Danh sách nguyên liệu</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-sm text-muted bg-gray-50">
                <th className="p-3">Nguyên liệu</th>
                <th className="p-3 text-right">Đơn giá</th>
                <th className="p-3 text-right">SL Đặt</th>
                <th className="p-3 text-right">Đã nhận</th>
                <th className="p-3 text-right">Còn lại</th>
                <th className="p-3 text-center">Tiến độ</th>
              </tr>
            </thead>
            <tbody>
              {po.items?.map((item: PurchaseOrderItem) => {
                const percent = item.ordered_qty
                  ? Math.round((item.received_qty / item.ordered_qty) * 100)
                  : 0;
                return (
                  <tr
                    key={item.id}
                    className="border-b border-border last:border-0 hover:bg-gray-50/50"
                  >
                    <td className="p-3 font-medium">{item.material_id}</td>
                    <td className="p-3 text-right">
                      {formatCurrency(item.unit_price)} đ
                    </td>
                    <td className="p-3 text-right">
                      {item.ordered_qty} {item.uom}
                    </td>
                    <td className="p-3 text-right text-green-600 font-medium">
                      {item.received_qty} {item.uom}
                    </td>
                    <td className="p-3 text-right text-orange-600 font-medium">
                      {item.remaining_qty} {item.uom}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2 justify-end">
                        <div className="w-16 h-2 bg-gray-200 rounded overflow-hidden">
                          <div
                            className={`h-full ${percent >= 100 ? 'bg-green-500' : 'bg-orange-400'}`}
                            style={{ width: `${Math.min(100, percent)}%` }}
                          />
                        </div>
                        <span className="text-xs w-8 text-right">
                          {percent}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden mt-6">
        <div className="p-4 border-b border-border bg-gray-50/50">
          <h3 className="font-semibold text-lg m-0">
            Lịch sử Nhập Kho (Goods Receipts)
          </h3>
        </div>
        {receipts.length === 0 ? (
          <div className="p-8 text-center text-muted">
            Chưa có phiếu nhập kho nào.
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {receipts.map(
              (
                gr: GoodsReceipt & { goods_receipt_items: GoodsReceiptItem[] },
              ) => (
                <div
                  key={gr.id}
                  className="border border-border rounded-lg p-4"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold text-primary">
                      {gr.receipt_code}
                    </span>
                    <span className="text-sm text-muted">
                      Ngày nhập: {dayjs(gr.received_date).format('DD/MM/YYYY')}
                    </span>
                  </div>
                  <div className="text-sm">
                    {gr.goods_receipt_items?.map((item: GoodsReceiptItem) => (
                      <div
                        key={item.id}
                        className="flex justify-between py-1 border-b border-border/50 last:border-0"
                      >
                        <span>Ref ID: {item.po_item_id}</span>
                        <span className="font-medium text-green-600">
                          +{item.received_qty}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>

      {showGrForm && po && (
        <GoodsReceiptForm
          po={po as PurchaseOrder}
          onClose={() => setShowGrForm(false)}
        />
      )}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-border p-6 max-w-md w-full space-y-4">
            <h3 className="font-semibold text-lg text-gray-900 m-0">
              Từ chối Đơn đặt hàng
            </h3>
            <p className="text-sm text-gray-500">
              Vui lòng nhập lý do từ chối đơn đặt hàng này để phản hồi cho nhân
              viên phụ trách.
            </p>
            <div className="form-field">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                Lý do từ chối <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do từ chối..."
                className="field-input min-h-[100px] w-full p-2 border border-border rounded-lg"
                rows={3}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
              >
                Hủy
              </Button>
              <Button
                variant="danger"
                disabled={!rejectReason.trim() || rejectMutation.isPending}
                isLoading={rejectMutation.isPending}
                onClick={handleReject}
              >
                Xác nhận từ chối
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Force Vite HMR
export default PODetailPage;
