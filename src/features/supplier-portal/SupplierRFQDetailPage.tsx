import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { Icon } from '@/shared/components';
import { usePublicRfqDetails } from '@/features/supplier-portal/hooks/useSupplierPortal';
import { SUPPLIER_PORTAL_LABELS } from '@/features/supplier-portal/supplier-portal.constants';
import { RFQViewer } from '@/features/supplier-portal/components/RFQViewer';
import { ChatWidget } from '@/features/chat';

export function SupplierRFQDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: rfq, isLoading, error } = usePublicRfqDetails(id ?? null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-muted">
          <Icon name="loader-2" className="w-8 h-8 animate-spin" />
          <p>Đang tải thông tin yêu cầu báo giá...</p>
        </div>
      </div>
    );
  }

  if (error || !rfq) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Icon name="XCircle" size={48} className="text-destructive mb-4" />
        <h2 className="text-lg font-bold text-foreground text-center">
          {SUPPLIER_PORTAL_LABELS.ERROR_NOT_FOUND}
        </h2>
        <p className="text-muted text-center mt-2 text-sm max-w-md">
          Liên kết có thể không chính xác hoặc yêu cầu báo giá này đã đóng. Vui
          lòng liên hệ với người phụ trách mua hàng.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="-m-4 md:-m-8">
        <RFQViewer
          rfq={rfq}
          isSuccess={isSuccess}
          onSuccess={() => setIsSuccess(true)}
        />
      </div>
      <ChatWidget entityType="quotation" entityId={rfq.id} />
    </>
  );
}
