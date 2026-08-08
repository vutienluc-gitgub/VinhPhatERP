import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import {
  usePublicPoDetails,
  useConfirmPublicPo,
  useRejectPublicPo,
} from '@/features/supplier-portal/hooks/useSupplierPortal';
import { SUPPLIER_PORTAL_LABELS } from '@/features/supplier-portal/supplier-portal.constants';
import { Icon } from '@/shared/components';
import { POComments } from '@/features/supplier-portal/components/POComments';
import { POViewer } from '@/features/supplier-portal/components/POViewer';

const TEXT = SUPPLIER_PORTAL_LABELS;

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

  const handleConfirm = async () => {
    if (!token) return;
    try {
      await confirmMutation.mutateAsync({ token });
      toast.success(TEXT.PO_CONFIRM_SUCCESS);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : TEXT.PO_CONFIRM_ERROR);
      console.error('[ConfirmError]', err);
    }
  };

  const handleReject = async (reason: string) => {
    if (!token || !reason.trim()) return;
    try {
      await rejectMutation.mutateAsync({ token, reason: reason.trim() });
      toast.success(TEXT.PO_REJECT_SUCCESS);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : TEXT.PO_REJECT_ERROR);
      console.error('[RejectError]', err);
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
          {TEXT.PO_PUBLIC_NOT_FOUND_TITLE}
        </h2>
        <p className="text-muted-foreground text-center mt-2 text-sm max-w-md">
          {TEXT.PO_PUBLIC_NOT_FOUND_DESC}
        </p>
      </div>
    );
  }

  return (
    <POViewer
      po={po}
      onConfirm={handleConfirm}
      onReject={handleReject}
      isConfirming={confirmMutation.isPending}
      isRejecting={rejectMutation.isPending}
      commentsElement={<POComments token={token!} />}
    />
  );
}
