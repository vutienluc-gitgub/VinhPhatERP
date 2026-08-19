import type { MouseEvent } from 'react';

import { Badge } from '@/shared/components/Badge';

import { getStatusConfig, type StatusDomain } from './status.config';

export interface StatusBadgeProps {
  domain: StatusDomain;
  status: string | number | boolean;
  progress?: number | null;
  showDot?: boolean;
  className?: string;
  /** Pass to enable contextual quick filter on this badge */
  onFilter?: (e: MouseEvent<HTMLButtonElement>) => void;
  /** Default: "Nhấn để lọc" */
  filterTooltip?: string;
}

export function StatusBadge({
  domain,
  status,
  progress,
  showDot = true,
  className,
  onFilter,
  filterTooltip,
}: StatusBadgeProps) {
  const config = getStatusConfig(domain, status);

  // Props chung cho Badge — spread conditionally để giữ discriminated union
  const filterProps = onFilter ? ({ onFilter, filterTooltip } as const) : {};

  if (!config) {
    return (
      <Badge variant="gray" className={className} {...filterProps}>
        {String(status)}
      </Badge>
    );
  }

  const badgeNode = (
    <Badge
      variant={config.variant}
      showDot={showDot}
      className={className}
      {...filterProps}
    >
      {config.label}
    </Badge>
  );

  if (typeof progress === 'number') {
    const p = Math.min(100, Math.max(0, progress));
    return (
      <div className="flex flex-col gap-1.5 w-full min-w-[100px]">
        <div className="flex justify-between items-center gap-2">
          {badgeNode}
          <span className="text-xs font-medium text-muted-foreground">
            {p}%
          </span>
        </div>
        <div className="w-full h-1.5 bg-surface-secondary rounded-full overflow-hidden">
          <div
            className={`h-full ${p >= 100 ? 'bg-success' : p > 0 ? 'bg-warning' : 'bg-surface-strong'}`}
            style={{ width: `${p}%` }}
          />
        </div>
      </div>
    );
  }

  return badgeNode;
}
