import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface LiveIndicatorProps {
  label?: string | ReactNode;
  className?: string;
  dotClassName?: string;
}

/**
 * Premium Micro-Animation Component
 * Displays a pulsing real-time indicator dot for "Live" states.
 */
export function LiveIndicator({
  label,
  className,
  dotClassName,
}: LiveIndicatorProps) {
  return (
    <div className={clsx('inline-flex items-center gap-2', className)}>
      <span className={clsx('live-dot', dotClassName)} />
      {label && (
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
          {label}
        </span>
      )}
    </div>
  );
}
