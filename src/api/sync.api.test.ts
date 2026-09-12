import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  fetchGoogleSheetsConnection,
  fetchSyncStats,
  fetchSyncJobs,
  fetchSyncLogs,
  retryFailedSyncJobs,
  retrySingleSyncJob,
  triggerTestConnection,
  triggerInboundImport,
  triggerReconciliation,
} from '@/api/sync.api';
import { untypedDb } from '@/services/supabase/untyped';
import { supabase } from '@/services/supabase/client';

vi.mock('@/services/supabase/untyped', () => ({
  untypedDb: {
    from: vi.fn(),
  },
}));

vi.mock('@/services/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

vi.mock('@/shared/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe('Sync API Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchGoogleSheetsConnection', () => {
    it('should return connection record when found', async () => {
      const mockConn = {
        id: 'conn-1',
        provider: 'google_sheets',
        name: 'Google Sheets Main',
        config: { spreadsheet_id: 'sheet-123' },
        status: 'active',
      };

      vi.mocked(untypedDb.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi
          .fn()
          .mockResolvedValueOnce({ data: mockConn, error: null }),
      } as unknown as ReturnType<typeof untypedDb.from>);

      const result = await fetchGoogleSheetsConnection();
      expect(result).toEqual(mockConn);
    });

    it('should throw error when database returns error', async () => {
      vi.mocked(untypedDb.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({
          data: null,
          error: { message: 'Database connection timeout' },
        }),
      } as unknown as ReturnType<typeof untypedDb.from>);

      await expect(fetchGoogleSheetsConnection()).rejects.toThrow(
        'Database connection timeout',
      );
    });
  });

  describe('fetchSyncStats', () => {
    it('should correctly aggregate job statuses and filter success today', async () => {
      const now = new Date();
      const todayIso = now.toISOString();

      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayIso = yesterday.toISOString();

      const mockRows = [
        { status: 'pending', created_at: todayIso, completed_at: null },
        { status: 'processing', created_at: todayIso, completed_at: null },
        { status: 'failed', created_at: todayIso, completed_at: null },
        { status: 'dead_letter', created_at: todayIso, completed_at: null },
        { status: 'success', created_at: todayIso, completed_at: todayIso }, // today
        {
          status: 'success',
          created_at: yesterdayIso,
          completed_at: yesterdayIso,
        }, // yesterday
      ];

      vi.mocked(untypedDb.from).mockReturnValueOnce({
        select: vi.fn().mockResolvedValueOnce({ data: mockRows, error: null }),
      } as unknown as ReturnType<typeof untypedDb.from>);

      const stats = await fetchSyncStats();

      expect(stats.pending).toBe(2); // pending + processing
      expect(stats.failed).toBe(1);
      expect(stats.deadLetter).toBe(1);
      expect(stats.successToday).toBe(1); // only the one completed today
    });

    it('should return fallback zero stats when query fails', async () => {
      vi.mocked(untypedDb.from).mockReturnValueOnce({
        select: vi.fn().mockResolvedValueOnce({
          data: null,
          error: { message: 'Table not found' },
        }),
      } as unknown as ReturnType<typeof untypedDb.from>);

      const stats = await fetchSyncStats();
      expect(stats).toEqual({
        pending: 0,
        successToday: 0,
        failed: 0,
        deadLetter: 0,
      });
    });
  });

  describe('fetchSyncJobs & fetchSyncLogs', () => {
    it('should fetch sync jobs with descending order and limit', async () => {
      const mockJobs = [{ id: 'job-1', status: 'pending' }];

      vi.mocked(untypedDb.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce({ data: mockJobs, error: null }),
      } as unknown as ReturnType<typeof untypedDb.from>);

      const jobs = await fetchSyncJobs(10);
      expect(jobs).toEqual(mockJobs);
    });

    it('should fetch sync logs filtered by jobId', async () => {
      const mockLogs = [{ id: 'log-1', job_id: 'job-1', message: 'Ok' }];

      vi.mocked(untypedDb.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValueOnce({ data: mockLogs, error: null }),
      } as unknown as ReturnType<typeof untypedDb.from>);

      const logs = await fetchSyncLogs('job-1');
      expect(logs).toEqual(mockLogs);
    });
  });

  describe('retry Operations', () => {
    it('should retry all failed jobs and return retried count', async () => {
      const mockUpdated = [{ id: 'job-1' }, { id: 'job-2' }];

      vi.mocked(untypedDb.from).mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        select: vi
          .fn()
          .mockResolvedValueOnce({ data: mockUpdated, error: null }),
      } as unknown as ReturnType<typeof untypedDb.from>);

      const res = await retryFailedSyncJobs();
      expect(res.retriedCount).toBe(2);
    });

    it('should retry single job successfully', async () => {
      vi.mocked(untypedDb.from).mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValueOnce({ error: null }),
      } as unknown as ReturnType<typeof untypedDb.from>);

      await expect(retrySingleSyncJob('job-99')).resolves.toBeUndefined();
    });
  });

  describe('Edge Function Triggers', () => {
    it('triggerTestConnection: returns success on valid Edge Function response', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: { success: true, message: 'Connected' },
        error: null,
      });

      const res = await triggerTestConnection();
      expect(res.success).toBe(true);
      expect(res.message).toBe('Connected');
    });

    it('triggerInboundImport: calls edge function with pull_import action', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });

      const res = await triggerInboundImport();
      expect(res.success).toBe(true);
      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        'sync-google-sheets',
        {
          body: { action: 'pull_import' },
        },
      );
    });

    it('triggerReconciliation: calls edge function with reconcile action', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });

      const res = await triggerReconciliation();
      expect(res.success).toBe(true);
      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        'sync-google-sheets',
        {
          body: { action: 'reconcile' },
        },
      );
    });
  });
});
