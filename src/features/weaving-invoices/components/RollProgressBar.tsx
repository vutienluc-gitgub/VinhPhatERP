import { clsx } from 'clsx';

interface RollProgressBarProps {
  scanned: number;
  total: number;
  totalKg: number;
  totalAmount: number;
  formatCurrency: (v: number) => string;
}

export function RollProgressBar({
  scanned,
  total,
  totalKg,
  totalAmount,
  formatCurrency,
}: RollProgressBarProps) {
  const pct = total > 0 ? Math.min(100, (scanned / total) * 100) : 0;
  const isComplete = scanned >= total && total > 0;

  return (
    <div
      className={clsx(
        'rounded-2xl border p-4 transition-all duration-500',
        isComplete
          ? 'bg-emerald-50 border-emerald-300'
          : 'bg-[var(--surface-raised)] border-[var(--border)]',
      )}
    >
      {/* Top row: progress label + stats */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span
            className={clsx(
              'text-2xl font-black tabular-nums transition-colors',
              isComplete ? 'text-emerald-600' : 'text-[var(--text-primary)]',
            )}
          >
            {scanned}
            <span className="text-base font-medium text-[var(--text-secondary)]">
              {' '}
              / {total}
            </span>
          </span>
          <span className="text-sm font-semibold text-[var(--text-secondary)]">
            {isComplete ? 'Hoàn thành!' : 'cuộn đã nhập'}
          </span>
        </div>

        <div className="flex gap-4 text-sm text-[var(--text-secondary)]">
          <span>
            Tổng KG:{' '}
            <strong className="text-[var(--text-primary)]">
              {totalKg.toFixed(2)}
            </strong>
          </span>
          <span>
            Thành tiền:{' '}
            <strong className="text-[var(--text-primary)]">
              {formatCurrency(totalAmount)} đ
            </strong>
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-3 w-full rounded-full bg-[var(--surface-subtle)] overflow-hidden">
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-700 ease-out',
            isComplete
              ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
              : 'bg-gradient-to-r from-indigo-400 to-indigo-600',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
