import { clsx, type ClassValue } from 'clsx';

function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export type ProgressRow = {
  label: string;
  value: number;
  max?: number;
  right?: string;
  color?: string;
};

export function ProgressList({
  rows,
  className,
}: {
  rows: ProgressRow[];
  className?: string;
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {rows.map((r) => {
        const max = r.max ?? 100;
        const pct =
          max === 0 ? 0 : Math.min(100, Math.round((r.value / max) * 100));
        return (
          <div key={r.label}>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-zinc-700 font-medium truncate">
                {r.label}
              </span>
              <span className="text-zinc-500 text-xs shrink-0">
                {r.right ?? `${r.value}/${max}`}
              </span>
            </div>
            <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: r.color ?? '#6366f1' }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
