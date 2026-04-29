/**
 * FulfillmentProgressBar — Progress bar inline cho tỉ lệ hoàn thành.
 */

interface FulfillmentProgressBarProps {
  value: number; // 0-100+
  className?: string;
}

export function FulfillmentProgressBar({
  value,
  className = '',
}: FulfillmentProgressBarProps) {
  const clampedValue = Math.min(value, 100);
  const isComplete = value >= 100;
  const isOverHalf = value >= 50;

  const barColor = isComplete
    ? 'bg-emerald-500'
    : isOverHalf
      ? 'bg-blue-500'
      : 'bg-amber-500';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden min-w-[60px]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      <span
        className={`text-xs font-bold tabular-nums min-w-[40px] text-right ${
          isComplete
            ? 'text-emerald-600'
            : isOverHalf
              ? 'text-blue-600'
              : 'text-amber-600'
        }`}
      >
        {value.toFixed(1)}%
      </span>
    </div>
  );
}
