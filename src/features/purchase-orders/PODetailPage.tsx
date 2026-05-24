import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { Badge, Button } from '@/shared/components';
import type { PurchaseOrder } from '@/domain/purchase-orders';
import {
  useApprovePurchaseOrder,
  useRejectPurchaseOrder,
} from '@/application/purchase-orders';

import { usePODetailData } from './hooks/usePODetailData';
import { GoodsReceiptForm } from './GoodsReceiptForm';
import { POTimeline } from './components/detail/POTimeline';
import { POInfoCard } from './components/detail/POInfoCard';
import { POActionsCard } from './components/detail/POActionsCard';
import { POMaterialsTable } from './components/detail/POMaterialsTable';
import { POGoodsReceiptsList } from './components/detail/POGoodsReceiptsList';
import { PORejectModal } from './components/detail/PORejectModal';

export function PODetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showGrForm, setShowGrForm] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const {
    po,
    poLoading,
    receipts,
    receiptsLoading,
    globalMaterials,
    creatorProfile,
  } = usePODetailData(id);

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

  if (poLoading || receiptsLoading) {
    return (
      <div className="page-container w-full max-w-[1680px] px-6 py-8 md:px-8 mx-auto space-y-8 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-200 rounded w-24"></div>
        </div>
        <div className="h-32 bg-gray-200 rounded-xl w-full"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-64 bg-gray-200 rounded-xl lg:col-span-2"></div>
          <div className="h-64 bg-gray-200 rounded-xl lg:col-span-1"></div>
        </div>
        <div className="h-64 bg-gray-200 rounded-xl w-full"></div>
      </div>
    );
  }

  if (!po) {
    return (
      <div className="p-8 text-center text-red-500">Không tìm thấy PO.</div>
    );
  }

  return (
    <div className="page-container w-full max-w-[1680px] px-6 py-8 md:px-8 mx-auto space-y-8">
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

      <POTimeline status={po.status} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <POInfoCard po={po} creatorProfile={creatorProfile} />
        <POActionsCard
          po={po}
          isApproving={approveMutation.isPending}
          onApprove={handleApprove}
          onRejectClick={() => setShowRejectModal(true)}
          onOpenGrForm={() => setShowGrForm(true)}
        />
      </div>

      <POMaterialsTable po={po} globalMaterials={globalMaterials} />

      <POGoodsReceiptsList
        po={po}
        receipts={receipts}
        onOpenForm={() => setShowGrForm(true)}
      />

      {showGrForm && (
        <GoodsReceiptForm
          po={po as PurchaseOrder}
          onClose={() => setShowGrForm(false)}
        />
      )}

      {showRejectModal && (
        <PORejectModal
          rejectReason={rejectReason}
          setRejectReason={setRejectReason}
          isPending={rejectMutation.isPending}
          onClose={() => {
            setShowRejectModal(false);
            setRejectReason('');
          }}
          onConfirm={handleReject}
        />
      )}
    </div>
  );
}

// Force Vite HMR
export default PODetailPage;
