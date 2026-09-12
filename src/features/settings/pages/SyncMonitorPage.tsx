import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  useGoogleSheetsConnection,
  useSyncStats,
  useSyncJobs,
  useSyncLogs,
  useRetryFailedSyncJobs,
  useRetrySingleSyncJob,
  useTestConnection,
  useTriggerInboundImport,
  useTriggerReconciliation,
  useWebhookMetrics,
  useDeadLetterEvents,
  useReplayWebhookEvent,
  useReplayAllDeadLetterEvents,
} from '@/application/settings';
import { Button, Icon } from '@/shared/components';
import {
  SYNC_MONITOR_LABELS,
  SYNC_MONITOR_MESSAGES,
} from '@/features/settings/sync-monitor.constants';
import { calculateTotalFailed } from '@/features/settings/sync-monitor.utils';
import type { ReconciliationReport } from '@/integration/sync';
import type { DeadLetterEvent } from '@/api/webhook-dlq.api';
import { SyncOverviewCard } from '@/features/settings/components/sync-monitor/SyncOverviewCard';
import { SyncMetricsGrid } from '@/features/settings/components/sync-monitor/SyncMetricsGrid';
import { SyncJobsTable } from '@/features/settings/components/sync-monitor/SyncJobsTable';
import { SyncJobLogsDrawer } from '@/features/settings/components/sync-monitor/SyncJobLogsDrawer';
import { ReconciliationModal } from '@/features/settings/components/sync-monitor/ReconciliationModal';
import { WebhookMetricsCards } from '@/features/settings/components/webhook-dlq/WebhookMetricsCards';
import { DeadLetterQueueTable } from '@/features/settings/components/webhook-dlq/DeadLetterQueueTable';

