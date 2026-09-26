import type { ActivityItem } from '@/domain/operations/types';
import { cn } from '@/shared/utils/cn';

export function ActivityFeed({
  items,
  className,
}: {
  items: ActivityItem[];
  className?: string;
}) {
  return (
    <ul className={cn('space-y-3', className)}>
      {items.map((a) => (
        <li key={a.id} className="flex items-start gap-3">
          <span
            className={cn(
              'h-8 w-8 shrink-0 rounded-full text-inverse-foreground text-xs font-semibold flex items-center justify-center',
              a.avatarColor ?? 'bg-info-soft',
            )}
          >
            {a.actor.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm text-foreground">
              <span className="font-semibold text-foreground">{a.actor}</span>{' '}
              <span className="text-muted">{a.action}</span>
            </div>
            <div className="text-xs text-muted mt-0.5">{a.time}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}
