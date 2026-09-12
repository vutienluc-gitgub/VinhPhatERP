import { untypedDb } from '@/services/supabase/untyped';
import { supabase } from '@/services/supabase/client';
import { logger } from '@/shared/utils/logger';
import { SYNC_MONITOR_MESSAGES } from '@/features/settings/sync-monitor.constants';

export interface IntegrationConnectionConfig {
  spreadsheet_id?: string;
  service_account_email?: string;
  [key: string]: unknown;
}

export interface IntegrationConnection {
  id: string;
  provider: string;
  name: string;
  config: IntegrationConnectionConfig;
  status: 'active' | 'paused' | 'error';
  last_synced_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface SyncJobRow {
  id: string;
  connection_id: string | null;
  provider: string;
  direction: 'outbound' | 'inbound';
  entity_type: string;
  entity_id: string;
  sync_id: string;
  version: number;
  status: 'pending' | 'processing' | 'success' | 'failed' | 'dead_letter';
  payload: Record<string, unknown> | null;
  attempt_count: number;
  max_attempts: number;
  next_retry_at: string | null;
  last_error: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface SyncLog {
  id: string;
  job_id: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface SyncStats {
  pending: number;
  successToday: number;
  failed: number;
  deadLetter: number;
}

export async function fetchGoogleSheetsConnection(): Promise<IntegrationConnection | null> {
  const { data, error } = await untypedDb
    .from('integration_connections')
    .select('*')
    .eq('provider', 'google_sheets')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.error('Failed to fetch Google Sheets connection', error, {
      module: 'sync.api',
      action: 'fetchGoogleSheetsConnection',
    });
    throw new Error(error.message || 'Failed to fetch connection');
  }

  return (data as IntegrationConnection | null) ?? null;
}

export async function fetchSyncStats(): Promise<SyncStats> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data, error } = await untypedDb
    .from('integration_sync_jobs')
    .select('status, created_at, completed_at');

  if (error) {
    logger.error('Failed to fetch sync stats', error, {
      module: 'sync.api',
      action: 'fetchSyncStats',
    });
    return {
      pending: 0,
      successToday: 0,
      failed: 0,
      deadLetter: 0,
    };
  }

  const jobs =
    (data as Pick<SyncJobRow, 'status' | 'created_at' | 'completed_at'>[]) ||
    [];

  let pending = 0;
  let successToday = 0;
  let failed = 0;
  let deadLetter = 0;

  const startOfDayIso = startOfDay.toISOString();

  for (const job of jobs) {
    if (job.status === 'pending' || job.status === 'processing') {
      pending += 1;
    } else if (job.status === 'failed') {
      failed += 1;
    } else if (job.status === 'dead_letter') {
      deadLetter += 1;
    } else if (
      job.status === 'success' &&
      job.completed_at &&
      job.completed_at >= startOfDayIso
    ) {
      successToday += 1;
    }
  }

  return {
    pending,
    successToday,
    failed,
    deadLetter,
  };
}

export async function fetchSyncJobs(limit = 20): Promise<SyncJobRow[]> {
  const { data, error } = await untypedDb
    .from('integration_sync_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error('Failed to fetch sync jobs', error, {
      module: 'sync.api',
      action: 'fetchSyncJobs',
    });
    throw new Error(error.message || 'Failed to fetch sync jobs');
  }

  return (data as SyncJobRow[]) || [];
}

export async function fetchSyncLogs(jobId: string): Promise<SyncLog[]> {
  const { data, error } = await untypedDb
    .from('integration_sync_logs')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Failed to fetch sync logs', error, {
      module: 'sync.api',
      action: 'fetchSyncLogs',
      jobId,
    });
    throw new Error(error.message || 'Failed to fetch sync logs');
  }

  return (data as SyncLog[]) || [];
}

export async function retryFailedSyncJobs(): Promise<{ retriedCount: number }> {
  const { data, error } = await untypedDb
    .from('integration_sync_jobs')
    .update({
      status: 'pending',
      next_retry_at: new Date().toISOString(),
      last_error: null,
    })
    .in('status', ['failed', 'dead_letter'])
    .select('id');

  if (error) {
    logger.error('Failed to retry failed sync jobs', error, {
      module: 'sync.api',
      action: 'retryFailedSyncJobs',
    });
    throw new Error(error.message || 'Failed to retry jobs');
  }

  return { retriedCount: data ? data.length : 0 };
}

export async function retrySingleSyncJob(jobId: string): Promise<void> {
  const { error } = await untypedDb
    .from('integration_sync_jobs')
    .update({
      status: 'pending',
      next_retry_at: new Date().toISOString(),
      last_error: null,
    })
    .eq('id', jobId);

  if (error) {
    logger.error('Failed to retry single sync job', error, {
      module: 'sync.api',
      action: 'retrySingleSyncJob',
      jobId,
    });
    throw new Error(error.message || 'Failed to retry job');
  }
}

export async function triggerTestConnection(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const { data, error } = await supabase.functions.invoke(
      'sync-google-sheets',
      {
        body: { action: 'test_connection' },
      },
    );

    if (error) {
      return {
        success: false,
        message: error.message || SYNC_MONITOR_MESSAGES.TEST_EDGE_FN_ERROR,
      };
    }

    const res = data as { success?: boolean; message?: string } | null;
    return {
      success: Boolean(res?.success),
      message:
        res?.message ||
        (res?.success
          ? SYNC_MONITOR_MESSAGES.TEST_SUCCESS
          : SYNC_MONITOR_MESSAGES.TEST_ERROR),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: msg,
    };
  }
}

export async function triggerInboundImport(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const { data, error } = await supabase.functions.invoke(
      'sync-google-sheets',
      {
        body: { action: 'pull_import' },
      },
    );

    if (error) {
      logger.error('Failed to trigger inbound import', error, {
        module: 'sync.api',
        action: 'triggerInboundImport',
      });
      return {
        success: false,
        message: error.message || SYNC_MONITOR_MESSAGES.IMPORT_TRIGGER_ERROR,
      };
    }

    const res = data as { success?: boolean; message?: string } | null;
    return {
      success: Boolean(res?.success),
      message: res?.message || SYNC_MONITOR_MESSAGES.IMPORT_TRIGGER_SUCCESS,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: msg,
    };
  }
}

export async function triggerReconciliation(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const { data, error } = await supabase.functions.invoke(
      'sync-google-sheets',
      {
        body: { action: 'reconcile' },
      },
    );

    if (error) {
      logger.error('Failed to trigger reconciliation', error, {
        module: 'sync.api',
        action: 'triggerReconciliation',
      });
      return {
        success: false,
        message: error.message || SYNC_MONITOR_MESSAGES.RECONCILE_TRIGGER_ERROR,
      };
    }

    const res = data as { success?: boolean; message?: string } | null;
    return {
      success: Boolean(res?.success),
      message: res?.message || SYNC_MONITOR_MESSAGES.RECONCILE_TRIGGER_SUCCESS,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: msg,
    };
  }
}
