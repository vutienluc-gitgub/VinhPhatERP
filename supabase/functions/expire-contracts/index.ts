/**
 * Supabase Edge Function: expire-contracts
 * =========================================
 * Chay theo lich (cron job) de tu dong chuyen trang thai hop dong sang 'expired'.
 *
 * Dieu kien: expiry_date < CURRENT_DATE va status NOT IN ('signed', 'cancelled', 'expired')
 *
 * STEP 1: Xac thuc bang CRON_SECRET hoac Service Role
 * STEP 2: Lay danh sach hop dong da het han
 * STEP 3: Cap nhat status = 'expired' theo batch
 * STEP 4: Ghi audit log cho tung hop dong
 * STEP 5: Tra ve bao cao ket qua
 *
 * Deploy: supabase functions deploy expire-contracts
 * Schedule: Cau hinh trong Supabase Dashboard > Edge Functions > Scheduled
 *   Cron expression: 0 1 * * *  (chay luc 1:00 AM moi ngay)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ---------------------------------------------------------------------------
// CORS headers
// ---------------------------------------------------------------------------
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startedAt = new Date().toISOString();

  try {
    // ── STEP 1: Xac thuc ─────────────────────────────────────────────────
    // Ho tro 2 cach xac thuc:
    //   1. Header Authorization: Bearer <SERVICE_ROLE_KEY>   (goi tu code hoac curl)
    //   2. Header x-cron-secret: <CRON_SECRET>               (goi tu Supabase Scheduler)
    const authHeader = req.headers.get('Authorization');
    const cronSecret = req.headers.get('x-cron-secret');

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const expectedCronSecret = Deno.env.get('CRON_SECRET') ?? '';

    const isAuthorizedByToken =
      authHeader === `Bearer ${serviceRoleKey}` && serviceRoleKey !== '';
    const isAuthorizedByCron =
      expectedCronSecret !== '' && cronSecret === expectedCronSecret;

    if (!isAuthorizedByToken && !isAuthorizedByCron) {
      return jsonResponse(
        {
          ok: false,
          error: 'Unauthorized',
        },
        401,
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      serviceRoleKey,
    );

    // ── STEP 2: Lay danh sach hop dong het han ───────────────────────────
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const { data: expiredContracts, error: fetchError } = await supabaseAdmin
      .from('contracts')
      .select('id, contract_number, status, expiry_date')
      .lt('expiry_date', today)
      .not('status', 'in', '("signed","cancelled","expired")')
      .order('expiry_date', { ascending: true });

    if (fetchError) {
      console.error('[expire-contracts] Fetch error:', fetchError.message);
      return jsonResponse(
        {
          ok: false,
          error: fetchError.message,
        },
        500,
      );
    }

    const contracts = expiredContracts ?? [];

    if (contracts.length === 0) {
      console.log('[expire-contracts] No contracts to expire.');
      return jsonResponse({
        ok: true,
        expired: 0,
        message: 'Khong co hop dong nao can chuyen sang het han.',
        startedAt,
        completedAt: new Date().toISOString(),
      });
    }

    console.log(
      `[expire-contracts] Found ${contracts.length} contracts to expire.`,
    );

    // ── STEP 3: Cap nhat status = 'expired' theo batch ───────────────────
    const now = new Date().toISOString();
    const contractIds = contracts.map((c: { id: string }) => c.id);

    const { error: updateError } = await supabaseAdmin
      .from('contracts')
      .update({
        status: 'expired',
        updated_at: now,
      })
      .in('id', contractIds);

    if (updateError) {
      console.error('[expire-contracts] Update error:', updateError.message);
      return jsonResponse(
        {
          ok: false,
          error: updateError.message,
        },
        500,
      );
    }

    // ── STEP 4: Ghi audit log cho tung hop dong ───────────────────────────
    const auditLogs = contracts.map((c: { id: string; status: string }) => ({
      contract_id: c.id,
      action: 'status_changed',
      old_values: { status: c.status },
      new_values: {
        status: 'expired',
        reason: 'Auto-expired by scheduled job: expiry_date < today',
      },
      performed_by: null,
      performed_at: now,
    }));

    const { error: auditError } = await supabaseAdmin
      .from('contract_audit_logs')
      .insert(auditLogs);

    if (auditError) {
      // Khong fail — audit log loi khong the rollback trang thai da cap nhat
      console.warn('[expire-contracts] Audit log error:', auditError.message);
    }

    const completedAt = new Date().toISOString();
    console.log(
      `[expire-contracts] Done. ${contracts.length} contracts expired.`,
    );

    // ── STEP 5: Tra ve ket qua ────────────────────────────────────────────
    return jsonResponse({
      ok: true,
      expired: contracts.length,
      contractNumbers: contracts.map(
        (c: { contract_number: string }) => c.contract_number,
      ),
      message: `${contracts.length} hop dong da duoc chuyen sang trang thai het han.`,
      startedAt,
      completedAt,
    });
  } catch (err) {
    console.error('[expire-contracts] Unexpected error:', err);
    return jsonResponse(
      {
        ok: false,
        error: String(err),
        startedAt,
        completedAt: new Date().toISOString(),
      },
      500,
    );
  }
});
