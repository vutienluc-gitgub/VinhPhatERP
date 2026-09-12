import type { SyncStats } from '@/api/sync.api';
import { SYNC_MONITOR_LABELS } from '@/features/settings/sync-monitor.constants';

interface SyncMetricsGridProps {
  stats: SyncStats | null | undefined;
}

export function SyncMetricsGrid({ stats }: SyncMetricsGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="p-4 rounded-xl bg-surface border border-border/50 shadow-sm flex flex-col justify-between">
        <div>
          <span className="text-xs text-muted block mb-1 font-medium">
            {SYNC_MONITOR_LABELS.STAT_PENDING_LABEL}
          </span>
          <span className="text-2xl font-extrabold text-foreground">
            {stats?.pending ?? 0}
          </span>
        </div>
        <span className="text-xs text-muted mt-2 block">
          {SYNC_MONITOR_LABELS.STAT_PENDING_DESC}
        </span>
      </div>

      <div className="p-4 rounded-xl bg-surface border border-success/30 shadow-sm flex flex-col justify-between">
        <div>
          <span className="text-xs text-success block mb-1 font-medium">
            {SYNC_MONITOR_LABELS.STAT_SUCCESS_TODAY_LABEL}
          </span>
          <span className="text-2xl font-extrabold text-success">
            {stats?.successToday ?? 0}
          </span>
        </div>
        <span className="text-xs text-muted mt-2 block">
          {SYNC_MONITOR_LABELS.STAT_SUCCESS_TODAY_DESC}
        </span>
      </div>

      <div className="p-4 rounded-xl bg-surface border border-warning/30 shadow-sm flex flex-col justify-between">
        <div>
          <span className="text-xs text-warning block mb-1 font-medium">
            {SYNC_MONITOR_LABELS.STAT_FAILED_LABEL}
          </span>
          <span className="text-2xl font-extrabold text-warning">
            {stats?.failed ?? 0}
          </span>
        </div>
        <span className="text-xs text-muted mt-2 block">
          {SYNC_MONITOR_LABELS.STAT_FAILED_DESC}
        </span>
      </div>

      <div className="p-4 rounded-xl bg-surface border border-danger/30 shadow-sm flex flex-col justify-between">
        <div>
          <span className="text-xs text-danger block mb-1 font-medium">
            {SYNC_MONITOR_LABELS.STAT_DEAD_LETTER_LABEL}
          </span>
          <span className="text-2xl font-extrabold text-danger">
            {stats?.deadLetter ?? 0}
          </span>
        </div>
        <span className="text-xs text-muted mt-2 block">
          {SYNC_MONITOR_LABELS.STAT_DEAD_LETTER_DESC}
        </span>
      </div>
    </div>
  );
}
