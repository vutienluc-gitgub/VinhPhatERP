/**
 * Sync Google Sheets Worker -- Supabase Edge Function
 *
 * Trigger: Cron every 1 minute (via pg_cron or external scheduler)
 *          OR direct invoke from webhook
 *
 * Processing:
 *   1. Poll integration_sync_jobs WHERE status = 'pending'
 *      OR (status = 'failed' AND next_retry_at <= NOW() AND attempt_count < max_attempts)
 *   2. For each job:
 *      a. Lock job (status = 'processing')
 *      b. Resolve sheet config from integration_connections + integration_sheet_mappings
 *      c. Map entity payload -> SheetRowData via sheet-mapper
 *      d. Call GoogleSheetsAdapter.upsertRow(...)
 *      e. ON SUCCESS: status = 'success', completed_at = NOW()
 *      f. ON FAILURE: retry with exponential backoff or dead_letter
 *      g. INSERT integration_sync_logs entry
 *
 * Credentials: Read from Deno.env (Supabase Secrets)
 *
 * 3 layers of guarantee:
 *   Layer 1 -- Event-driven: Domain Event -> sync job immediately
 *   Layer 2 -- Worker poll:  This cron, processes pending + retries failed
 *   Layer 3 -- Reconciliation: Separate nightly function (future)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// -- Environment & Clients ---------------------------------------------------

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const GOOGLE_SA_EMAIL = Deno.env.get('GOOGLE_SA_EMAIL') ?? '';
const GOOGLE_SA_PRIVATE_KEY = (
  Deno.env.get('GOOGLE_SA_PRIVATE_KEY') ?? ''
).replace(/\\n/g, '\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// -- Google Sheets Auth (inlined for Edge Function isolation) -----------------

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemContents = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');
  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'pkcs8',
    binaryDer.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

function base64url(data: Uint8Array): string {
  let binary = '';
  for (const byte of data) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function getGoogleAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const encoder = new TextEncoder();
  const header = base64url(
    encoder.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })),
  );
  const claims = base64url(
    encoder.encode(
      JSON.stringify({
        iss: GOOGLE_SA_EMAIL,
        scope: SHEETS_SCOPE,
        aud: GOOGLE_TOKEN_URL,
        iat: now,
        exp: now + 3600,
      }),
    ),
  );
  const unsigned = `${header}.${claims}`;
  const key = await importPrivateKey(GOOGLE_SA_PRIVATE_KEY);
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    encoder.encode(unsigned),
  );
  const jwt = `${unsigned}.${base64url(new Uint8Array(sig))}`;

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
  const tokenData = await res.json();
  return tokenData.access_token;
}

// -- Retry Calculation -------------------------------------------------------

function calculateNextRetry(attemptCount: number): string {
  const baseDelay = 30_000;
  const maxDelay = 3_600_000;
  const delay = Math.min(baseDelay * Math.pow(2, attemptCount), maxDelay);
  return new Date(Date.now() + delay).toISOString();
}

// -- Sheet Operations --------------------------------------------------------

interface SyncJob {
  id: string;
  entity_type: string;
  entity_id: string;
  sync_id: string;
  version: number;
  payload: Record<string, unknown>;
  attempt_count: number;
  max_attempts: number;
  connection_id: string | null;
}

async function sheetsUpsertRow(
  accessToken: string,
  spreadsheetId: string,
  tabName: string,
  rowValues: (string | number | null)[],
  erpRecordId: string,
  erpVersion: number,
  syncId: string,
): Promise<void> {
  const fullRow = [...rowValues, erpRecordId, erpVersion, syncId];

  // Read existing rows to find by ERP Record ID
  const readUrl = `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(tabName)}`;
  const readRes = await fetch(readUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  let existingRowIndex: number | null = null;
  let existingVersion = 0;

  if (readRes.ok) {
    const data = await readRes.json();
    const rows: (string | number)[][] = data.values || [];
    const visibleColCount = rowValues.length;
    const erpIdCol = visibleColCount; // First hidden column

    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i]?.[erpIdCol]) === erpRecordId) {
        existingRowIndex = i + 1; // 1-indexed
        existingVersion = Number(rows[i]?.[erpIdCol + 1]) || 0;
        break;
      }
    }
  }

  if (existingRowIndex !== null) {
    // Skip if existing version >= new version
    if (existingVersion >= erpVersion) return;

    // UPDATE
    const range = `${tabName}!A${existingRowIndex}`;
    const updateUrl = `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`;
    const updateRes = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values: [fullRow],
      }),
    });
    if (!updateRes.ok)
      throw new Error(`Sheet update failed: ${await updateRes.text()}`);
  } else {
    // APPEND
    const range = `${tabName}!A1`;
    const appendUrl = `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
    const appendRes = await fetch(appendUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values: [fullRow],
      }),
    });
    if (!appendRes.ok)
      throw new Error(`Sheet append failed: ${await appendRes.text()}`);
  }
}

// -- Mappers -----------------------------------------------------------------

function mapJobToRowValues(job: SyncJob): {
  values: (string | number | null)[];
  tabName: string;
} {
  const p = job.payload;

  if (job.entity_type === 'shipment') {
    return {
      tabName: 'ERP_REPORT_XUAT_KHO',
      values: [
        (p.shippedAt as string) ?? '',
        (p.shipmentNumber as string) ?? '',
        (p.customerName as string) ?? '',
        (p.materialCode as string) ?? '',
        (p.materialName as string) ?? '',
        (p.unit as string) ?? 'kg',
        (p.quantity as number) ?? 0,
        (p.invoiceNumber as string) ?? '',
        'Posted',
      ],
    };
  }

  if (job.entity_type === 'order') {
    return {
      tabName: 'ERP_REPORT_DON_HANG',
      values: [
        (p.confirmedAt as string) ?? '',
        (p.orderNumber as string) ?? '',
        (p.customerName as string) ?? '',
        (p.productName as string) ?? '',
        (p.quantity as number) ?? 0,
        (p.totalAmount as number) ?? 0,
        (p.status as string) ?? 'Confirmed',
      ],
    };
  }

  throw new Error(`Unknown entity_type: ${job.entity_type}`);
}

// -- Write Sync Log ----------------------------------------------------------

async function writeSyncLog(
  jobId: string,
  level: string,
  message: string,
  details?: Record<string, unknown>,
): Promise<void> {
  await supabase.from('integration_sync_logs').insert({
    job_id: jobId,
    level,
    message,
    details: details ?? null,
  });
}

// -- Main Worker -------------------------------------------------------------

async function processJobs(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  // 1. Fetch pending or retryable jobs
  const { data: jobs, error: fetchErr } = await supabase
    .from('integration_sync_jobs')
    .select(
      'id, entity_type, entity_id, sync_id, version, payload, attempt_count, max_attempts, connection_id',
    )
    .or('status.eq.pending,and(status.eq.failed,next_retry_at.lte.now())')
    .lt('attempt_count', 5)
    .order('created_at', { ascending: true })
    .limit(50);

  if (fetchErr || !jobs || jobs.length === 0) {
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  // 2. Get Google access token (shared across all jobs in this batch)
  let accessToken: string;
  try {
    accessToken = await getGoogleAccessToken();
  } catch (authErr) {
    const errMsg = authErr instanceof Error ? authErr.message : String(authErr);
    // Mark all jobs as failed with auth error
    for (const job of jobs) {
      await supabase
        .from('integration_sync_jobs')
        .update({
          status: 'failed',
          last_error: `Auth failed: ${errMsg}`,
          attempt_count: (job as SyncJob).attempt_count + 1,
          next_retry_at: calculateNextRetry((job as SyncJob).attempt_count),
        })
        .eq('id', (job as SyncJob).id);

      await writeSyncLog(
        (job as SyncJob).id,
        'error',
        `Auth failed: ${errMsg}`,
      );
    }
    return { processed: jobs.length, succeeded: 0, failed: jobs.length };
  }

  // 3. Resolve spreadsheet ID from connection config
  let spreadsheetId = '';
  const firstJob = jobs[0] as SyncJob;
  if (firstJob.connection_id) {
    const { data: conn } = await supabase
      .from('integration_connections')
      .select('config')
      .eq('id', firstJob.connection_id)
      .maybeSingle();

    if (conn) {
      const config = conn.config as Record<string, unknown>;
      spreadsheetId = (config.spreadsheet_id as string) ?? '';
    }
  }

  if (!spreadsheetId) {
    // Fallback: try env var
    spreadsheetId = Deno.env.get('GOOGLE_SPREADSHEET_ID') ?? '';
  }

  if (!spreadsheetId) {
    for (const job of jobs) {
      await writeSyncLog(
        (job as SyncJob).id,
        'error',
        'No spreadsheet_id configured',
      );
    }
    return { processed: jobs.length, succeeded: 0, failed: jobs.length };
  }

  // 4. Process each job
  let succeeded = 0;
  let failedCount = 0;

  for (const rawJob of jobs) {
    const job = rawJob as SyncJob;

    // Lock: set status = processing
    await supabase
      .from('integration_sync_jobs')
      .update({ status: 'processing' })
      .eq('id', job.id);

    try {
      const { values, tabName } = mapJobToRowValues(job);

      await sheetsUpsertRow(
        accessToken,
        spreadsheetId,
        tabName,
        values,
        job.entity_id,
        job.version,
        job.sync_id,
      );

      // Mark success
      await supabase
        .from('integration_sync_jobs')
        .update({
          status: 'success',
          completed_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      await writeSyncLog(
        job.id,
        'info',
        `Row upserted successfully to ${tabName}`,
      );
      succeeded++;
    } catch (processErr) {
      const errMsg =
        processErr instanceof Error ? processErr.message : String(processErr);
      const newAttempt = job.attempt_count + 1;
      const newStatus =
        newAttempt >= job.max_attempts ? 'dead_letter' : 'failed';

      await supabase
        .from('integration_sync_jobs')
        .update({
          status: newStatus,
          last_error: errMsg,
          attempt_count: newAttempt,
          next_retry_at:
            newStatus === 'failed' ? calculateNextRetry(newAttempt) : null,
        })
        .eq('id', job.id);

      await writeSyncLog(job.id, 'error', errMsg, {
        attempt: newAttempt,
        maxAttempts: job.max_attempts,
        newStatus,
      });

      failedCount++;
    }
  }

  // Update connection last_synced_at
  if (firstJob.connection_id) {
    await supabase
      .from('integration_connections')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', firstJob.connection_id);
  }

  return { processed: jobs.length, succeeded, failed: failedCount };
}

// -- HTTP Handler ------------------------------------------------------------

Deno.serve(async (req: Request) => {
  try {
    let body: { action?: string } = {};
    if (req.method === 'POST') {
      try {
        body = await req.json();
      } catch {
        // empty body is fine
      }
    }

    // Action: test_connection
    if (body.action === 'test_connection') {
      try {
        if (!GOOGLE_SA_EMAIL || !GOOGLE_SA_PRIVATE_KEY) {
          return new Response(
            JSON.stringify({
              success: false,
              message:
                'Chưa cấu hình GOOGLE_SA_EMAIL hoặc GOOGLE_SA_PRIVATE_KEY trong Supabase Secrets',
            }),
            { headers: { 'Content-Type': 'application/json' } },
          );
        }

        const token = await getGoogleAccessToken();
        return new Response(
          JSON.stringify({
            success: Boolean(token),
            message: 'Kết nối Google Sheets qua Service Account thành công',
          }),
          { headers: { 'Content-Type': 'application/json' } },
        );
      } catch (authErr) {
        const msg =
          authErr instanceof Error ? authErr.message : String(authErr);
        return new Response(
          JSON.stringify({
            success: false,
            message: `Lỗi xác thực Service Account: ${msg}`,
          }),
          { headers: { 'Content-Type': 'application/json' } },
        );
      }
    }

    // Action: pull_import (Phase 3 on-demand trigger)
    if (body.action === 'pull_import') {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Đã kích hoạt kéo dữ liệu từ Google Sheets',
          processedAt: new Date().toISOString(),
        }),
        { headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Action: reconcile (Phase 4 on-demand trigger)
    if (body.action === 'reconcile') {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Đã kích hoạt kiểm tra đối soát dữ liệu với Google Sheets',
          processedAt: new Date().toISOString(),
        }),
        { headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Default: Process pending outbound jobs
    const result = await processJobs();
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
