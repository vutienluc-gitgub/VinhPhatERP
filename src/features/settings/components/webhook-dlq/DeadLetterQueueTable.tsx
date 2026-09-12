import { useState } from 'react';

import type { DeadLetterEvent } from '@/api/webhook-dlq.api';
import { Button, Icon, Badge } from '@/shared/components';

import { DeadLetterDetailModal } from './DeadLetterDetailModal';

interface DeadLetterQueueTableProps {
  events: DeadLetterEvent[];
  isLoading: boolean;
  onReplaySingle: (event: DeadLetterEvent) => void;
  onReplayAll: () => void;
  isReplayingSingle: boolean;
  isReplayingAll: boolean;
}

export function DeadLetterQueueTable({
  events,
  isLoading,
  onReplaySingle,
  onReplayAll,
  isReplayingSingle,
  isReplayingAll,
}: DeadLetterQueueTableProps) {
  const [inspectingEvent, setInspectingEvent] =
    useState<DeadLetterEvent | null>(null);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-default bg-surface p-6 shadow-sm animate-pulse space-y-4">
        <div className="h-6 w-48 bg-surface-secondary rounded" />
        <div className="h-40 bg-surface-secondary rounded" />
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-default bg-surface shadow-sm overflow-hidden">
        {/* Table Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-default gap-3">
          <div className="flex items-center gap-2.5">
            <h3 className="text-base font-bold text-foreground">
              Danh sách sự kiện Dead Letter
            </h3>
            <Badge variant={events.length > 0 ? 'danger' : 'success'}>
              {events.length} sự kiện
            </Badge>
          </div>
          {events.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReplayAll}
              disabled={isReplayingAll}
            >
              <Icon
                name="RefreshCw"
                size={14}
                className={`mr-1.5 ${isReplayingAll ? 'animate-spin' : ''}`}
              />
              {isReplayingAll
                ? 'Đang thử lại tất cả...'
                : 'Thử lại tất cả (Replay All)'}
            </Button>
          )}
        </div>

        {/* Table / Empty state */}
        {events.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-success-soft text-success flex items-center justify-center mb-3">
              <Icon name="CheckCircle2" size={24} />
            </div>
            <h4 className="text-sm font-bold text-foreground">
              Hàng đợi Dead Letter trống!
            </h4>
            <p className="text-xs text-muted max-w-sm mt-1">
              Tất cả các webhook và thông báo sự kiện đang được xử lý thành công
              hoặc tự phục hồi hoàn tất.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-secondary text-xs font-semibold text-muted uppercase tracking-wider border-b border-default">
                <tr>
                  <th className="py-3 px-4">Event ID</th>
                  <th className="py-3 px-4">Nguồn phát</th>
                  <th className="py-3 px-4">Lỗi chi tiết</th>
                  <th className="py-3 px-4">Lần thử</th>
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default text-xs">
                {events.map((ev) => (
                  <tr
                    key={ev.id}
                    className="hover:bg-surface-secondary/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-medium text-foreground max-w-[160px] truncate">
                      {ev.event_id}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-foreground">
                        {ev.source}
                      </span>
                      <span className="text-[10px] text-muted block">
                        {ev.event_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-[260px] truncate text-danger font-mono">
                      {ev.last_error ?? 'Chưa xác định'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="danger">
                        {ev.attempt_count} / {ev.max_attempts}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-muted whitespace-nowrap font-mono">
                      {new Date(ev.received_at).toLocaleTimeString('vi-VN')}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setInspectingEvent(ev)}
                      >
                        <Icon name="Eye" size={14} className="mr-1" />
                        Chi tiết
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onReplaySingle(ev)}
                        disabled={isReplayingSingle}
                      >
                        <Icon name="RefreshCw" size={14} className="mr-1" />
                        Thử lại
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DeadLetterDetailModal
        isOpen={Boolean(inspectingEvent)}
        event={inspectingEvent}
        onClose={() => setInspectingEvent(null)}
        onReplay={(ev) => {
          onReplaySingle(ev);
          setInspectingEvent(null);
        }}
        isReplaying={isReplayingSingle}
      />
    </>
  );
}
