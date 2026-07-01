import { Icon } from '@/shared/components';

import { CONTRACT_STATUS_LABELS } from './contracts.module';
import type { ContractAuditLog } from './contracts.module';

// ── Constants ────────────────────────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  created: 'Hợp đồng được tạo',
  updated: 'Cập nhật thông tin',
  status_changed: 'Chuyển trạng thái',
  order_linked: 'Liên kết đơn hàng',
  order_unlinked: 'Hủy liên kết đơn hàng',
};

const ACTION_ICONS: Record<string, string> = {
  created: 'FilePlus',
  updated: 'Pencil',
  status_changed: 'RefreshCw',
  order_linked: 'Link',
  order_unlinked: 'Unlink',
};

// ── AuditLogEntry ────────────────────────────────────────────────────────────

type AuditLogEntryProps = {
  log: ContractAuditLog;
  isLast: boolean;
};

function AuditLogEntry({ log, isLast }: AuditLogEntryProps) {
  const label = ACTION_LABELS[log.action] ?? log.action;
  const iconName = (ACTION_ICONS[log.action] ?? 'Activity') as Parameters<
    typeof Icon
  >[0]['name'];

  // eslint-disable-next-line no-restricted-syntax
  const formattedTime = new Date(log.performed_at).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const newStatus =
    log.action === 'status_changed' &&
    log.new_values &&
    typeof log.new_values['status'] === 'string'
      ? (CONTRACT_STATUS_LABELS[
          log.new_values['status'] as keyof typeof CONTRACT_STATUS_LABELS
        ] ?? (log.new_values['status'] as string))
      : null;

  const cancelReason: string | null =
    log.action === 'status_changed' &&
    log.new_values &&
    typeof log.new_values['reason'] === 'string'
      ? (log.new_values['reason'] as string)
      : null;

  return (
    <div className="flex gap-3 group">
      {/* Timeline line */}
      <div className="flex flex-col items-center shrink-0">
        <div className="w-7 h-7 rounded-full bg-surface-subtle border border-border flex items-center justify-center text-muted group-hover:border-primary/30 transition-colors">
          <Icon name={iconName} size={14} />
        </div>
        {!isLast && <div className="w-px flex-1 bg-border min-h-[20px] mt-1" />}
      </div>

      {/* Content */}
      <div className={`pb-4 min-w-0 flex-1 ${isLast ? 'pb-0' : ''}`}>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {newStatus && (
          <p className="text-xs text-muted mt-0.5">
            Trạng thái mới: <span className="font-medium">{newStatus}</span>
          </p>
        )}
        {cancelReason && (
          <p className="text-xs italic text-muted mt-0.5">
            Lý do: {cancelReason}
          </p>
        )}
        <p className="text-xs text-muted mt-0.5">{formattedTime}</p>
      </div>
    </div>
  );
}

// ── ContractAuditTimeline ────────────────────────────────────────────────────

type ContractAuditTimelineProps = {
  logs: ContractAuditLog[];
  isLoading: boolean;
};

export function ContractAuditTimeline({
  logs,
  isLoading,
}: ContractAuditTimelineProps) {
  return (
    <div className="px-5 pb-5">
      <h4 className="mb-3 flex items-center gap-2">
        <Icon name="History" size={16} />
        Lịch sử hoạt động
      </h4>
      {isLoading ? (
        <p className="table-empty text-sm">Đang tải...</p>
      ) : logs.length === 0 ? (
        <p className="table-empty text-sm">Chưa có hoạt động nào.</p>
      ) : (
        <div className="space-y-0">
          {logs.map((log, idx) => (
            <AuditLogEntry
              key={log.id}
              log={log}
              isLast={idx === logs.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
