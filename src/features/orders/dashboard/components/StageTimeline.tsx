/**
 * StageTimeline — Hiển thị 7 stages sản xuất dạng timeline compact.
 */
import { STAGE_LABELS } from '@/schema/order-progress.schema';
import type { ProductionStage } from '@/schema/order-progress.schema';

const STAGES: ProductionStage[] = [
  'warping',
  'weaving',
  'greige_check',
  'dyeing',
  'finishing',
  'final_check',
  'packing',
];

interface StageTimelineProps {
  completedStages: number;
  totalStages: number;
}

export function StageTimeline({
  completedStages,
  totalStages,
}: StageTimelineProps) {
  if (totalStages === 0) {
    return (
      <span className="text-[10px] text-zinc-400 italic">Chưa có tiến độ</span>
    );
  }

  return (
    <div className="flex items-center gap-0.5">
      {STAGES.map((stage, i) => {
        const isDone = i < completedStages;
        return (
          <div
            key={stage}
            title={STAGE_LABELS[stage]}
            className={`h-2 flex-1 rounded-sm transition-colors ${
              isDone ? 'bg-emerald-500' : 'bg-zinc-200'
            }`}
          />
        );
      })}
      <span className="text-[10px] font-medium text-zinc-500 ml-1.5 tabular-nums">
        {completedStages}/{totalStages}
      </span>
    </div>
  );
}
