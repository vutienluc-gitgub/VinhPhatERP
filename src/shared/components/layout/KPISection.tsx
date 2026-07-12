import type { ReactNode } from 'react';

import { cn } from '@/shared/utils/cn';

interface KPISectionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Khu vực chứa các thẻ KPI (Level 3 Architecture).
 */
export function KPISection({ children, className }: KPISectionProps) {
  return <div className={cn('mb-2', className)}>{children}</div>;
}