export function SyncMonitorPage() {
  const navigate = useNavigate();

  const {
    data: connection,
    isLoading: isLoadingConn,
    refetch: refetchConn,
  } = useGoogleSheetsConnection();

  const { data: stats, refetch: refetchStats } = useSyncStats();

  const {
    data: jobs = [],
    isLoading: isLoadingJobs,
    error: jobsError,
    refetch: refetchJobs,
  } = useSyncJobs(20);

  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const { data: logs = [], isLoading: isLoadingLogs } =
    useSyncLogs(selectedJobId);

  const retryAllMutation = useRetryFailedSyncJobs();
  const retrySingleMutation = useRetrySingleSyncJob();
  const testMutation = useTestConnection();
  const pullImportMutation = useTriggerInboundImport();
  const reconcileMutation = useTriggerReconciliation();

  const [reconciliationReport, setReconciliationReport] =
    useState<ReconciliationReport | null>(null);
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);

  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const totalFailed = calculateTotalFailed(stats);
  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  async function handleRefresh() {
    await Promise.all([refetchConn(), refetchStats(), refetchJobs()]);
  }

  async function handleRetryAll() {
    setNotification(null);
    try {
      const res = await retryAllMutation.mutateAsync();
      setNotification({
        type: 'success',
        message: `${SYNC_MONITOR_MESSAGES.RETRY_SUCCESS} (${res.retriedCount} ${SYNC_MONITOR_LABELS.TASK_COUNT_SUFFIX})`,
      });
    } catch (err) {
      setNotification({
        type: 'error',
        message: `${SYNC_MONITOR_MESSAGES.RETRY_ERROR} ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  async function handleRetrySingle(jobId: string) {
    setNotification(null);
    try {
      await retrySingleMutation.mutateAsync(jobId);
      setNotification({
        type: 'success',
        message: SYNC_MONITOR_MESSAGES.RETRY_SUCCESS,
      });
    } catch (err) {
      setNotification({
        type: 'error',
        message: `${SYNC_MONITOR_MESSAGES.RETRY_ERROR} ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  async function handleTestConn() {
    setNotification(null);
    try {
      const res = await testMutation.mutateAsync();
      setNotification({
        type: res.success ? 'success' : 'error',
        message: res.message,
      });
    } catch (err) {
      setNotification({
        type: 'error',
        message: `${SYNC_MONITOR_MESSAGES.TEST_ERROR} ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  async function handlePullImport() {
    setNotification(null);
    try {
      const res = await pullImportMutation.mutateAsync();
      setNotification({
        type: res.success ? 'success' : 'error',
        message: res.message,
      });
      await handleRefresh();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async function handleReconcile() {
    setNotification(null);
    try {
      const res = await reconcileMutation.mutateAsync();
      setNotification({
        type: res.success ? 'success' : 'error',
        message: res.message,
      });

      // Default visual report
      setReconciliationReport({
        scannedAt: new Date().toISOString(),
        shipments: {
          scanned: stats?.successToday ?? 0,
          missingFixed: 0,
          staleUpdated: 0,
          orphanDetected: 0,
        },
        orders: {
          scanned: stats?.pending ?? 0,
          missingFixed: 0,
          staleUpdated: 0,
          orphanDetected: 0,
        },
        totalJobsCreated: 0,
      });
      setIsReconcileModalOpen(true);
      await handleRefresh();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const [activeTab, setActiveTab] = useState<'sheets' | 'webhook'>('sheets');
  const { data: webhookMetrics, isLoading: isLoadingMetrics } =
    useWebhookMetrics(24);
  const { data: dlqEvents = [], isLoading: isLoadingDlq } = useDeadLetterEvents(
    50,
    0,
  );
  const replayWebhookMutation = useReplayWebhookEvent();
  const replayAllDlqMutation = useReplayAllDeadLetterEvents();

  async function handleReplaySingleDlq(ev: DeadLetterEvent) {
    setNotification(null);
    try {
      await replayWebhookMutation.mutateAsync({
        eventId: ev.event_id,
        source: ev.source,
      });
      setNotification({
        type: 'success',
        message: `Đã đưa sự kiện ${ev.event_id} vào hàng đợi xử lý lại thành công!`,
      });
    } catch (err) {
      setNotification({
        type: 'error',
        message: `Lỗi khi đưa sự kiện vào xử lý lại: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  async function handleReplayAllDlq() {
    setNotification(null);
    try {
      const res = await replayAllDlqMutation.mutateAsync();
      setNotification({
        type: 'success',
        message: `Đã khôi phục thành công ${res.replayed_count} sự kiện Dead Letter!`,
      });
    } catch (err) {
      setNotification({
        type: 'error',
        message: `Lỗi khi thử lại hàng loạt: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          type="button"
          onClick={() => navigate('/settings/system')}
          className="p-2 h-auto text-muted hover:text-foreground"
        >
          <Icon name="ArrowUp" size={20} className="-rotate-90" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground m-0">
            {SYNC_MONITOR_LABELS.PAGE_TITLE}
          </h1>
          <p className="text-xs text-muted m-0">
            {SYNC_MONITOR_LABELS.PAGE_SUBTITLE}
          </p>
        </div>
      </div>

      {/* Notification banner */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl flex items-center justify-between gap-3 text-sm ${
            notification.type === 'success'
              ? 'bg-success-soft/40 text-success border border-success/30'
              : 'bg-danger-soft/40 text-danger border border-danger/30'
          }`}
        >
          <div className="flex items-center gap-2">
            <Icon
              name={
                notification.type === 'success' ? 'CheckCircle2' : 'AlertCircle'
              }
              size={18}
              strokeWidth={2}
            />
            <span>{notification.message}</span>
          </div>
          <Button
            variant="ghost"
            type="button"
            onClick={() => setNotification(null)}
            className="p-1 h-auto text-inherit"
          >
            <Icon name="X" size={14} />
          </Button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-default pb-2">
        <Button
          variant={activeTab === 'sheets' ? 'primary' : 'ghost'}
          size="sm"
          type="button"
          onClick={() => setActiveTab('sheets')}
          className="flex items-center gap-2"
        >
          <Icon name="FileSpreadsheet" size={16} />
          <span>Đồng bộ Google Sheets</span>
        </Button>
        <Button
          variant={activeTab === 'webhook' ? 'primary' : 'ghost'}
          size="sm"
          type="button"
          onClick={() => setActiveTab('webhook')}
          className="flex items-center gap-2"
        >
          <Icon name="Activity" size={16} />
          <span>Giám sát Webhook & Dead Letter Queue</span>
          {webhookMetrics && webhookMetrics.dead_letter_events > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-semibold bg-danger-soft text-danger">
              {webhookMetrics.dead_letter_events}
            </span>
          )}
        </Button>
      </div>

      {activeTab === 'sheets' ? (
        <>
          {/* Connection & Configuration Overview */}
          <SyncOverviewCard
            connection={connection}
            isLoadingConn={isLoadingConn}
            totalFailed={totalFailed}
            isTesting={testMutation.isPending}
            isRetryingAll={retryAllMutation.isPending}
            isPullingImport={pullImportMutation.isPending}
            isReconciling={reconcileMutation.isPending}
            onTestConn={handleTestConn}
            onRetryAll={handleRetryAll}
            onRefresh={handleRefresh}
            onPullImport={handlePullImport}
            onReconcile={handleReconcile}
          />

          {/* 4 Metric Counters */}
          <SyncMetricsGrid stats={stats} />

          {/* Jobs Table */}
          <SyncJobsTable
            jobs={jobs}
            isLoadingJobs={isLoadingJobs}
            jobsError={jobsError}
            selectedJobId={selectedJobId}
            isRetryingSingle={retrySingleMutation.isPending}
            onSelectJob={setSelectedJobId}
            onRetrySingle={handleRetrySingle}
          />
        </>
      ) : (
        <>
          {/* Webhook Metrics Cards */}
          <WebhookMetricsCards
            metrics={webhookMetrics}
            isLoading={isLoadingMetrics}
          />

          {/* Dead Letter Queue Table */}
          <DeadLetterQueueTable
            events={dlqEvents}
            isLoading={isLoadingDlq}
            isReplayingSingle={replayWebhookMutation.isPending}
            isReplayingAll={replayAllDlqMutation.isPending}
            onReplaySingle={handleReplaySingleDlq}
            onReplayAll={handleReplayAllDlq}
          />
        </>
      )}

      {/* Audit Logs Drawer / Modal */}
      <SyncJobLogsDrawer
        selectedJob={selectedJob}
        selectedJobId={selectedJobId}
        logs={logs}
        isLoadingLogs={isLoadingLogs}
        onClose={() => setSelectedJobId(null)}
      />

      {/* Reconciliation Report Modal */}
      <ReconciliationModal
        isOpen={isReconcileModalOpen}
        onClose={() => setIsReconcileModalOpen(false)}
        report={reconciliationReport}
      />
    </div>
  );
}
