import { clsx, type ClassValue } from 'clsx';

import { ActivityItem } from '@/features/operations/types';

function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

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
              'h-8 w-8 shrink-0 rounded-full text-white text-xs font-semibold flex items-center justify-center',
              a.avatarColor ?? 'bg-indigo-600',
            )}
          >
            {a.actor.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm text-zinc-800">
              <span className="font-medium text-zinc-900">{a.actor}</span>{' '}
              <span className="text-zinc-600">{a.action}</span>
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">{a.time}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}
