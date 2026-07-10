import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import { Icon, Badge } from '@/shared/components';
import { PO_CONSTANTS } from '@/features/procurement/purchase-orders/purchase-orders.constants';

interface POAuditLog {
  id: string;
  action: string;
  created_at: string;
  comment?: string;
  profiles?: { full_name: string };
}

interface POApprovalHistoryProps {
  logs: POAuditLog[];
}

export function POApprovalHistory({ logs }: POApprovalHistoryProps) {
  if (!logs || logs.length === 0) return null;

  return (
    <div className="bg-surface border border-border rounded-xl p-6 shadow-sm mb-6 lg:col-span-3">
      <h3 className="font-semibold text-lg border-b border-border pb-3 mb-6 m-0">
        {PO_CONSTANTS.APPROVAL_HISTORY_TITLE}
      </h3>
      <div className="space-y-6">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-4 relative">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 
                  ${
                    log.action === 'approved'
                      ? 'bg-green-50 border-green-200 text-green-600'
                      : log.action === 'rejected'
                        ? 'bg-red-50 border-red-200 text-red-600'
                        : log.action === 'request_changes'
                          ? 'bg-amber-50 border-amber-200 text-amber-600'
                          : 'bg-blue-50 border-blue-200 text-blue-600'
                  }`}
              >
                <Icon
                  name={
                    log.action === 'approved'
                      ? 'Check'
                      : log.action === 'rejected'
                        ? 'X'
                        : log.action === 'request_changes'
                          ? 'AlertCircle'
                          : 'Send'
                  }
                  size={20}
                />
              </div>
              <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
            </div>
            <div className="flex-1 pb-6">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <span className="font-medium text-gray-900">
                    {log.profiles?.full_name ||
                      PO_CONSTANTS.APPROVAL_SYSTEM_USER}
                  </span>
                  <span className="text-gray-500 mx-2">•</span>
                  <span className="text-sm text-gray-500">
                    {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', {
                      locale: vi,
                    })}
                  </span>
                </div>
                <Badge
                  variant={
                    log.action === 'approved'
                      ? 'success'
                      : log.action === 'rejected'
                        ? 'danger'
                        : log.action === 'request_changes'
                          ? 'warning'
                          : 'info'
                  }
                >
                  {log.action === 'approved'
                    ? PO_CONSTANTS.APPROVAL_LOG_APPROVED
                    : log.action === 'rejected'
                      ? PO_CONSTANTS.APPROVAL_LOG_REJECTED
                      : log.action === 'request_changes'
                        ? PO_CONSTANTS.APPROVAL_LOG_REQUEST_CHANGES
                        : PO_CONSTANTS.APPROVAL_LOG_SUBMITTED}
                </Badge>
              </div>
              {log.comment && (
                <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
                  "{log.comment}"
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
