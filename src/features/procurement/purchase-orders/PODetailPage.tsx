import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { Badge, Button } from '@/shared/components';
import { useAuth } from '@/shared/hooks/useAuth';
import type { PurchaseOrder } from '@/domain/purchase-orders';
import {
  useApprovePurchaseOrder,
  useRejectPurchaseOrder,
  useSubmitPurchaseOrder,
  useRequestChangesPurchaseOrder,
  useApprovalPolicies,
  useSendPurchaseOrder,
  useConfirmPurchaseOrder,
} from '@/application/purchase-orders';
import { PO_CONSTANTS } from '@/features/procurement/purchase-orders/purchase-orders.constants';

import { usePODetailData } from './hooks/usePODetailData';
import { GoodsReceiptForm } from './GoodsReceiptForm';
import { POTimeline } from './components/detail/POTimeline';
import { POInfoCard } from './components/detail/POInfoCard';
import { POActionsCard } from './components/detail/POActionsCard';
import { POMaterialsTable } from './components/detail/POMaterialsTable';
import { POGoodsReceiptsList } from './components/detail/POGoodsReceiptsList';
import { PORejectModal } from './components/detail/PORejectModal';
import { POApproveModal } from './components/detail/POApproveModal';
import { POApprovalHistory } from './components/detail/POApprovalHistory';
import { POTemplate } from './components/detail/POTemplate';
import { exportPurchaseOrderPdf } from './utils/exportPOPdf';

