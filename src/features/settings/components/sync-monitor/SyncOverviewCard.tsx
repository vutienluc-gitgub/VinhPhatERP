import type { IntegrationConnection } from '@/api/sync.api';
import { Button, Icon } from '@/shared/components';
import { SYNC_MONITOR_LABELS } from '@/features/settings/sync-monitor.constants';
import { formatDateTime } from '@/features/settings/sync-monitor.utils';

interface SyncOverviewCardProps {
  connection: IntegrationConnection | null | undefined;
  isLoadingConn: boolean;
  totalFailed: number;
  isTesting: boolean;
  isRetryingAll: boolean;
  isPullingImport: boolean;
  isReconciling: boolean;
  onTestConn: () => void;
  onRetryAll: () => void;
  onRefresh: () => void;
  onPullImport: () => void;
  onReconcile: () => void;
}

export function SyncOverviewCard({
  connection,
  isLoadingConn,
  totalFailed,
  isTesting,
  isRetryingAll,
  isPullingImport,
  isReconciling,
  onTestConn,
  onRetryAll,
  onRefresh,
  onPullImport,
  onReconcile,
}: SyncOverviewCardProps) {
  const isConnected = connection?.status === 'active';
  const isError = connection?.status === 'error';
  const spreadsheetId =
    connection?.config?.spreadsheet_id || SYNC_MONITOR_LABELS.UNCONFIGURED;
  const serviceAccount =
    connection?.config?.service_account_email ||
    SYNC_MONITOR_LABELS.UNCONFIGURED;

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success-soft/20 text-success flex items-center justify-center shrink-0">
              <Icon name="FileSpreadsheet" size={20} strokeWidth={1.5} />
            </div>
            <div>
              <span className="font-bold text-base text-foreground block">
                {SYNC_MONITOR_LABELS.CONNECTION_TITLE}
              </span>
              <span className="text-xs text-muted">
                {SYNC_MONITOR_LABELS.CONNECTION_SUBTITLE}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div>
              {isLoadingConn ? (
                <span className="text-xs text-muted">
                  {SYNC_MONITOR_LABELS.LOADING_ELLIPSIS}
                </span>
              ) : isConnected ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-success-soft text-success">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  {SYNC_MONITOR_LABELS.STATUS_CONNECTED}
                </span>
              ) : isError ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-danger-soft text-danger">
                  <span className="w-2 h-2 rounded-full bg-danger" />
                  {SYNC_MONITOR_LABELS.STATUS_ERROR}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-surface-secondary text-muted">
                  <span className="w-2 h-2 rounded-full bg-muted" />
                  {SYNC_MONITOR_LABELS.STATUS_DISCONNECTED}
                </span>
              )}
            </div>

            <Button
              variant="secondary"
              type="button"
              onClick={onRefresh}
              className="flex items-center gap-1.5 text-xs"
            >
              <Icon name="RotateCcw" size={14} />
              {SYNC_MONITOR_LABELS.BTN_REFRESH}
            </Button>

            <Button
              variant="secondary"
              type="button"
              disabled={isTesting}
              onClick={onTestConn}
              className="flex items-center gap-1.5 text-xs"
            >
              <Icon
                name="Check"
                size={14}
                className={isTesting ? 'animate-spin' : ''}
              />
              {isTesting
                ? SYNC_MONITOR_LABELS.BTN_TESTING
                : SYNC_MONITOR_LABELS.BTN_TEST_CONNECTION}
            </Button>

            <Button
              variant="secondary"
              type="button"
              disabled={isPullingImport}
              onClick={onPullImport}
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary"
            >
              <Icon
                name="ArrowUp"
                size={14}
                className={`rotate-180 ${isPullingImport ? 'animate-bounce' : ''}`}
              />
              {isPullingImport
                ? SYNC_MONITOR_LABELS.BTN_PULLING_IMPORT
                : SYNC_MONITOR_LABELS.BTN_PULL_IMPORT}
            </Button>

            <Button
              variant="secondary"
              type="button"
              disabled={isReconciling}
              onClick={onReconcile}
              className="flex items-center gap-1.5 text-xs text-info hover:text-info"
            >
              <Icon
                name="RotateCcw"
                size={14}
                className={isReconciling ? 'animate-spin' : ''}
              />
              {isReconciling
                ? SYNC_MONITOR_LABELS.BTN_RECONCILING
                : SYNC_MONITOR_LABELS.BTN_FORCE_RECONCILE}
            </Button>

            <Button
              variant="primary"
              type="button"
              disabled={totalFailed === 0 || isRetryingAll}
              onClick={onRetryAll}
              className="flex items-center gap-1.5 text-xs"
            >
              <Icon
                name="RotateCcw"
                size={14}
                className={isRetryingAll ? 'animate-spin' : ''}
              />
              {isRetryingAll
                ? SYNC_MONITOR_LABELS.BTN_RETRYING
                : SYNC_MONITOR_LABELS.BTN_RETRY_FAILED}
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-3.5 rounded-lg bg-surface-secondary border border-border/50">
          <span className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">
            {SYNC_MONITOR_LABELS.SPREADSHEET_ID}
          </span>
          <span className="font-mono text-xs text-foreground select-all break-all">
            {spreadsheetId}
          </span>
        </div>

        <div className="p-3.5 rounded-lg bg-surface-secondary border border-border/50">
          <span className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">
            {SYNC_MONITOR_LABELS.SERVICE_ACCOUNT_EMAIL}
          </span>
          <span className="font-mono text-xs text-foreground select-all break-all">
            {serviceAccount}
          </span>
        </div>

        <div className="p-3.5 rounded-lg bg-surface-secondary border border-border/50">
          <span className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">
            {SYNC_MONITOR_LABELS.LAST_SYNCED_AT}
          </span>
          <span className="text-xs font-semibold text-foreground">
            {connection?.last_synced_at
              ? formatDateTime(connection.last_synced_at)
              : SYNC_MONITOR_LABELS.NEVER_SYNCED}
          </span>
        </div>
      </div>
    </div>
  );
}
