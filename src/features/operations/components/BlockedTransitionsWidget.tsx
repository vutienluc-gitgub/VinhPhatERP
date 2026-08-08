import { useMemo, useRef, useState } from 'react';

import { Badge, Button, LiveIndicator, TabSwitcher } from '@/shared/components';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/Card';
import type { BlockedTransitionEventDetail } from '@/features/operations/hooks/useBlockedTransitionSession';
import { OPERATIONS_MESSAGES } from '@/features/operations/constants';

const RESET_HOLD_MS = 900;

type BlockedWidgetTab = 'live' | 'summary';

const BLOCKED_WIDGET_TABS: Array<{ key: BlockedWidgetTab; label: string }> = [
  {
    key: 'live',
    label: OPERATIONS_MESSAGES.LIVE_TAB,
  },
  {
    key: 'summary',
    label: OPERATIONS_MESSAGES.SUMMARY_TAB,
  },
];

interface Props {
  recentEvents: BlockedTransitionEventDetail[];
  sessionEvents: BlockedTransitionEventDetail[];
  sessionCount: number;
  onReset: () => void;
}

function getTopBlockedReasons(events: BlockedTransitionEventDetail[]) {
  const counts: Record<string, number> = {};
  for (const event of events) {
    const key = event.reason;
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

export function BlockedTransitionsWidget({
  recentEvents,
  sessionEvents,
  sessionCount,
  onReset,
}: Props) {
  const [activeTab, setActiveTab] = useState<BlockedWidgetTab>('live');
  const [isResetArmed, setIsResetArmed] = useState(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const topBlockedReasons = useMemo(() => {
    return getTopBlockedReasons(sessionEvents);
  }, [sessionEvents]);

  const blockedBySource = useMemo(() => {
    return {
      preview: sessionEvents.filter((e) => e.source === 'preview').length,
      commit: sessionEvents.filter((e) => e.source === 'commit').length,
    };
  }, [sessionEvents]);

  if (sessionCount === 0 && recentEvents.length === 0) {
    return null;
  }

  const handleResetPressStart = () => {
    setIsResetArmed(true);
    holdTimerRef.current = setTimeout(() => {
      onReset();
      setIsResetArmed(false);
    }, RESET_HOLD_MS);
  };

  const handleResetPressEnd = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setIsResetArmed(false);
  };

  const handleResetClick = (e: React.MouseEvent) => {
    if (
      !window.matchMedia('(hover: none) and (pointer: coarse)').matches &&
      !e.shiftKey
    ) {
      return;
    }
    onReset();
  };

  return (
    <Card className="border-none shadow-sm bg-surface/70 backdrop-blur-sm">
      <CardHeader className="border-b border-zinc-100/60 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xs sm:text-sm text-zinc-800">
              {OPERATIONS_MESSAGES.BLOCKED_TRANSITIONS}
            </CardTitle>
            <LiveIndicator />
          </div>
          <div className="flex items-center gap-2">
            <TabSwitcher
              size="sm"
              tabs={BLOCKED_WIDGET_TABS}
              active={activeTab}
              onChange={setActiveTab}
            />
            <Badge
              variant="danger"
              className="text-xs uppercase tracking-wide cursor-help"
              title="Số phiên có lỗi kéo thả chưa được xử lý (tải lại trang sẽ reset về 0)"
            >
              {OPERATIONS_MESSAGES.SESSION}: {sessionCount}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onPointerDown={handleResetPressStart}
              onPointerUp={handleResetPressEnd}
              onPointerLeave={handleResetPressEnd}
              onPointerCancel={handleResetPressEnd}
              onClick={handleResetClick}
            >
              {isResetArmed
                ? OPERATIONS_MESSAGES.HOLD_TO_RESET
                : OPERATIONS_MESSAGES.RESET}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4">
        {activeTab === 'live' ? (
          recentEvents.length === 0 ? (
            <p className="text-xs text-zinc-500">
              {OPERATIONS_MESSAGES.NO_BLOCKED_EVENTS_LIVE}
            </p>
          ) : (
            <div className="space-y-1.5 sm:space-y-2">
              {recentEvents.map((event) => (
                <div
                  key={`${event.taskId}-${event.timestamp}`}
                  className="rounded-lg border border-danger/70 bg-rose-50/70 px-3 py-2"
                >
                  <p className="text-xs font-medium text-danger line-clamp-2">
                    {event.reason}
                  </p>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    {event.fromStatus} → {event.targetStatus} · #
                    {event.taskId.slice(0, 6)}
                  </p>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-2">
                <p className="text-[10px] uppercase tracking-wide text-zinc-500">
                  {OPERATIONS_MESSAGES.PREVIEW}
                </p>
                <p className="text-sm font-semibold text-zinc-800">
                  {blockedBySource.preview}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-2">
                <p className="text-[10px] uppercase tracking-wide text-zinc-500">
                  {OPERATIONS_MESSAGES.COMMIT}
                </p>
                <p className="text-sm font-semibold text-zinc-800">
                  {blockedBySource.commit}
                </p>
              </div>
            </div>

            {topBlockedReasons.length === 0 ? (
              <p className="text-xs text-zinc-500">
                {OPERATIONS_MESSAGES.NO_BLOCKED_EVENTS_SUMMARY}
              </p>
            ) : (
              <div className="space-y-1.5">
                {topBlockedReasons.map((item) => (
                  <div
                    key={item.reason}
                    className="rounded-lg border border-zinc-200/80 bg-surface px-2.5 py-2"
                  >
                    <p className="text-xs font-medium text-zinc-800 line-clamp-2">
                      {item.reason}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Bị chặn {item.count} {OPERATIONS_MESSAGES.TIMES}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
