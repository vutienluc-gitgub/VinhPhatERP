import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { Icon } from '@/shared/components';

import { usePublicRfqDetails } from './hooks/useSupplierPortal';
import { SUPPLIER_PORTAL_LABELS } from './supplier-portal.constants';
import { RFQViewer } from './components/RFQViewer';

const TEXT = SUPPLIER_PORTAL_LABELS;

export function SupplierQuotePage() {
  const { id } = useParams<{ id: string }>();
  const { data: rfq, isLoading, error } = usePublicRfqDetails(id ?? null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full space-y-6">
          <div className="h-24 bg-surface-secondary rounded-xl animate-pulse" />
          <div className="h-48 bg-surface-secondary rounded-xl animate-pulse" />
          <div className="h-64 bg-surface-secondary rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !rfq) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Icon name="XCircle" size={48} className="text-destructive mb-4" />
        <h2 className="text-lg font-bold text-foreground text-center">
          {TEXT.ERROR_NOT_FOUND}
        </h2>
        <p className="text-muted text-center mt-2 text-sm max-w-md">
          {TEXT.LINK_INVALID_DESC}
        </p>
      </div>
    );
  }

  return (
    <RFQViewer
      rfq={rfq}
      isSuccess={isSuccess}
      onSuccess={() => setIsSuccess(true)}
    />
  );
}