export function PODetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showGrForm, setShowGrForm] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [isRequestChanges, setIsRequestChanges] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approveComment, setApproveComment] = useState('');

  const {
    po,
    poLoading,
    receipts,
    receiptsLoading,
    globalMaterials,
    creatorProfile,
    auditLogs,
    auditLogsLoading,
  } = usePODetailData(id);

  const { user } = useAuth();
  const { data: policies } = useApprovalPolicies();
  const approveMutation = useApprovePurchaseOrder();
  const rejectMutation = useRejectPurchaseOrder();
  const submitMutation = useSubmitPurchaseOrder();
  const requestChangesMutation = useRequestChangesPurchaseOrder();
  const sendMutation = useSendPurchaseOrder();
  const confirmMutation = useConfirmPurchaseOrder();

  const canApprove = (() => {
    if (!user || !policies || !po) return false;
    const policy = policies.find((p) => p.role === user.role);
    if (!policy) return false;
    if (policy.max_amount === null || policy.max_amount === undefined)
      return true; // Unlimited
    return po.total_amount <= policy.max_amount;
  })();

  const handleSubmit = async () => {
    if (!po) return;
    try {
      await submitMutation.mutateAsync(po.id);
      toast.success(PO_CONSTANTS.MSG_SUBMIT_SUCCESS);
    } catch (err) {
      toast.error(
        PO_CONSTANTS.MSG_SUBMIT_FAIL +
          (err instanceof Error ? err.message : String(err)),
      );
    }
  };

  const handleApprove = async (sendImmediately: boolean) => {
    if (!po) return;
    try {
      await approveMutation.mutateAsync({
        id: po.id,
        comment: approveComment,
        sendImmediately,
      });
      toast.success(
        sendImmediately
          ? PO_CONSTANTS.MSG_APPROVE_SEND_SUCCESS
          : PO_CONSTANTS.MSG_APPROVE_SUCCESS,
      );
      setShowApproveModal(false);
      setApproveComment('');
    } catch (err) {
      toast.error(
        PO_CONSTANTS.MSG_APPROVE_FAIL +
          (err instanceof Error ? err.message : String(err)),
      );
    }
  };

  const handleSend = async () => {
    if (!po) return;
    try {
      await sendMutation.mutateAsync(po.id);
      toast.success(PO_CONSTANTS.MSG_SEND_SUCCESS);
    } catch (err) {
      toast.error(
        PO_CONSTANTS.MSG_SEND_FAIL +
          (err instanceof Error ? err.message : String(err)),
      );
    }
  };

  const handleConfirm = async () => {
    if (!po) return;
    try {
      await confirmMutation.mutateAsync(po.id);
      toast.success(PO_CONSTANTS.MSG_CONFIRM_SUCCESS);
    } catch (err) {
      toast.error(
        PO_CONSTANTS.MSG_CONFIRM_FAIL +
          (err instanceof Error ? err.message : String(err)),
      );
    }
  };

  const handleRejectOrRequestChanges = async () => {
    if (!po || !rejectReason.trim()) return;
    try {
      if (isRequestChanges) {
        await requestChangesMutation.mutateAsync({
          id: po.id,
          reason: rejectReason,
        });
        toast.success(PO_CONSTANTS.MSG_REQUEST_CHANGES_SUCCESS);
      } else {
        await rejectMutation.mutateAsync({ id: po.id, reason: rejectReason });
        toast.success(PO_CONSTANTS.MSG_REJECT_SUCCESS);
      }
      setShowRejectModal(false);
      setRejectReason('');
    } catch (err) {
      toast.error(
        PO_CONSTANTS.MSG_ACTION_FAIL +
          (err instanceof Error ? err.message : String(err)),
      );
    }
  };

  const openRejectModal = (requestChanges = false) => {
    setIsRequestChanges(requestChanges);
    setShowRejectModal(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    if (!po) return;
    try {
      toast.loading('Đang xuất PDF...', { id: 'po-pdf' });
      await exportPurchaseOrderPdf(
        'po-print-template',
        `PurchaseOrder_${po.po_code}`,
      );
      toast.success('Xuất PDF thành công', { id: 'po-pdf' });
    } catch (err) {
      toast.error(
        'Lỗi khi xuất PDF: ' +
          (err instanceof Error ? err.message : String(err)),
        {
          id: 'po-pdf',
        },
      );
    }
  };

  if (poLoading || receiptsLoading || auditLogsLoading) {
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
      <div className="p-8 text-center text-red-500">
        {PO_CONSTANTS.MSG_PO_NOT_FOUND}
      </div>
    );
  }

  return (
    <div className="page-container w-full max-w-[1680px] px-6 py-8 md:px-8 mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold m-0 flex items-center gap-3">
            {PO_CONSTANTS.MSG_PO_DETAIL_TITLE} {po.po_code}
            <Badge
              variant={
                po.status === 'completed'
                  ? 'success'
                  : po.status === 'approved'
                    ? 'info'
                    : po.status === 'rejected'
                      ? 'danger'
                      : po.status === 'pending_approval'
                        ? 'warning'
                        : 'gray'
              }
            >
              {po.status}
            </Badge>
          </h1>
          <p className="text-muted mt-1">
            {PO_CONSTANTS.MSG_SUPPLIER_PREFIX} {po.supplier_name_snapshot}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/purchase-orders')}>
          {PO_CONSTANTS.MSG_BACK}
        </Button>
      </div>

      <POTimeline status={po.status} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <POInfoCard po={po} creatorProfile={creatorProfile} />
        <POActionsCard
          po={po}
          isApproving={approveMutation.isPending}
          isSubmitting={submitMutation.isPending}
          isSending={sendMutation.isPending}
          isConfirming={confirmMutation.isPending}
          canApprove={canApprove}
          onSubmit={handleSubmit}
          onApproveClick={() => setShowApproveModal(true)}
          onRejectClick={() => openRejectModal(false)}
          onRequestChangesClick={() => openRejectModal(true)}
          onOpenGrForm={() => setShowGrForm(true)}
          onPrint={handlePrint}
          onExportPdf={handleExportPdf}
          onSendClick={handleSend}
          onConfirmClick={handleConfirm}
        />
      </div>

      <POMaterialsTable po={po} globalMaterials={globalMaterials} />

      <POGoodsReceiptsList
        po={po}
        receipts={receipts}
        onOpenForm={() => setShowGrForm(true)}
      />

      <POApprovalHistory logs={auditLogs || []} />

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
          isPending={
            isRequestChanges
              ? requestChangesMutation.isPending
              : rejectMutation.isPending
          }
          onClose={() => {
            setShowRejectModal(false);
            setRejectReason('');
          }}
          onConfirm={handleRejectOrRequestChanges}
          isRequestChanges={isRequestChanges}
        />
      )}

      {showApproveModal && (
        <POApproveModal
          approveComment={approveComment}
          setApproveComment={setApproveComment}
          isPending={approveMutation.isPending}
          onClose={() => {
            setShowApproveModal(false);
            setApproveComment('');
          }}
          onConfirm={handleApprove}
        />
      )}

      {/* Hidden container for A4 PDF/Print template */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <POTemplate
          po={po}
          globalMaterials={globalMaterials}
          creatorProfile={creatorProfile}
        />
      </div>
    </div>
  );
}

// Force Vite HMR
export default PODetailPage;
