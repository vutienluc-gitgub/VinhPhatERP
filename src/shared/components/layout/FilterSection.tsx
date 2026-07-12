import type { ReactNode } from 'react';

import { cn } from '@/shared/utils/cn';

interface FilterSectionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Khu vực chứa các bộ lọc (Level 3 Architecture).
 */
export function FilterSection({ children, className }: FilterSectionProps) {
  return <div className={cn('mb-4', className)}>{children}</div>;
}
