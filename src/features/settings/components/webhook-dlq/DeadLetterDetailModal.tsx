import { Button, Icon, Badge } from '@/shared/components';
import { WebhookLogger } from '@/services/webhook/webhook-logger.service';
import type { DeadLetterEvent } from '@/api/webhook-dlq.api';

interface DeadLetterDetailModalProps {
  isOpen: boolean;
  event: DeadLetterEvent | null;
  onClose: () => void;
  onReplay: (event: DeadLetterEvent) => void;
  isReplaying: boolean;
}

export function DeadLetterDetailModal({
  isOpen,
  event,
  onClose,
  onReplay,
  isReplaying,
}: DeadLetterDetailModalProps) {
  if (!isOpen || !event) return null;

  const maskedPayload = WebhookLogger.sanitizePayload(event.payload);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-default bg-surface shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-default p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-danger-soft text-danger flex items-center justify-center">
              <Icon name="AlertTriangle" size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Chi tiết sự kiện Dead Letter
              </h3>
              <p className="text-xs text-muted font-mono mt-0.5">
                {event.event_id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-secondary p-3.5 rounded-lg border border-default">
            <div>
              <span className="text-xs text-muted block">Nguồn phát</span>
              <span className="font-semibold text-foreground">
                {event.source}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted block">Loại sự kiện</span>
              <span className="font-semibold text-foreground">
                {event.event_type}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted block">Số lần thử lại</span>
              <Badge variant="danger">
                {event.attempt_count} / {event.max_attempts}
              </Badge>
            </div>
            <div>
              <span className="text-xs text-muted block">Thời điểm nhận</span>
              <span className="text-xs font-mono text-foreground">
                {new Date(event.received_at).toLocaleTimeString('vi-VN')}
              </span>
            </div>
          </div>

          {/* Error Trace Banner */}
          <div className="p-3.5 rounded-lg bg-danger-soft border border-danger/20 text-danger">
            <span className="text-xs font-bold uppercase tracking-wider block mb-1">
              Thông điệp lỗi cuối cùng:
            </span>
            <p className="text-xs font-mono break-words whitespace-pre-wrap">
              {event.last_error ?? 'Không có thông tin chi tiết lỗi'}
            </p>
          </div>

          {/* Sanitized Payload Viewer */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">
                Dữ liệu sự kiện (Đã ẩn PII/Thông tin nhạy cảm)
              </span>
              <span className="text-[10px] text-muted">JSON format</span>
            </div>
            <pre className="p-3.5 rounded-lg bg-surface-secondary border border-default text-xs font-mono text-foreground overflow-x-auto max-h-48">
              {JSON.stringify(maskedPayload, null, 2)}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-default p-4 bg-surface-secondary/50 rounded-b-xl">
          <Button variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => onReplay(event)}
            disabled={isReplaying}
          >
            <Icon
              name="RefreshCw"
              size={14}
              className={`mr-1.5 ${isReplaying ? 'animate-spin' : ''}`}
            />
            {isReplaying
              ? 'Đang đưa vào hàng đợi...'
              : 'Thử lại sự kiện (Replay)'}
          </Button>
        </div>
      </div>
    </div>
  );
}
