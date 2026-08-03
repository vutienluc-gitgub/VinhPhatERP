import dayjs from 'dayjs';

import { Icon } from '@/shared/components';
import { PO_CONSTANTS } from '@/features/procurement/purchase-orders/purchase-orders.constants';

interface AuditLog {
  action: string;
  created_at: string;
  comment?: string;
  profiles?: {
    full_name?: string;
  };
}

interface POTimelineProps {
  status: string;
  auditLogs?: AuditLog[];
}

export function POTimeline({ status, auditLogs = [] }: POTimelineProps) {
  const steps = [
    { id: 'draft', label: PO_CONSTANTS.TIMELINE_DRAFT },
    { id: 'pending_approval', label: PO_CONSTANTS.TIMELINE_PENDING },
    { id: 'approved', label: PO_CONSTANTS.TIMELINE_APPROVED },
    { id: 'sent', label: PO_CONSTANTS.TIMELINE_SENT },
    { id: 'supplier_confirmed', label: PO_CONSTANTS.TIMELINE_CONFIRMED },
    { id: 'receiving', label: PO_CONSTANTS.TIMELINE_RECEIVING },
    { id: 'completed', label: PO_CONSTANTS.TIMELINE_COMPLETED },
  ];

  // Map sub-statuses to main steps
  let activeStatus = status;
  if (status === 'submitted') activeStatus = 'pending_approval';
  if (status === 'partial_received') activeStatus = 'receiving';

  if (status === 'request_changes') {
    return (
      <div className="flex items-center gap-4 py-4 px-6 bg-amber-50 border border-warning rounded-xl shadow-sm mb-6 text-warning-strong">
        <Icon name="AlertCircle" size={24} className="text-warning" />
        <span className="font-semibold text-lg">
          {PO_CONSTANTS.TIMELINE_REQUEST_CHANGES}
        </span>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="flex items-center gap-4 py-4 px-6 bg-red-50 border border-danger rounded-xl shadow-sm mb-6 text-danger">
        <Icon name="XCircle" size={24} className="text-danger" />
        <span className="font-semibold text-lg">
          {PO_CONSTANTS.TIMELINE_REJECTED}
        </span>
      </div>
    );
  }
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-4 py-4 px-6 bg-gray-50 border border-default rounded-xl shadow-sm mb-6 text-secondary">
        <Icon name="Slash" size={24} className="text-muted" />
        <span className="font-semibold text-lg">
          {PO_CONSTANTS.TIMELINE_CANCELLED}
        </span>
      </div>
    );
  }
  if (status === 'supplier_rejected') {
    return (
      <div className="flex items-center gap-4 py-4 px-6 bg-red-50 border border-danger rounded-xl shadow-sm mb-6 text-danger">
        <Icon name="XCircle" size={24} className="text-danger" />
        <span className="font-semibold text-lg">
          NCC Từ chối Đơn hàng (Supplier Rejected)
        </span>
      </div>
    );
  }

  let currentIndex = steps.findIndex((s) => s.id === activeStatus);
  if (currentIndex === -1) currentIndex = 0;

  return (
    <div className="bg-surface border border-border rounded-xl p-6 shadow-sm mb-6 overflow-hidden">
      <h3 className="font-semibold text-lg border-b border-border pb-3 mb-8 m-0">
        {PO_CONSTANTS.TIMELINE_TITLE}
      </h3>
      <div className="flex items-center justify-between relative px-4 md:px-16">
        <div className="absolute left-14 right-14 top-5 h-1.5 bg-surface-secondary -z-10 rounded-full"></div>
        <div
          className="absolute left-14 top-5 h-1.5 bg-primary -z-10 transition-all duration-500 rounded-full"
          style={{
            width: `calc(${(currentIndex / (steps.length - 1)) * 100}% - 7rem)`,
          }}
        ></div>
        {steps.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const log = auditLogs.find(
            (l) =>
              l.action === step.id ||
              (step.id === 'pending_approval' && l.action === 'submitted'),
          );

          return (
            <div
              key={step.id}
              className="group relative flex flex-col items-center gap-3 bg-surface px-4 cursor-default"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${isCompleted ? 'bg-primary border-primary text-white shadow-md' : 'bg-surface border-default text-muted-foreground'}`}
              >
                {isCompleted ? <Icon name="Check" size={20} /> : index + 1}
              </div>
              <span
                className={`text-sm font-semibold ${isCurrent ? 'text-primary' : isCompleted ? 'text-primary' : 'text-muted-foreground'}`}
              >
                {step.label}
              </span>

              {log && (
                <div className="absolute top-12 left-1/2 -translate-x-1/2 w-48 p-2.5 bg-slate-800 text-white text-xs rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                  <div className="font-semibold mb-1">{step.label}</div>
                  <div className="text-slate-300 mb-0.5">
                    Lúc: {dayjs(log.created_at).format('HH:mm - DD/MM/YYYY')}
                  </div>
                  <div className="text-slate-300">
                    Bởi: {log.profiles?.full_name || 'Hệ thống'}
                  </div>
                  {log.comment && (
                    <div className="mt-1 pt-1 border-t border-slate-600 italic">
                      "{log.comment}"
                    </div>
                  )}
                  {/* Tooltip Arrow */}
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
