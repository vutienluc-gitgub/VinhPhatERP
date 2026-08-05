import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { untypedDb } from '@/services/supabase/client';
import { Icon } from '@/shared/components';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  usePublicPoDetails,
  useConfirmPublicPo,
  useRejectPublicPo,
} from '@/features/supplier-portal/hooks/useSupplierPortal';
import { POViewer } from '@/features/supplier-portal/components/POViewer';
import { POComments } from '@/features/supplier-portal/components/POComments';
import { ChatWidget } from '@/features/chat';

export function SupplierPODetailPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const supplierId = profile?.supplier_id;

  // 1. Fetch public token for the given PO ID
  const {
    data: token,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['supplier-po-token', id, supplierId],
    queryFn: async () => {
      if (!id || !supplierId) return null;

      const { data, error } = await untypedDb
        .from('purchase_orders')
        .select('public_token')
        .eq('id', id)
        .eq('supplier_id', supplierId)
        .single();

      if (error) throw error;
      return data?.public_token as string;
    },
    enabled: !!id && !!supplierId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-muted">
          <Icon name="loader-2" className="w-8 h-8 animate-spin" />
          <p>Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Icon name="XCircle" size={48} className="text-destructive mb-4" />
        <h2 className="text-lg font-bold text-foreground text-center">
          Không tìm thấy đơn hàng
        </h2>
        <p className="text-muted text-center mt-2 text-sm max-w-md">
          Đơn hàng không tồn tại hoặc bạn không có quyền truy cập.
        </p>
      </div>
    );
  }

  // 2. Reuse the public page logic by tricking it into thinking it's on the public route
  // We can just render a wrapper component that uses the token.
  return <PODetailWithToken token={token} />;
}

// Extract a component to reuse POViewer without polluting the URL params
function PODetailWithToken({ token }: { token: string }) {
  const { data: po, isLoading, error, refetch } = usePublicPoDetails(token);
  const confirmMutation = useConfirmPublicPo();
  const rejectMutation = useRejectPublicPo();

  const handleConfirm = async () => {
    try {
      await confirmMutation.mutateAsync({ token });
      refetch();
    } catch (err) {
      console.error('[ConfirmError]', err);
    }
  };

  const handleReject = async (reason: string) => {
    try {
      await rejectMutation.mutateAsync({ token, reason });
      refetch();
    } catch (err) {
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
          Lỗi tải thông tin Đơn hàng
        </h2>
      </div>
    );
  }

  return (
    <>
      <POViewer
        po={po}
        onConfirm={handleConfirm}
        onReject={handleReject}
        isConfirming={confirmMutation.isPending}
        isRejecting={rejectMutation.isPending}
        commentsElement={<POComments token={token} />}
      />
      <ChatWidget entityType="purchase_order" entityId={po.id} />
    </>
  );
}
