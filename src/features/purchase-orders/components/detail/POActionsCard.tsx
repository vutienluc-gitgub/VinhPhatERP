import { Button, Icon } from '@/shared/components';
import type { PurchaseOrder } from '@/domain/purchase-orders';
import { useAuth } from '@/shared/hooks/useAuth';

interface POActionsCardProps {
  po: PurchaseOrder;
  isApproving: boolean;
  onApprove: () => void;
  onRejectClick: () => void;
  onOpenGrForm: () => void;
}

export function POActionsCard({
  po,
  isApproving,
  onApprove,
  onRejectClick,
  onOpenGrForm,
}: POActionsCardProps) {
  const { user } = useAuth();

  return (
    <div className="bg-surface border border-border rounded-xl p-6 shadow-sm lg:col-span-1">
      <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
        <h3 className="font-semibold text-lg m-0">Thao tác</h3>
      </div>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="w-full justify-center">
            <Icon name="Printer" size={16} className="mr-2" /> In PO
          </Button>
          <Button variant="outline" className="w-full justify-center">
            <Icon name="Download" size={16} className="mr-2" /> Xuất PDF
          </Button>
        </div>

        {po.status === 'draft' &&
          (user?.role === 'admin' || user?.role === 'manager') && (
            <div className="grid grid-cols-2 gap-3 mt-1">
              <Button
                variant="primary"
                isLoading={isApproving}
                onClick={onApprove}
                className="w-full justify-center"
              >
                <Icon name="Check" size={16} className="mr-2" /> Duyệt PO
              </Button>
              <Button
                variant="danger"
                onClick={onRejectClick}
                className="w-full justify-center"
              >
                <Icon name="XCircle" size={16} className="mr-2" /> Hủy/Từ chối
              </Button>
            </div>
          )}
        {(po.status === 'approved' || po.status === 'partial_received') &&
          (user?.role === 'admin' ||
            user?.role === 'manager' ||
            user?.role === 'staff') && (
            <div className="mt-1 pt-3 border-t border-border">
              <Button
                variant="primary"
                className="w-full justify-center py-2"
                onClick={onOpenGrForm}
              >
                <Icon name="Plus" size={16} className="mr-2" /> Tạo phiếu nhập
                kho (GR)
              </Button>
            </div>
          )}
      </div>
    </div>
  );
}
