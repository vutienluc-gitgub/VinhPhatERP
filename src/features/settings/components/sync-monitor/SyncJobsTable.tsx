import type { SyncJobRow } from '@/api/sync.api';
import { Button, Icon, EmptyState, TableSkeleton } from '@/shared/components';
import {
  SYNC_MONITOR_LABELS,
  SYNC_MONITOR_MESSAGES,
} from '@/features/settings/sync-monitor.constants';
import {
  formatDateTime,
  getJobCode,
  getJobEntityLabel,
} from '@/features/settings/sync-monitor.utils';

interface SyncJobsTableProps {
  jobs: SyncJobRow[];
  isLoadingJobs: boolean;
  jobsError: unknown;
  selectedJobId: string | null;
  isRetryingSingle: boolean;
  onSelectJob: (id: string | null) => void;
  onRetrySingle: (id: string) => void;
}

function renderStatusBadge(status: SyncJobRow['status']) {
  switch (status) {
    case 'success':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success-soft text-success">
          <span className="w-1.5 h-1.5 rounded-full bg-success" />
          {SYNC_MONITOR_LABELS.STATUS_JOB_SUCCESS}
        </span>
      );
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-secondary text-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-muted" />
          {SYNC_MONITOR_LABELS.STATUS_JOB_PENDING}
        </span>
      );
    case 'processing':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-info-soft text-info">
          <span className="w-1.5 h-1.5 rounded-full bg-info animate-pulse" />
          {SYNC_MONITOR_LABELS.STATUS_JOB_PROCESSING}
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-warning-soft text-warning">
          <span className="w-1.5 h-1.5 rounded-full bg-warning" />
          {SYNC_MONITOR_LABELS.STATUS_JOB_FAILED}
        </span>
      );
    case 'dead_letter':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-danger-soft text-danger">
          <span className="w-1.5 h-1.5 rounded-full bg-danger" />
          {SYNC_MONITOR_LABELS.STATUS_JOB_DEAD_LETTER}
        </span>
      );
    default:
      return null;
  }
}

export function SyncJobsTable({
  jobs,
  isLoadingJobs,
  jobsError,
  selectedJobId,
  isRetryingSingle,
  onSelectJob,
  onRetrySingle,
}: SyncJobsTableProps) {
  return (
    <div className="panel-card card-flush">
      <div className="card-header-area">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold text-base text-foreground block">
              {SYNC_MONITOR_LABELS.TABLE_TITLE}
            </span>
            <span className="text-xs text-muted">
              {SYNC_MONITOR_LABELS.TABLE_SUBTITLE}
            </span>
          </div>
          <span className="text-xs font-semibold px-2 py-1 rounded bg-surface-secondary text-muted">
            {jobs.length} {SYNC_MONITOR_LABELS.TASK_COUNT_SUFFIX}
          </span>
        </div>
      </div>

      {jobsError ? (
        <div className="p-6">
          <p className="error-inline m-0">
            {SYNC_MONITOR_MESSAGES.LOAD_ERROR}{' '}
            {jobsError instanceof Error ? jobsError.message : String(jobsError)}
          </p>
        </div>
      ) : null}

      {isLoadingJobs ? (
        <div className="p-6">
          <TableSkeleton rows={5} columns={6} />
        </div>
      ) : jobs.length === 0 ? (
        <div className="p-6">
          <EmptyState
            title={SYNC_MONITOR_LABELS.EMPTY_JOBS_TITLE}
            description={SYNC_MONITOR_LABELS.EMPTY_JOBS_DESC}
            icon="FileSpreadsheet"
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-secondary/40 text-muted uppercase font-bold">
                <th className="py-3 px-4">{SYNC_MONITOR_LABELS.COL_ENTITY}</th>
                <th className="py-3 px-4">{SYNC_MONITOR_LABELS.COL_NUMBER}</th>
                <th className="py-3 px-4">
                  {SYNC_MONITOR_LABELS.COL_DIRECTION}
                </th>
                <th className="py-3 px-4">{SYNC_MONITOR_LABELS.COL_STATUS}</th>
                <th className="py-3 px-4">{SYNC_MONITOR_LABELS.COL_RETRIES}</th>
                <th className="py-3 px-4">
                  {SYNC_MONITOR_LABELS.COL_CREATED_AT}
                </th>
                <th className="py-3 px-4 text-right">
                  {SYNC_MONITOR_LABELS.COL_ACTIONS}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {jobs.map((job) => (
                <tr
                  key={job.id}
                  className={`hover:bg-surface-secondary/50 transition-colors ${
                    selectedJobId === job.id ? 'bg-primary/5' : ''
                  }`}
                >
                  <td className="py-3 px-4 font-semibold text-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Icon
                        name={
                          job.entity_type === 'shipment' ? 'FileText' : 'Clock'
                        }
                        size={14}
                        className="text-muted"
                      />
                      {getJobEntityLabel(job.entity_type)}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-foreground">
                    {getJobCode(job)}
                  </td>
                  <td className="py-3 px-4 text-muted">
                    {job.direction === 'outbound'
                      ? SYNC_MONITOR_LABELS.DIR_OUTBOUND
                      : SYNC_MONITOR_LABELS.DIR_INBOUND}
                  </td>
                  <td className="py-3 px-4">{renderStatusBadge(job.status)}</td>
                  <td className="py-3 px-4 font-mono text-muted">
                    {job.attempt_count} / {job.max_attempts}
                  </td>
                  <td className="py-3 px-4 text-muted">
                    {formatDateTime(job.created_at)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {(job.status === 'failed' ||
                        job.status === 'dead_letter') && (
                        <Button
                          variant="secondary"
                          type="button"
                          disabled={isRetryingSingle}
                          onClick={() => onRetrySingle(job.id)}
                          className="text-xs py-1 px-2.5 h-auto flex items-center gap-1 text-warning hover:text-warning"
                        >
                          <Icon name="RotateCcw" size={12} />
                          {SYNC_MONITOR_LABELS.BTN_RETRY_SINGLE}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        type="button"
                        onClick={() =>
                          onSelectJob(selectedJobId === job.id ? null : job.id)
                        }
                        className="text-xs py-1 px-2.5 h-auto flex items-center gap-1 text-muted hover:text-foreground"
                      >
                        <Icon name="MessageSquare" size={12} />
                        {SYNC_MONITOR_LABELS.BTN_VIEW_LOGS}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
