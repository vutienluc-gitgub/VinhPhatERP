import type { SyncJobRow, SyncLog } from '@/api/sync.api';
import { Button, Icon, EmptyState } from '@/shared/components';
import { SYNC_MONITOR_LABELS } from '@/features/settings/sync-monitor.constants';
import {
  formatDateTime,
  getJobCode,
} from '@/features/settings/sync-monitor.utils';

interface SyncJobLogsDrawerProps {
  selectedJob: SyncJobRow | undefined;
  selectedJobId: string | null;
  logs: SyncLog[];
  isLoadingLogs: boolean;
  onClose: () => void;
}

export function SyncJobLogsDrawer({
  selectedJob,
  selectedJobId,
  logs,
  isLoadingLogs,
  onClose,
}: SyncJobLogsDrawerProps) {
  if (!selectedJobId) return null;

  return (
    <div className="panel-card card-flush border-2 border-primary/20 animate-fade-in">
      <div className="card-header-area bg-surface-secondary/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Icon name="FileText" size={16} />
            </div>
            <div>
              <span className="font-bold text-sm text-foreground block">
                {SYNC_MONITOR_LABELS.LOGS_TITLE} —{' '}
                <span className="font-mono text-primary">
                  {selectedJob
                    ? getJobCode(selectedJob)
                    : selectedJobId.slice(0, 8)}
                </span>
              </span>
              <span className="text-xs text-muted">
                Sync ID:{' '}
                <span className="font-mono">{selectedJob?.sync_id}</span>
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            type="button"
            onClick={onClose}
            className="p-1.5 h-auto text-muted hover:text-foreground"
          >
            <Icon name="X" size={16} />
          </Button>
        </div>
      </div>

      <div className="p-6">
        {isLoadingLogs ? (
          <div className="py-8 text-center text-xs text-muted">
            {SYNC_MONITOR_LABELS.LOADING_LOGS}
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            title={SYNC_MONITOR_LABELS.EMPTY_LOGS_TITLE}
            description={SYNC_MONITOR_LABELS.EMPTY_LOGS_DESC}
            icon="MessageSquare"
          />
        ) : (
          <div className="flex flex-col gap-3">
            {logs.map((log: SyncLog) => (
              <div
                key={log.id}
                className="p-3 rounded-lg bg-surface-secondary border border-border/40 text-xs flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded font-bold uppercase ${
                        log.level === 'error'
                          ? 'bg-danger-soft text-danger'
                          : log.level === 'warn'
                            ? 'bg-warning-soft text-warning'
                            : 'bg-info-soft text-info'
                      }`}
                    >
                      {log.level}
                    </span>
                    <span className="font-semibold text-foreground">
                      {log.message}
                    </span>
                  </div>
                  <span className="text-muted font-mono">
                    {formatDateTime(log.created_at)}
                  </span>
                </div>

                {log.details && Object.keys(log.details).length > 0 && (
                  <pre className="p-2.5 rounded bg-surface text-muted text-[11px] font-mono overflow-x-auto mt-1 border border-border/30">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
