import dayjs from 'dayjs';

import { Icon } from '@/shared/components';
import type { PublicRfqDetails } from '@/api/supplier-portal.api';
import { SUPPLIER_PORTAL_LABELS } from '@/features/supplier-portal/supplier-portal.constants';
import { SupplierQuoteForm } from '@/features/supplier-portal/SupplierQuoteForm';

interface RFQViewerProps {
  rfq: PublicRfqDetails;
  isSuccess: boolean;
  onSuccess: () => void;
}

export function RFQViewer({ rfq, isSuccess, onSuccess }: RFQViewerProps) {
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-border text-center max-w-md w-full">
          <div className="w-16 h-16 bg-success-soft text-success rounded-full flex items-center justify-center mx-auto mb-6">
            <Icon name="Check" size={32} />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            {SUPPLIER_PORTAL_LABELS.SUCCESS_TITLE}
          </h2>
          <p className="text-muted text-sm leading-relaxed">
            {SUPPLIER_PORTAL_LABELS.SUCCESS_DESC}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Header */}
      <div className="bg-[#0f3460] text-white py-6 px-4 md:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold mb-1">
              {SUPPLIER_PORTAL_LABELS.PAGE_TITLE}
            </h1>
            <p className="text-info text-sm">
              {SUPPLIER_PORTAL_LABELS.PAGE_SUBTITLE}
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded transition-colors print:hidden flex items-center gap-2"
            title="In / Tải PDF"
          >
            <Icon name="Printer" size={20} />
            <span className="hidden sm:inline text-sm font-medium">
              In báo giá
            </span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6 -mt-4">
        {/* RFQ Info */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-5 md:p-6 relative z-10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted mb-4 border-b border-border pb-2">
            {SUPPLIER_PORTAL_LABELS.RFQ_INFO}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted mb-1">
                {SUPPLIER_PORTAL_LABELS.LABEL_RFQ_CODE}
              </p>
              <p className="font-semibold">{rfq.rfq_code}</p>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">
                {SUPPLIER_PORTAL_LABELS.LABEL_DEADLINE}
              </p>
              <p className="font-semibold text-destructive">
                {dayjs(rfq.deadline_date).format('DD/MM/YYYY HH:mm')}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs text-muted mb-1">
                {SUPPLIER_PORTAL_LABELS.LABEL_TITLE}
              </p>
              <p className="font-medium text-primary">{rfq.title}</p>
            </div>
            {rfq.notes && (
              <div className="md:col-span-2 bg-amber-50 p-3 rounded-lg border border-warning text-warning-strong text-sm whitespace-pre-wrap mt-2">
                <span className="font-semibold block mb-1">
                  {SUPPLIER_PORTAL_LABELS.LABEL_NOTES_FROM_BUYER}
                </span>
                {rfq.notes}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Form for Supplier & Quote Items */}
        <SupplierQuoteForm rfq={rfq} onSuccess={onSuccess} />
      </div>
    </div>
  );
}
