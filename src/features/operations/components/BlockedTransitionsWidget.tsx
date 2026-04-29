import { useMemo, useRef, useState } from 'react';

import { Badge, Button, LiveIndicator, TabSwitcher } from '@/shared/components';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/Card';

const RESET_HOLD_MS = 900;

type BlockedWidgetTab = 'live' | 'summary';

const BLOCKED_WIDGET_TABS: Array<{ key: BlockedWidgetTab; label: string }> = [
  {
    key: 'live',
    label: 'Trực tiếp',
  },
  {
    key: 'summary',
    label: 'Tổng hợp',
  },
];

export interface BlockedTransitionEventDetail {
  taskId: string;
  fromStatus: string;
  targetStatus: string;
  reason: string;
  source: 'preview' | 'commit';
  timestamp: string;
  module?: string;
}

interface Props {
  recentEvents: BlockedTransitionEventDetail[];
  sessionEvents: BlockedTransitionEventDetail[];
  sessionCount: number;
  onReset: () => void;
}

export function BlockedTransitionsWidget({
  recentEvents,
  sessionEvents,
  sessionCount,
  onReset,
}: Props) {
  const [activeTab, setActiveTab] = useState<BlockedWidgetTab>('live');
  const [isResetArmed, setIsResetArmed] = useState(false);
  const resetHoldTimeoutRef = useRef<number | null>(null);

  const topBlockedReasons = useMemo(() => {
    const reasonCountMap = new Map<string, number>();
    for (const event of sessionEvents) {
      reasonCountMap.set(
        event.reason,
        (reasonCountMap.get(event.reason) ?? 0) + 1,
      );
    }

    return Array.from(reasonCountMap.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [sessionEvents]);

  const blockedBySource = useMemo(() => {
    const stats: Record<'preview' | 'commit', number> = {
      preview: 0,
      commit: 0,
    };

    for (const event of sessionEvents) {
      stats[event.source] += 1;
    }

    return stats;
  }, [sessionEvents]);

  const handleResetPressStart = () => {
    if (
      typeof window === 'undefined' ||
      !window.matchMedia('(pointer: coarse)').matches
    ) {
      return;
    }

    setIsResetArmed(true);
    resetHoldTimeoutRef.current = window.setTimeout(() => {
      onReset();
      setIsResetArmed(false);
      resetHoldTimeoutRef.current = null;
    }, RESET_HOLD_MS);
  };

  const handleResetPressEnd = () => {
    if (resetHoldTimeoutRef.current !== null) {
      window.clearTimeout(resetHoldTimeoutRef.current);
      resetHoldTimeoutRef.current = null;
    }
    setIsResetArmed(false);
  };

  const handleResetClick = () => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(pointer: coarse)').matches
    ) {
      return;
    }
    onReset();
  };

  return (
    <Card className="border-none shadow-sm bg-white/70 backdrop-blur-sm">
      <CardHeader className="border-b border-zinc-100/60 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xs sm:text-sm text-zinc-800">
              Chuyển đổi bị chặn
            </CardTitle>
            <LiveIndicator />
          </div>
          <div className="flex items-center gap-2">
            <TabSwitcher
              variant="pill"
              size="sm"
              tabs={BLOCKED_WIDGET_TABS}
              active={activeTab}
              onChange={setActiveTab}
            />
            <Badge variant="danger" className="text-xs uppercase tracking-wide">
              Phiên: {sessionCount}
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
              {isResetArmed ? 'Giữ...' : 'Đặt lại'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4">
        {activeTab === 'live' ? (
          recentEvents.length === 0 ? (
            <p className="text-xs text-zinc-500">
              Chưa có chuyển đổi bị chặn trong phiên hiện tại.
            </p>
          ) : (
            <div className="space-y-1.5 sm:space-y-2">
              {recentEvents.map((event) => (
                <div
                  key={`${event.taskId}-${event.timestamp}`}
                  className="rounded-lg border border-rose-200/70 bg-rose-50/70 px-3 py-2"
                >
                  <p className="text-xs font-medium text-rose-700 line-clamp-2">
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
                  Xem trước
                </p>
                <p className="text-sm font-semibold text-zinc-800">
                  {blockedBySource.preview}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-2">
                <p className="text-[10px] uppercase tracking-wide text-zinc-500">
                  Xác nhận
                </p>
                <p className="text-sm font-semibold text-zinc-800">
                  {blockedBySource.commit}
                </p>
              </div>
            </div>

            {topBlockedReasons.length === 0 ? (
              <p className="text-xs text-zinc-500">
                Chưa có dữ liệu tổng hợp trong phiên hiện tại.
              </p>
            ) : (
              <div className="space-y-1.5">
                {topBlockedReasons.map((item) => (
                  <div
                    key={item.reason}
                    className="rounded-lg border border-zinc-200/80 bg-white px-2.5 py-2"
                  >
                    <p className="text-xs font-medium text-zinc-800 line-clamp-2">
                      {item.reason}
                    </p>
                    <p className="mt-0.5 text-[11px] text-zinc-500">
                      {item.count} lần
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
