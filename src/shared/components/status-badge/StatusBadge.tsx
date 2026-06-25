import { Badge } from '@/shared/components';

import { FALLBACK_STATUS_CONFIG } from './status-badge.constants';
import type { StatusBadgeProps } from './status-badge.types';

export function StatusBadge<T extends string>({
  status,
  configMap,
  className,
}: StatusBadgeProps<T>) {
  if (!status) return null;

  const knownConfig = (
    configMap as Record<string, typeof FALLBACK_STATUS_CONFIG>
  )[status];

  if (!knownConfig) {
    if (import.meta.env.DEV) {
      console.warn(`[StatusBadge] Unknown status: "${status}"`);
    }
    return (
      <Badge
        variant={FALLBACK_STATUS_CONFIG.variant}
        showDot
        className={className}
      >
        {FALLBACK_STATUS_CONFIG.label}
      </Badge>
    );
  }

  return (
    <Badge variant={knownConfig.variant} showDot className={className}>
      {knownConfig.label}
    </Badge>
  );
}
