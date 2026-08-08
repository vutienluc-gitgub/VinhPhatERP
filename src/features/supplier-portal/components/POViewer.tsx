import { useState } from 'react';
import dayjs from 'dayjs';

import { Icon, Button, StatusStepper } from '@/shared/components';
import { MoneyText } from '@/shared/value';
import type { PublicPoDetails } from '@/api/supplier-portal.api';
import { SUPPLIER_PORTAL_LABELS } from '@/features/supplier-portal/supplier-portal.constants';

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
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const isActionable = po.status === 'sent';
  const isConfirmedBySupplier = po.status === 'supplier_confirmed';
  const isRejectedBySupplier = po.status === 'supplier_rejected';
  const isCanceled = ['rejected', 'cancelled'].includes(po.status);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Header */}
      <div className="bg-[#0f3460] text-inverse-foreground py-6 px-4 md:px-8">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold mb-1">
              {TEXT.PO_HEADER_PREFIX} {po.po_code}
            </h1>
            <p className="text-info text-sm">{TEXT.COMPANY_NAME}</p>
          </div>
          <div className="flex items-center gap-4">
            {isConfirmedBySupplier && (
              <div className="bg-success/20 text-success-light px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 print:hidden">
                <Icon name="CheckCircle" size={16} /> {TEXT.PO_STATUS_CONFIRMED}
              </div>
            )}
            {isRejectedBySupplier && (
              <div className="bg-red-500/20 text-red-200 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 print:hidden">
                <Icon name="XCircle" size={16} /> {TEXT.PO_STATUS_REJECTED}
              </div>
            )}
            <button
              onClick={() => window.print()}
              className="p-2 bg-surface/10 hover:bg-white/20 text-inverse-foreground rounded transition-colors print:hidden flex items-center gap-2"
              title={TEXT.PRINT_BTN}
            >
              <Icon name="Printer" size={20} />
              <span className="hidden sm:inline text-sm font-medium">
                {TEXT.PO_PRINT}
              </span>
            </button>
          </div>
        </div>
      </div>

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
              <p className="font-semibold">
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
            <p className="whitespace-pre-wrap text-sm">{po.notes}</p>
          </div>
        )}

        {/* Items */}
        <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="p-5 md:p-6 border-b border-border">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {TEXT.PO_SECTION_ITEMS}
            </h2>
          </div>
          <div className="divide-y divide-border">
            {po.items.map((item, index) => (
              <div
                key={item.id}
                className="p-4 md:p-6 hover:bg-slate-50 transition-colors"
              >
                <div className="flex justify-between gap-4 mb-2">
                  <h3 className="font-semibold text-foreground">
                    {index + 1}. {item.material_name}
                  </h3>
                  <div className="text-right">
                    <p className="font-bold">
                      <MoneyText value={item.line_total} />
                    </p>
                  </div>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    {TEXT.PO_ITEM_QTY}{' '}
                    <span className="font-medium text-foreground">
                      {item.order_qty} {item.uom}
                    </span>
                  </span>
                  <span>
                    {TEXT.PO_ITEM_PRICE}{' '}
                    <span className="font-medium text-foreground">
                      <MoneyText value={item.unit_price} />
                    </span>
                  </span>
                </div>
                {item.notes && (
                  <p className="text-xs text-muted-foreground italic mt-2 bg-slate-50 p-2 rounded">
                    {item.notes}
                  </p>
                )}
              </div>
            ))}
          </div>

          {Array.isArray(po.attachments) && po.attachments.length > 0 && (
            <div className="p-4 md:p-6 bg-slate-50 border-t border-border">
              <h3 className="font-semibold text-sm mb-3">
                {TEXT.PO_ATTACHMENTS_TITLE}
              </h3>
              <div className="flex flex-wrap gap-2">
                {(po.attachments as Array<{ name?: string; url?: string }>).map(
                  (file, i: number) => (
                    <a
                      key={i}
                      href={file?.url || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-lg hover:border-primary transition-colors text-sm"
                    >
                      <Icon
                        name="Paperclip"
                        size={16}
                        className="text-muted-foreground"
                      />
                      <span>
                        {file?.name ||
                          `${TEXT.PO_ATTACHMENT_FALLBACK} ${i + 1}`}
                      </span>
                    </a>
                  ),
                )}
              </div>
            </div>
          )}
        </div>

        {/* CTA: Confirm + Reject */}
        {isActionable && (
          <div className="bg-surface rounded-xl shadow-sm border border-border p-5 md:p-6">
            <h3 className="font-semibold mb-2 text-center">
              {TEXT.PO_RESPONSE_TITLE}
            </h3>
            <p className="text-sm text-muted-foreground mb-5 text-center">
              {TEXT.PO_RESPONSE_DESC}
            </p>

            {!showRejectForm ? (
              <div className="space-y-3">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full justify-center text-lg font-bold py-6"
                  onClick={onConfirm}
                  isLoading={isConfirming}
                >
                  <Icon name="CheckCircle" size={20} className="mr-2" />
                  {TEXT.PO_CONFIRM_BTN}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full justify-center text-danger border-danger/30 hover:bg-danger-soft"
                  onClick={() => setShowRejectForm(true)}
                >
                  <Icon name="XCircle" size={18} className="mr-2" />
                  {TEXT.PO_CANNOT_FULFILL}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-danger-soft/50 border border-danger/20 rounded-lg p-4">
                  <label
                    htmlFor="reject-reason"
                    className="block text-sm font-semibold text-danger mb-2"
                  >
                    {TEXT.PO_REJECT_REASON_LABEL}{' '}
                    <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="reject-reason"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder={TEXT.PO_REJECT_REASON_PLACEHOLDER}
                    rows={3}
                    className="w-full border border-danger/30 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-danger/50 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="w-full justify-center"
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectReason('');
                    }}
                  >
                    {TEXT.PO_BTN_BACK}
                  </Button>
                  <Button
                    variant="danger"
                    className="w-full justify-center"
                    onClick={() => onReject(rejectReason.trim())}
                    isLoading={isRejecting}
                    disabled={!rejectReason.trim()}
                  >
                    <Icon name="Send" size={16} className="mr-2" />
                    {TEXT.PO_BTN_SEND_RESPONSE}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Chat / Comments injected from parent */}
        {commentsElement}
      </div>
    </div>
  );
}
