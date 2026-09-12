import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button, Icon } from '@/shared/components';
import {
  useGoogleSheetsConnection,
  useSyncStats,
  useTestConnection,
} from '@/application/settings';

import {
  SYNC_MONITOR_LABELS,
  SYNC_MONITOR_MESSAGES,
} from './sync-monitor.constants';

export function GoogleSheetsIntegrationCard() {
  const navigate = useNavigate();
  const { data: connection, isLoading: isLoadingConnection } =
    useGoogleSheetsConnection();
  const { data: stats } = useSyncStats();
  const testMutation = useTestConnection();
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  async function handleTestConnection() {
    setTestResult(null);
    try {
      const res = await testMutation.mutateAsync();
      setTestResult(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setTestResult({
        success: false,
        message: `${SYNC_MONITOR_MESSAGES.TEST_ERROR} ${msg}`,
      });
    }
  }

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success-soft/20 text-success flex items-center justify-center shrink-0">
              <Icon name="FileSpreadsheet" size={20} strokeWidth={1.5} />
            </div>
            <div>
              <span className="font-bold text-lg text-foreground block">
                {SYNC_MONITOR_LABELS.CONNECTION_TITLE}
              </span>
              <span className="text-xs text-muted">
                {SYNC_MONITOR_LABELS.CONNECTION_SUBTITLE}
              </span>
            </div>
          </div>

          <div>
            {isLoadingConnection ? (
              <span className="text-xs text-muted">
                {SYNC_MONITOR_LABELS.LOADING_ELLIPSIS}
              </span>
            ) : isConnected ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-success-soft text-success">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                {SYNC_MONITOR_LABELS.STATUS_CONNECTED}
              </span>
            ) : isError ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-danger-soft text-danger">
                <span className="w-2 h-2 rounded-full bg-danger" />
                {SYNC_MONITOR_LABELS.STATUS_ERROR}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-secondary text-muted">
                <span className="w-2 h-2 rounded-full bg-muted" />
                {SYNC_MONITOR_LABELS.STATUS_DISCONNECTED}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-5">
        {testResult && (
          <div
            className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
              testResult.success
                ? 'bg-success-soft/30 text-success border border-success/30'
                : 'bg-danger-soft/30 text-danger border border-danger/30'
            }`}
          >
            <Icon
              name={testResult.success ? 'CheckCircle2' : 'AlertCircle'}
              size={16}
              strokeWidth={2}
            />
            <span>{testResult.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        <p className="text-xs text-muted italic m-0">
          {SYNC_MONITOR_LABELS.CONFIG_ENV_HINT}
        </p>

        {/* Sync Stats Summary */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-lg bg-surface-secondary/70 border border-border/40 text-center">
            <span className="text-xs text-muted block mb-1">
              {SYNC_MONITOR_LABELS.STAT_PENDING_LABEL}
            </span>
            <span className="text-lg font-bold text-foreground">
              {stats?.pending ?? 0}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-success-soft/20 border border-success/20 text-center">
            <span className="text-xs text-success block mb-1">
              {SYNC_MONITOR_LABELS.STAT_SUCCESS_TODAY_LABEL}
            </span>
            <span className="text-lg font-bold text-success">
              {stats?.successToday ?? 0}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-danger-soft/20 border border-danger/20 text-center">
            <span className="text-xs text-danger block mb-1">
              {SYNC_MONITOR_LABELS.STAT_FAILED_LABEL}
            </span>
            <span className="text-lg font-bold text-danger">
              {stats?.failed ?? 0}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/50">
          <Button
            variant="secondary"
            type="button"
            disabled={testMutation.isPending}
            onClick={handleTestConnection}
            className="flex items-center gap-2"
          >
            <Icon
              name={testMutation.isPending ? 'RotateCcw' : 'Check'}
              size={16}
              className={testMutation.isPending ? 'animate-spin' : ''}
            />
            {testMutation.isPending
              ? SYNC_MONITOR_LABELS.BTN_TESTING
              : SYNC_MONITOR_LABELS.BTN_TEST_CONNECTION}
          </Button>

          <Button
            variant="ghost"
            type="button"
            onClick={() => navigate('/settings/sync-monitor')}
            className="flex items-center gap-2 text-primary hover:text-primary"
          >
            <span>{SYNC_MONITOR_LABELS.BTN_GO_TO_MONITOR}</span>
            <Icon name="ExternalLink" size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
