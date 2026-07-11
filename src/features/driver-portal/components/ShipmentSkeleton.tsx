import { Icon } from '@/shared/components';
import { DRIVER_PORTAL_MESSAGES } from '@/features/driver-portal/constants';

export function ShipmentSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* Loading header text (optional) */}
      <div className="text-center p-4 pb-0 text-[var(--text-tertiary)] flex flex-col items-center gap-2">
        <Icon
          name="Loader2"
          size={24}
          className="animate-spin text-[var(--primary)]"
        />
        <p className="text-sm font-medium text-[var(--muted)]">
          {DRIVER_PORTAL_MESSAGES.PAGE.LOADING_SHIPMENTS}
        </p>
      </div>

      {/* 3 Skeleton Cards */}
      {[1, 2, 3].map((key) => (
        <div
          key={key}
          className="bg-[var(--surface)] rounded-xl border-2 border-[var(--border)] overflow-hidden"
        >
          <div className="flex items-start gap-3 w-full p-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--surface-subtle)] animate-pulse shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <div className="flex items-start justify-between gap-4">
                <div className="h-4 bg-[var(--surface-subtle)] animate-pulse rounded w-1/3" />
                <div className="w-8 h-8 rounded-full bg-[var(--surface-subtle)] animate-pulse shrink-0" />
              </div>
              <div className="h-3 bg-[var(--surface-subtle)] animate-pulse rounded w-1/2" />
              <div className="h-5 bg-[var(--surface-subtle)] animate-pulse rounded-full w-24 mt-2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
