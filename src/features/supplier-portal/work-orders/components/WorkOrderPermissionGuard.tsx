import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import type { WorkOrderCapabilities } from '@/types/work-orders';
import { ErrorInline } from '@/shared/components/ErrorInline';
import { useWorkOrder } from '@/features/supplier-portal/work-orders/hooks/useWorkOrder';

interface WorkOrderPermissionGuardProps {
  workOrderId: string | undefined;
  children: (capabilities: WorkOrderCapabilities) => ReactNode;
}

export function WorkOrderPermissionGuard({
  workOrderId,
  children,
}: WorkOrderPermissionGuardProps) {
  const { workOrder, isLoading, isError, statePayload } =
    useWorkOrder(workOrderId);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-10 w-1/3 bg-surface-secondary rounded"></div>
        <div className="h-[400px] w-full bg-surface-secondary rounded"></div>
      </div>
    );
  }

  if (isError || !workOrder || !statePayload) {
    return (
      <div className="p-6 text-center">
        <ErrorInline>
          Lỗi tải dữ liệu lệnh gia công hoặc bạn không có quyền truy cập.
        </ErrorInline>
      </div>
    );
  }

  if (!statePayload.capabilities.canView) {
    return <Navigate to="/portal/supplier/work-orders" replace />;
  }

  return <>{children(statePayload.capabilities)}</>;
}
