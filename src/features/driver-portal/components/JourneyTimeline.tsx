import { Icon } from '@/shared/components';
import type { DeliveryAttemptState } from '@/domain/logistics';

export interface JourneyTimelineProps {
  currentState: DeliveryAttemptState;
  className?: string;
}

interface StepInfo {
  state: DeliveryAttemptState;
  label: string;
  iconName:
    | 'ClipboardList'
    | 'PackageCheck'
    | 'Truck'
    | 'MapPin'
    | 'CheckCircle2';
}

const TIMELINE_STEPS: readonly StepInfo[] = [
  { state: 'assigned', label: 'Chờ nhận', iconName: 'ClipboardList' },
  { state: 'pending_pickup', label: 'Lấy hàng', iconName: 'PackageCheck' },
  { state: 'in_transit', label: 'Đang đi', iconName: 'Truck' },
  { state: 'arrived', label: 'Đã đến', iconName: 'MapPin' },
  { state: 'delivered', label: 'Đã ký nhận', iconName: 'CheckCircle2' },
] as const;

function getStepIndex(state: DeliveryAttemptState): number {
  if (state === 'assigned') return 0;
  if (state === 'pending_pickup') return 1;
  if (state === 'picked_up' || state === 'in_transit') return 2;
  if (state === 'arrived') return 3;
  if (state === 'delivered' || state === 'completed') return 4;
  return -1;
}

export function JourneyTimeline({
  currentState,
  className = '',
}: JourneyTimelineProps) {
  const currentIdx = getStepIndex(currentState);
  const isException = currentState === 'failed_attempt';

  return (
    <div className={`w-full py-3 ${className}`}>
      <div className="flex items-center justify-between relative">
        {/* Background Connecting Line */}
        <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-0.5 bg-[var(--border)] z-0" />

        {TIMELINE_STEPS.map((step, idx) => {
          const isPassed = currentIdx > idx;
          const isCurrent = currentIdx === idx;

          return (
            <div
              key={step.state}
              className="flex flex-col items-center relative z-10"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  isPassed
                    ? 'bg-[var(--success)] text-[var(--success-foreground)]'
                    : isCurrent
                      ? 'bg-[var(--primary)] text-[var(--primary-foreground)] ring-4 ring-[var(--primary-subtle)]'
                      : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)] border border-[var(--border)]'
                }`}
              >
                <Icon name={step.iconName} size={14} />
              </div>
              <span
                className={`text-[10px] mt-1 font-medium whitespace-nowrap ${
                  isCurrent
                    ? 'text-[var(--primary)] font-bold'
                    : isPassed
                      ? 'text-[var(--foreground)]'
                      : 'text-[var(--muted-foreground)]'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {isException && (
        <div className="mt-3 p-2 bg-[var(--destructive-subtle)] text-[var(--destructive)] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5">
          <Icon name="AlertTriangle" size={14} />
          <span>Đang gặp sự cố — Chờ xử lý hoặc giao lại</span>
        </div>
      )}
    </div>
  );
}
