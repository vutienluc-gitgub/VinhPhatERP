import dayjs from 'dayjs';

import { Icon, TimelineProgress, type TimelineStep } from '@/shared/components';
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
  const baseSteps = [
    {
      id: 'draft',
      label: PO_CONSTANTS.TIMELINE_DRAFT,
      icon: 'FileEdit' as const,
    },
    {
      id: 'pending_approval',
      label: PO_CONSTANTS.TIMELINE_PENDING,
      icon: 'Clock' as const,
    },
    {
      id: 'approved',
      label: PO_CONSTANTS.TIMELINE_APPROVED,
      icon: 'CheckCircle2' as const,
    },
    { id: 'sent', label: PO_CONSTANTS.TIMELINE_SENT, icon: 'Send' as const },
    {
      id: 'supplier_confirmed',
      label: PO_CONSTANTS.TIMELINE_CONFIRMED,
      icon: 'Handshake' as const,
    },
    {
      id: 'receiving',
      label: PO_CONSTANTS.TIMELINE_RECEIVING,
      icon: 'Truck' as const,
    },
    {
      id: 'completed',
      label: PO_CONSTANTS.TIMELINE_COMPLETED,
      icon: 'CheckSquare' as const,
    },
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
      <div className="flex items-center gap-4 py-4 px-6 bg-gray-50 border border-default rounded-xl shadow-sm mb-6 text-muted-foreground">
        <Icon name="Slash" size={24} className="text-muted-foreground" />
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

  let currentIndex = baseSteps.findIndex((s) => s.id === activeStatus);
  if (currentIndex === -1) currentIndex = 0;

  const timelineSteps: TimelineStep[] = baseSteps.map((step, index) => {
    const isCompleted = index < currentIndex;
    const isCurrent = index === currentIndex;

    let stepStatus: TimelineStep['status'] = 'pending';
    if (isCompleted || (activeStatus === 'completed' && isCurrent)) {
      stepStatus = 'completed';
    } else if (isCurrent) {
      stepStatus = 'current';
    }

    const log = auditLogs.find(
      (l) =>
        l.action === step.id ||
        (step.id === 'pending_approval' && l.action === 'submitted'),
    );

    let subtitle = '';
    if (log) {
      subtitle = log.comment
        ? `"${log.comment}" - ${log.profiles?.full_name || 'Hệ thống'}`
        : `Bởi: ${log.profiles?.full_name || 'Hệ thống'}`;
    }

    return {
      id: step.id,
      title: step.label,
      subtitle: subtitle || undefined,
      icon: step.icon,
      status: stepStatus,
      date: log ? dayjs(log.created_at).format('HH:mm DD/MM/YYYY') : undefined,
    };
  });

  return (
    <div className="bg-surface border border-border rounded-xl p-6 shadow-sm mb-6 overflow-hidden">
      <h3 className="font-semibold text-lg border-b border-border pb-3 mb-6 m-0">
        {PO_CONSTANTS.TIMELINE_TITLE}
      </h3>
      <div className="pl-2">
        <TimelineProgress steps={timelineSteps} direction="horizontal" />
      </div>
    </div>
  );
}
