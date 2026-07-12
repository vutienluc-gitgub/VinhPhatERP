import type { ReactNode } from 'react';

import { cn } from '@/shared/utils/cn';

interface TableSectionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Khu vực chứa bảng dữ liệu (Level 3 Architecture).
 */
export function TableSection({ children, className }: TableSectionProps) {
  return <div className={cn('flex-1', className)}>{children}</div>;
}
