import { Button, Icon } from '@/shared/components';
import type { PurchaseOrder } from '@/domain/purchase-orders';
import { useAuth } from '@/shared/hooks/useAuth';
import { PO_CONSTANTS } from '@/features/procurement/purchase-orders/purchase-orders.constants';

interface POActionsCardProps {
  po: PurchaseOrder;
  isApproving: boolean;
  isSubmitting: boolean;
  isSending: boolean;
  isConfirming: boolean;
  canApprove: boolean;
  onSubmit: () => void;
  onApproveClick: () => void;
  onRejectClick: () => void;
  onRequestChangesClick: () => void;
  onOpenGrForm: () => void;
  onPrint: () => void;
  onExportPdf: () => void;
  onSendClick: () => void;
  onConfirmClick: () => void;
}

export function POActionsCard({
  po,
  isApproving,
  isSubmitting,
  isSending,
  isConfirming,
  canApprove,
  onSubmit,
  onApproveClick,
  onRejectClick,
  onRequestChangesClick,
  onOpenGrForm,
  onPrint,
  onExportPdf,
  onSendClick,
  onConfirmClick,
}: POActionsCardProps) {
  const { user } = useAuth();

  return (
    <div className="bg-surface border border-border rounded-xl p-6 shadow-sm lg:col-span-1">
      <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
        <h3 className="font-semibold text-lg m-0">
          {PO_CONSTANTS.APPROVAL_ACTION}
        </h3>
      </div>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={onPrint}
            className="w-full justify-center"
          >
            <Icon name="Printer" size={16} className="mr-2" />{' '}
            {PO_CONSTANTS.APPROVAL_PRINT_PO}
          </Button>
          <Button
            variant="outline"
            onClick={onExportPdf}
            className="w-full justify-center"
          >
            <Icon name="Download" size={16} className="mr-2" />{' '}
            {PO_CONSTANTS.APPROVAL_EXPORT_PDF}
          </Button>
        </div>

        {po.status === 'draft' &&
          (user?.role === 'admin' ||
            user?.role === 'manager' ||
            user?.role === 'staff') && (
            <div className="mt-1">
              <Button
                variant="primary"
                isLoading={isSubmitting}
                onClick={onSubmit}
                className="w-full justify-center"
              >
                <Icon name="Send" size={16} className="mr-2" />{' '}
                {PO_CONSTANTS.APPROVAL_SUBMIT}
              </Button>
            </div>
          )}

        {po.status === 'pending_approval' && (
          <div className="grid grid-cols-1 gap-3 mt-1">
            {canApprove ? (
              <Button
                variant="primary"
                isLoading={isApproving}
                onClick={onApproveClick}
                className="w-full justify-center"
              >
                <Icon name="Check" size={16} className="mr-2" />{' '}
                {PO_CONSTANTS.APPROVAL_APPROVE}
              </Button>
            ) : (
              <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100 flex gap-2">
                <Icon
                  name="AlertCircle"
                  size={16}
                  className="shrink-0 mt-0.5"
                />
                {PO_CONSTANTS.APPROVAL_OVER_LIMIT}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={onRequestChangesClick}
                className="w-full justify-center"
              >
                {PO_CONSTANTS.APPROVAL_REQUEST_CHANGES}
              </Button>
              <Button
                variant="danger"
                onClick={onRejectClick}
                className="w-full justify-center"
              >
                {PO_CONSTANTS.APPROVAL_REJECT}
              </Button>
            </div>
          </div>
        )}

        {po.status === 'approved' &&
          (user?.role === 'admin' ||
            user?.role === 'manager' ||
            user?.role === 'staff') && (
            <div className="mt-1">
              <Button
                variant="primary"
                isLoading={isSending}
                onClick={onSendClick}
                className="w-full justify-center"
              >
                <Icon name="Send" size={16} className="mr-2" />{' '}
                {PO_CONSTANTS.APPROVAL_SEND_SUPPLIER}
              </Button>
            </div>
          )}

        {po.status === 'sent' &&
          (user?.role === 'admin' ||
            user?.role === 'manager' ||
            user?.role === 'staff') && (
            <div className="mt-1">
              <Button
                variant="primary"
                isLoading={isConfirming}
                onClick={onConfirmClick}
                className="w-full justify-center"
              >
                <Icon name="Check" size={16} className="mr-2" />{' '}
                {PO_CONSTANTS.APPROVAL_NCC_CONFIRM}
              </Button>
            </div>
          )}

        {[
          'approved',
          'sent',
          'supplier_confirmed',
          'partial_received',
        ].includes(po.status) &&
          (user?.role === 'admin' ||
            user?.role === 'manager' ||
            user?.role === 'staff') && (
            <div className="mt-1 pt-3 border-t border-border">
              <Button
                variant="primary"
                className="w-full justify-center py-2"
                onClick={onOpenGrForm}
              >
                <Icon name="Plus" size={16} className="mr-2" />{' '}
                {PO_CONSTANTS.APPROVAL_CREATE_GR}
              </Button>
            </div>
          )}
      </div>
    </div>
  );
}
