import dayjs from 'dayjs';

import { Icon, StatusStepper } from '@/shared/components';
import { MoneyText } from '@/shared/value';
import type { PublicPoDetails } from '@/api/supplier-portal.api';
import { SUPPLIER_PORTAL_LABELS } from '@/features/supplier-portal/supplier-portal.constants';

import { POViewerHeader } from './POViewerHeader';
import { POItemsTable } from './POItemsTable';
import { POActionPanel } from './POActionPanel';

const TEXT = SUPPLIER_PORTAL_LABELS;

export interface POViewerProps {
  po: PublicPoDetails;
  onConfirm: () => void;
  onReject: (reason: string) => void;
  isConfirming?: boolean;
  isRejecting?: boolean;
  commentsElement?: React.ReactNode;
}

export function POViewer({
  po,
  onConfirm,
  onReject,
  isConfirming = false,
  isRejecting = false,
  commentsElement,
}: POViewerProps) {
  const isActionable = po.status === 'sent';
  const isConfirmedBySupplier = po.status === 'supplier_confirmed';
  const isRejectedBySupplier = po.status === 'supplier_rejected';
  const isCanceled = ['rejected', 'cancelled'].includes(po.status);

  return (
    <div className="min-h-screen bg-background font-sans pb-20">
      {/* Header */}
      <POViewerHeader
        po={po}
        isConfirmedBySupplier={isConfirmedBySupplier}
        isRejectedBySupplier={isRejectedBySupplier}
      />

      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6 -mt-4">
        {/* Progress Stepper */}
        {!isCanceled && !isRejectedBySupplier && (
          <StatusStepper
            steps={[
              {
                id: 'sent',
                label: TEXT.STEP_PO_SENT,
                isCompleted: true,
                isActive: po.status === 'sent',
              },
              {
                id: 'confirmed',
                label: TEXT.STEP_PO_CONFIRMED,
                isCompleted: ['supplier_confirmed', 'completed'].includes(
                  po.status,
                ),
                isActive: po.status === 'supplier_confirmed',
              },
              {
                id: 'delivering',
                label: TEXT.STEP_PO_DELIVERING,
                isCompleted: po.status === 'completed',
                isActive: false,
              },
              {
                id: 'completed',
                label: TEXT.STEP_PO_COMPLETED,
                isCompleted: po.status === 'completed',
                isActive: po.status === 'completed',
              },
            ]}
          />
        )}

        {/* Confirmed banner */}
        {isConfirmedBySupplier && po.confirmed_at && (
          <div className="bg-success-soft border border-success/30 rounded-xl p-4 text-center">
            <div className="w-12 h-12 bg-success text-inverse-foreground rounded-full flex items-center justify-center mx-auto mb-3">
              <Icon name="Check" size={24} />
            </div>
            <h3 className="text-success-strong font-bold text-lg mb-1">
              {TEXT.PO_CONFIRMED_BANNER}
            </h3>
            <p className="text-success-strong/80 text-sm">
              Lúc {dayjs(po.confirmed_at).format('HH:mm - DD/MM/YYYY')}
            </p>
          </div>
        )}

        {/* Rejected by supplier banner */}
        {isRejectedBySupplier && (
          <div className="bg-danger-soft border border-danger/30 rounded-xl p-5 text-center">
            <div className="w-12 h-12 bg-danger text-inverse-foreground rounded-full flex items-center justify-center mx-auto mb-3">
              <Icon name="X" size={24} />
            </div>
            <h3 className="text-danger font-bold text-lg mb-2">
              {TEXT.PO_REJECTED_BANNER}
            </h3>
            {po.confirmed_at && (
              <p className="text-danger/70 text-sm">
                Lúc {dayjs(po.confirmed_at).format('HH:mm - DD/MM/YYYY')}
              </p>
            )}
          </div>
        )}

        {/* Canceled by ERP */}
        {isCanceled && (
          <div className="bg-danger-soft border border-danger/30 rounded-xl p-4 text-center">
            <h3 className="text-danger font-bold text-lg mb-1">
              {TEXT.PO_CANCELLED_BANNER}
            </h3>
          </div>
        )}

        {/* PO Info */}
        <div className="bg-surface rounded-xl shadow-sm border border-border p-5 md:p-6 relative z-10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 border-b border-border pb-2">
            {TEXT.PO_SECTION_INFO}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                {TEXT.PO_LABEL_SUPPLIER}
              </p>
              <p className="font-semibold text-foreground">
                {po.supplier_name}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                {TEXT.PO_LABEL_ORDER_DATE}
              </p>
              <p className="font-semibold text-foreground">
                {dayjs(po.order_date).format('DD/MM/YYYY')}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground mb-1">
                {TEXT.PO_LABEL_TOTAL}
              </p>
              <p className="font-bold text-lg text-foreground">
                <MoneyText value={po.total_amount} />
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {po.notes && (
          <div className="bg-surface rounded-xl shadow-sm border border-border p-5 md:p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 border-b border-border pb-2">
              {TEXT.PO_SECTION_NOTES}
            </h2>
            <p className="whitespace-pre-wrap text-sm text-foreground">
              {po.notes}
            </p>
          </div>
        )}

        {/* Items */}
        <POItemsTable po={po} />

        {/* CTA: Confirm + Reject */}
        {isActionable && (
          <POActionPanel
            onConfirm={onConfirm}
            onReject={onReject}
            isConfirming={isConfirming}
            isRejecting={isRejecting}
          />
        )}

        {/* Chat / Comments injected from parent */}
        {commentsElement}
      </div>
    </div>
  );
}
