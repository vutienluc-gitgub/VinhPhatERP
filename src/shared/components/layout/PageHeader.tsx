import type { ReactNode } from 'react';

import { cn } from '@/shared/utils/cn';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

/**
 * Tiêu đề trang (Level 3 Architecture).
 * Giữ ngữ cảnh (Title + Subtitle) và tích hợp nút Primary/Secondary Actions
 * ở góc trên bên trái để thuận tiện theo F-pattern.
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0',
        className,
      )}
    >
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>

      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
