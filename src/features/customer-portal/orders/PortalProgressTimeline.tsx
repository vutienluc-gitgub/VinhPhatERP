import React, { useMemo } from 'react';

import type { PortalProgressStage } from '@/domain/portal/types';
import {
  PRODUCTION_STAGE_LABELS,
  STAGE_STATUS_LABELS,
} from '@/features/customer-portal/constants';
import { Icon } from '@/shared/components/Icon';

interface PortalProgressTimelineProps {
  stages: PortalProgressStage[];
  orderNumber?: string;
  onContactFactory?: () => void;
}

type StageIconName =
  | 'Layers'
  | 'Cpu'
  | 'CheckSquare'
  | 'Pipette'
  | 'Sparkles'
  | 'CheckCircle2'
  | 'Package';

const STAGE_ICON_MAP: Record<string, StageIconName> = {
  warping: 'Layers',
  weaving: 'Cpu',
  greige_check: 'CheckSquare',
  dyeing: 'Pipette',
  finishing: 'Sparkles',
  final_check: 'CheckCircle2',
  packing: 'Package',
};

const LABELS = {
  EMPTY_PROGRESS: 'Chưa có dữ liệu tiến độ sản xuất cho đơn hàng này.',
  ESTIMATED_DATE: 'Dự kiến',
  ACTUAL_DATE: 'Thực tế',
  OVERDUE: 'Trễ hạn',
  PROGRESS_SUMMARY: 'Tiến độ hoàn thành',
  CHAT_WITH_FACTORY: 'Nhắn tin hỏi xưởng về đơn này',
} as const;

export const PortalProgressTimeline = React.memo(
  function PortalProgressTimeline({
    stages,
    orderNumber,
    onContactFactory,
  }: PortalProgressTimelineProps) {
    const handleChatClick = () => {
      if (onContactFactory) {
        onContactFactory();
        return;
      }
      window.dispatchEvent(
        new CustomEvent('navigate-to-chat', {
          detail: {
            roomId: undefined,
            context: orderNumber ? `#${orderNumber}` : undefined,
          },
        }),
      );
    };

    const { completedCount, totalCount, percentage } = useMemo(() => {
      const total = stages.length;
      if (total === 0)
        return { completedCount: 0, totalCount: 0, percentage: 0 };
      const done = stages.filter(
        (s) => s.status === 'done' || s.status === 'skipped',
      ).length;
      return {
        completedCount: done,
        totalCount: total,
        percentage: Math.round((done / total) * 100),
      };
    }, [stages]);

    if (stages.length === 0) {
      return (
        <div className="py-6 text-center text-muted text-xs">
          <p className="m-0">{LABELS.EMPTY_PROGRESS}</p>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        {/* Progress summary bar */}
        <div className="bg-surface-secondary/70 p-3.5 rounded-xl border border-border">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-foreground">
              {LABELS.PROGRESS_SUMMARY}
            </span>
            <span className="font-bold text-primary">
              {completedCount}/{totalCount} công đoạn ({percentage}%)
            </span>
          </div>
          <div className="w-full bg-border rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Milestone stages list */}
        <ol className="relative border-l border-border/80 ml-3.5 space-y-4 list-none pl-0 my-0">
          {stages.map((stageItem) => {
            const isDone = stageItem.status === 'done';
            const isActive = stageItem.status === 'in_progress';
            const iconName = STAGE_ICON_MAP[stageItem.stage] || 'Layers';

            let dotBgClass = 'bg-surface-secondary text-muted border-border';
            if (isDone) {
              dotBgClass =
                'bg-success text-white border-success ring-4 ring-success/15';
            } else if (isActive) {
              dotBgClass =
                'bg-primary text-white border-primary ring-4 ring-primary/20 animate-pulse';
            }

            return (
              <li
                key={stageItem.id}
                className="relative pl-7 transition-all duration-200"
              >
                {/* Milestone Node Dot */}
                <div
                  className={`absolute -left-3.5 top-0.5 w-7 h-7 rounded-full border flex items-center justify-center text-xs transition-all shadow-sm ${dotBgClass}`}
                >
                  {isDone ? (
                    <Icon name="Check" size={14} strokeWidth={3} />
                  ) : (
                    <Icon name={iconName} size={14} strokeWidth={2} />
                  )}
                </div>

                {/* Content Card */}
                <div className="bg-surface border border-border/80 rounded-xl p-3 shadow-xs hover:border-primary/40 transition-colors">
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-sm text-foreground">
                      {PRODUCTION_STAGE_LABELS[stageItem.stage] ??
                        stageItem.stage}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                          isDone
                            ? 'bg-success-soft text-success'
                            : isActive
                              ? 'bg-primary/10 text-primary font-semibold'
                              : 'bg-surface-secondary text-muted'
                        }`}
                      >
                        {STAGE_STATUS_LABELS[stageItem.status] ??
                          stageItem.status}
                      </span>
                      {stageItem.is_overdue && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-danger-soft text-danger">
                          {LABELS.OVERDUE}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dates */}
                  {(stageItem.planned_date || stageItem.actual_date) && (
                    <div className="flex items-center gap-3 text-xs text-muted mt-1.5 pt-1.5 border-t border-border/40">
                      {stageItem.planned_date && (
                        <span>
                          {LABELS.ESTIMATED_DATE}:{' '}
                          <strong className="text-foreground">
                            {stageItem.planned_date}
                          </strong>
                        </span>
                      )}
                      {stageItem.actual_date && (
                        <span>
                          {LABELS.ACTUAL_DATE}:{' '}
                          <strong className="text-success">
                            {stageItem.actual_date}
                          </strong>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        {/* Action Button: Contact Factory */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleChatClick}
            className="w-full py-2.5 px-4 bg-primary/10 hover:bg-primary/15 text-primary text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 border border-primary/20 cursor-pointer"
          >
            <Icon name="MessageSquare" size={15} />
            <span>{LABELS.CHAT_WITH_FACTORY}</span>
          </button>
        </div>
      </div>
    );
  },
);
