import { cn } from '@/shared/utils/cn';

interface ProgressBarProps {
  value: number; // 0-100+
  max?: number;
  className?: string;
  barClassName?: string;
  colorScheme?: 'auto' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  className,
  barClassName,
  colorScheme = 'auto',
  size = 'md',
  showLabel = false,
}: ProgressBarProps) {
  // Calculate percentage safely
  const percent = max > 0 ? Math.round((value / max) * 100) : 0;

  // Determine width: cap at 100% so it doesn't overflow the container
  // Only set width > 0 if percent is actually > 0.
  const widthStr = `${Math.min(100, Math.max(0, percent))}%`;

  // Determine color
  let colorClass = 'bg-primary';
  if (colorScheme === 'auto') {
    if (percent === 0) colorClass = 'bg-surface-strong';
    else if (percent < 50) colorClass = 'bg-danger';
    else if (percent < 100) colorClass = 'bg-warning';
    else if (percent === 100) colorClass = 'bg-success';
    else colorClass = 'bg-info'; // >100% over-delivery
  } else {
    const colors = {
      primary: 'bg-primary',
      success: 'bg-success',
      warning: 'bg-warning',
      danger: 'bg-danger',
      info: 'bg-info',
    };
    colorClass = colors[colorScheme];
  }

  // Determine height
  const heightClass = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }[size];

  return (
    <div
      className={cn('flex flex-col gap-1.5 w-full', className)}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {showLabel && (
        <div className="flex justify-between items-end mb-1">
          <span
            className={cn(
              'text-xs font-bold',
              percent >= 100 ? 'text-success' : 'text-secondary',
            )}
          >
            {percent}%
          </span>
        </div>
      )}
      <div
        className={cn(
          'w-full bg-surface-secondary rounded-full overflow-hidden border border-border/50',
          heightClass,
        )}
      >
        <div
          className={cn(
            'h-full transition-all duration-500 rounded-full',
            colorClass,
            barClassName,
          )}
          style={{ width: widthStr }}
        />
      </div>
    </div>
  );
}
