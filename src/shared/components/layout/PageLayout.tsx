import type { ReactNode } from 'react';

import { cn } from '@/shared/utils/cn';

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
}

/**
 * Thẻ bọc ngoài cùng cho toàn bộ trang danh sách (List Page)
 * Đảm bảo layout đồng nhất (Level 3 Architecture).
 */
export function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <div className={cn('flex flex-col gap-6 min-w-0', className)}>
      {children}
    </div>
  );
}
