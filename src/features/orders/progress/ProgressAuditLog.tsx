import { useRecentAuditLog, useProgressAuditLog } from '@/application/orders';
import {
  STAGE_LABELS,
  STAGE_STATUS_LABELS,
} from '@/schema/order-progress.schema';
import {
  ORDERS_FORM_LABELS,
  ORDERS_PROG_LABELS,
} from '@/features/orders/orders.constants';

import type { ProgressAuditLog, ProgressAuditLogWithOrder } from './types';

type AuditLogProps = {
  orderId?: string;
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
    }) +
    ' ' +
    d.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  );
}

export function ProgressAuditLogView({ orderId }: AuditLogProps) {
  const orderLog = useProgressAuditLog(orderId);
  const recentLog = useRecentAuditLog(orderId ? 0 : 30);
  const { data: logs = [], isLoading, error } = orderId ? orderLog : recentLog;

  if (error) {
    return (
      <div className="panel-card">
        <p className="error-inline">
          {ORDERS_FORM_LABELS.ERROR_PREFIX}{' '}
          {error instanceof Error ? error.message : String(error)}
        </p>
      </div>
    );
  }

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area">
        <span className="font-bold text-lg">
          {orderId
            ? ORDERS_PROG_LABELS.PROG_AUDIT_LOG_TITLE
            : ORDERS_PROG_LABELS.PROG_AUDIT_LOG_RECENT}
        </span>
      </div>

      <div style={{ padding: '0 1.25rem 1.25rem' }}>
        {isLoading ? (
          <p className="table-empty">{ORDERS_PROG_LABELS.PROG_LOADING}</p>
        ) : logs.length === 0 ? (
          <p className="table-empty">{ORDERS_PROG_LABELS.PROG_EMPTY_AUDIT}</p>
        ) : (
          <div className="audit-log-list">
            {logs.map((log) => (
              <AuditLogEntry key={log.id} log={log} showOrder={!orderId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AuditLogEntry({
  log,
  showOrder,
}: {
  log: ProgressAuditLog | ProgressAuditLogWithOrder;
  showOrder: boolean;
}) {
  const orders = 'orders' in log ? log.orders : undefined;
  return (
    <div className="audit-log-entry">
      <div className="audit-log-time">{formatTime(log.created_at)}</div>
      <div className="audit-log-content">
        {showOrder && orders && (
          <span className="audit-log-order">
            {orders.order_number}
            {orders.customers?.name && (
              <span className="text-muted-foreground text-sm">
                {' '}
                — {orders.customers.name}
              </span>
            )}
          </span>
        )}
        <span className="audit-log-stage">{STAGE_LABELS[log.stage]}</span>
        <span className="audit-log-transition">
          {log.old_status && (
            <>
              <span
                className={`roll-status ${statusClass(log.old_status)}`}
                style={{ fontSize: '0.7rem' }}
              >
                {STAGE_STATUS_LABELS[log.old_status]}
              </span>
              <span className="audit-log-arrow">→</span>
            </>
          )}
          <span
            className={`roll-status ${statusClass(log.new_status)}`}
            style={{ fontSize: '0.7rem' }}
          >
            {STAGE_STATUS_LABELS[log.new_status]}
          </span>
        </span>
        {log.notes && <span className="audit-log-notes">{log.notes}</span>}
      </div>
    </div>
  );
}

function statusClass(status: string): string {
  switch (status) {
    case 'done':
      return 'in_stock';
    case 'in_progress':
      return 'in_process';
    case 'skipped':
      return 'damaged';
    default:
      return 'shipped';
  }
}
