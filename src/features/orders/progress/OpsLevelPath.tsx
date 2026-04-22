import { Icon } from '@/shared/components';

import {
  PRODUCTION_STAGES,
  STAGE_LABELS,
  STAGE_STATUS_LABELS,
} from './order-progress.module';
import type { OrderProgressWithOrder } from './types';

interface OpsLevelPathProps {
  stages: OrderProgressWithOrder[];
  isPendingUpdate?: boolean;
  onAdvance?: (row: OrderProgressWithOrder) => void;
}

export function OpsLevelPath({
  stages,
  isPendingUpdate,
  onAdvance,
}: OpsLevelPathProps) {
  return (
    <div
      className="relative flex items-center w-full overflow-x-auto pb-1 mt-3 mb-1"
      style={{ scrollbarWidth: 'none' }}
    >
      <div className="flex items-center min-w-max px-1 pt-1">
        {PRODUCTION_STAGES.map((stageKey, idx) => {
          const row = stages.find((s) => s.stage === stageKey);

          // Nếu chưa có row data cho stage này, hiển thị dot mờ
          if (!row) {
            return (
              <div
                key={`missing-${stageKey}`}
                className="flex items-center opacity-30 cursor-default"
              >
                <div className="flex flex-col items-center gap-1 w-12">
                  <div className="w-5 h-5 rounded-full border border-border bg-bg flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-border" />
                  </div>
                  <span className="text-[0.6rem] whitespace-nowrap">
                    {STAGE_LABELS[stageKey]}
                  </span>
                </div>
                {idx < PRODUCTION_STAGES.length - 1 && (
                  <div className="w-6 h-[2px] bg-border mx-[-2px] z-0" />
                )}
              </div>
            );
          }

          const clickable = row.status !== 'done' && row.status !== 'skipped';
          const isDone = row.status === 'done';
          const isInProgress = row.status === 'in_progress';
          const isSkipped = row.status === 'skipped';

          let circleCls = 'border-border bg-bg text-muted-foreground';
          let icon = null;

          if (isDone) {
            circleCls =
              'border-[#10b981] bg-[#10b981]/10 text-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.4)]';
            icon = <Icon name="Check" size={12} strokeWidth={3} />;
          } else if (isInProgress) {
            circleCls =
              'border-[#3b82f6] bg-[#3b82f6]/20 text-[#3b82f6] shadow-[0_0_12px_rgba(59,130,246,0.6)] animate-pulse';
            icon = (
              <div className="w-2 h-2 rounded-full bg-[#3b82f6] animate-ping" />
            );
          } else if (isSkipped) {
            circleCls = 'border-border bg-bg border-dashed opacity-50';
            icon = <Icon name="Ban" size={12} />;
          } else {
            // pending
            circleCls =
              'border-border bg-bg hover:border-[#3b82f6]/50 transition-colors text-muted-foreground';
            icon = <div className="w-1.5 h-1.5 rounded-full bg-border" />;
          }

          // Tính chất đường nối (Line) - Nếu node hiện tại Done, line tới nối next sẽ sáng
          const hasNextDone = !!(
            idx < PRODUCTION_STAGES.length - 1 &&
            stages.find((s) => s.stage === PRODUCTION_STAGES[idx + 1])
              ?.status === 'done'
          );
          const lineCls =
            isDone || hasNextDone
              ? 'bg-[#10b981] shadow-[0_0_5px_rgba(16,185,129,0.4)]'
              : 'bg-border';

          return (
            <div key={row.id} className="flex items-center">
              <button
                type="button"
                disabled={isPendingUpdate || !clickable}
                onClick={() => {
                  if (clickable && onAdvance) onAdvance(row);
                }}
                className={`relative z-10 flex flex-col items-center gap-1.5 group w-[3.8rem] ${
                  clickable
                    ? 'cursor-pointer hover:scale-110 active:scale-95 transition-transform'
                    : 'cursor-default'
                }`}
                title={`${STAGE_LABELS[stageKey]}: ${STAGE_STATUS_LABELS[row.status]}${
                  clickable ? ' — Nhấn để chuyển trạng thái' : ''
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${circleCls}`}
                >
                  {icon}
                </div>
                <span
                  className={`text-[0.62rem] font-medium whitespace-nowrap transition-colors ${
                    isInProgress || isDone
                      ? 'text-foreground'
                      : 'text-muted-foreground opacity-70 group-hover:opacity-100 group-hover:text-foreground'
                  }`}
                >
                  {STAGE_LABELS[stageKey]}
                </span>

                {/* Level Up Hint effect on hover */}
                {clickable && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-[#3b82f6]">
                    <Icon name="ArrowUpCircle" size={14} />
                  </div>
                )}
              </button>

              {idx < PRODUCTION_STAGES.length - 1 && (
                <div
                  className={`w-10 h-[2px] mx-[-0.8rem] relative z-0 transition-colors ${lineCls}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
