import postgres from 'postgres';
import { config } from 'dotenv';

// Load from server/.env first (Supabase pooler), fallback to root .env
config({ path: 'server/.env' });
config();

/**
 * Diagnostic script: Traces the entire push notification pipeline
 * to identify where iOS Lock Screen push notifications are failing.
 *
 * Run: npx tsx scripts/diagnose-push.ts
 */
async function diagnosePush() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL is missing. Add it to server/.env or .env.');
    process.exit(1);
  }

  console.log(`Connecting to: ${dbUrl.replace(/:[^:@]+@/, ':***@')}...\n`);
  const needsSsl = dbUrl.includes('supabase.com') || dbUrl.includes('pooler');
  const sql = postgres(dbUrl, {
    max: 1,
    connect_timeout: 10,
    ssl: needsSsl ? 'require' : false,
  });

  try {
    console.log('========================================');
    console.log('  PUSH NOTIFICATION PIPELINE DIAGNOSTIC');
    console.log('========================================\n');

    // ── STEP 1: Check all ACTIVE push subscriptions ──
    console.log('=== STEP 1: ACTIVE PUSH SUBSCRIPTIONS ===\n');
    const allSubs = await sql`
      SELECT
        ps.id,
        ps.user_id,
        ps.platform,
        ps.browser,
        ps.device_id,
        ps.endpoint,
        ps.revoked_at,
        ps.created_at,
        ps.last_seen_at,
        p.full_name,
        p.role AS profile_role
      FROM public.push_subscriptions ps
      LEFT JOIN public.profiles p ON ps.user_id = p.id
      WHERE ps.revoked_at IS NULL
      ORDER BY ps.last_seen_at DESC NULLS LAST
    `;

    if (allSubs.length === 0) {
      console.error(
        '[CRITICAL] Khong co push subscription nao active trong database!',
      );
      console.error(
        'Nguyen nhan: User chua bam "Bat thong bao" hoac subscription da bi revoke.',
      );
      console.error('Giai phap: Mo app > Cai dat > Bat thong bao day.\n');
    } else {
      console.log(`Tim thay ${allSubs.length} subscription(s) active:\n`);
      for (const s of allSubs) {
        const isApple = s.endpoint?.includes('push.apple.com');
        console.log(`  - ${s.full_name || 'N/A'} (${s.profile_role})`);
        console.log(`    Platform: ${s.platform} | Browser: ${s.browser}`);
        console.log(
          `    Apple Push: ${isApple ? 'YES (APNs)' : 'NO (FCM/Mozilla)'}`,
        );
        console.log(`    Endpoint: ${s.endpoint?.substring(0, 80)}...`);
        console.log(`    Last seen: ${s.last_seen_at}`);
        console.log(`    Created: ${s.created_at}\n`);
      }

      // Check for iOS specifically
      const iosSubs = allSubs.filter(
        (s) => s.platform === 'ios' || s.browser === 'safari-pwa',
      );
      if (iosSubs.length === 0) {
        console.warn(
          '[WARNING] Khong co subscription nao tu iOS / Safari PWA!',
        );
        console.warn(
          'Dieu nay co nghia la iPhone chua dang ky nhan push notification.',
        );
        console.warn(
          'Giai phap: Mo PWA tren iPhone > Vao Cai dat > Bat thong bao > Cho phep.\n',
        );
      } else {
        console.log(
          `[OK] Co ${iosSubs.length} iOS/Safari-PWA subscription(s).\n`,
        );
      }
    }

    // ── STEP 2: Check recent notification_outbox entries ──
    console.log('=== STEP 2: NOTIFICATION OUTBOX (20 gan nhat) ===\n');
    const outboxEntries = await sql`
      SELECT
        id,
        event_type,
        status,
        attempts,
        last_error,
        payload->>'message_id' AS message_id,
        payload->>'sender_name' AS sender_name,
        payload->>'content' AS content_preview,
        created_at,
        processed_at,
        next_retry_at
      FROM public.notification_outbox
      ORDER BY created_at DESC
      LIMIT 20
    `;

    if (outboxEntries.length === 0) {
      console.error(
        '[CRITICAL] notification_outbox trong! Trigger khong tao outbox entry.',
      );
      console.error(
        'Kiem tra: trg_fn_chat_message_inserted co duoc fire khong?\n',
      );
    } else {
      console.log(
        `Tim thay ${outboxEntries.length} outbox entry(s) gan nhat:\n`,
      );
      for (const e of outboxEntries) {
        const statusIcon =
          e.status === 'delivered'
            ? '[OK]'
            : e.status === 'failed' || e.status === 'exhausted'
              ? '[FAIL]'
              : `[${e.status?.toUpperCase()}]`;
        console.log(
          `  ${statusIcon} ${e.event_type} | ${e.sender_name || 'N/A'}: "${(e.content_preview || '').substring(0, 50)}"`,
        );
        console.log(
          `    Status: ${e.status} | Attempts: ${e.attempts} | Error: ${e.last_error || 'none'}`,
        );
        console.log(
          `    Created: ${e.created_at} | Processed: ${e.processed_at || 'pending'}\n`,
        );
      }

      // Count statuses
      const statusCounts: Record<string, number> = {};
      for (const e of outboxEntries) {
        statusCounts[e.status] = (statusCounts[e.status] || 0) + 1;
      }
      console.log('  Status summary:', statusCounts, '\n');
    }

    // ── STEP 3: Check the trigger exists and is enabled ──
    console.log('=== STEP 3: TRIGGER STATUS ===\n');
    const triggers = await sql`
      SELECT
        tgname,
        tgenabled,
        tgtype
      FROM pg_trigger
      WHERE tgrelid = 'public.chat_messages'::regclass
      ORDER BY tgname
    `;

    for (const t of triggers) {
      const status =
        t.tgenabled === 'O'
          ? 'ENABLED'
          : t.tgenabled === 'D'
            ? 'DISABLED'
            : t.tgenabled;
      console.log(`  Trigger: ${t.tgname} => ${status}`);
    }
    console.log();

    const hasChatTrigger = triggers.some(
      (t) => t.tgname.includes('chat_message_inserted') && t.tgenabled !== 'D',
    );
    if (!hasChatTrigger) {
      console.error(
        '[CRITICAL] Trigger trg_chat_message_inserted KHONG ton tai hoac bi DISABLED!',
      );
      console.error('Day la nguyen nhan push notification khong hoat dong.\n');
    } else {
      console.log('[OK] Chat message trigger dang ENABLED.\n');
    }

    // ── STEP 4: Check pg_net extension ──
    console.log('=== STEP 4: pg_net EXTENSION ===\n');
    const pgNetCheck = await sql`
      SELECT extname, extversion
      FROM pg_extension
      WHERE extname = 'pg_net'
    `;

    if (pgNetCheck.length === 0) {
      console.error('[CRITICAL] Extension pg_net KHONG duoc cai dat!');
      console.error(
        'Trigger net.http_post se fail => Edge Function khong duoc goi.\n',
      );
    } else {
      console.log(
        `[OK] pg_net v${pgNetCheck[0].extversion} da duoc cai dat.\n`,
      );
    }

    // ── STEP 5: Check pg_net HTTP request queue ──
    console.log('=== STEP 5: pg_net REQUEST QUEUE (10 gan nhat) ===\n');
    try {
      const netRequests = await sql`
        SELECT
          id,
          status_code,
          url,
          created,
          LEFT(body::text, 100) AS body_preview
        FROM net._http_response
        ORDER BY created DESC
        LIMIT 10
      `;

      if (netRequests.length === 0) {
        console.warn(
          '[WARNING] Khong co HTTP request nao trong net._http_response.',
        );
      } else {
        for (const r of netRequests) {
          const ok = r.status_code >= 200 && r.status_code < 300;
          console.log(
            `  ${ok ? '[OK]' : '[FAIL]'} HTTP ${r.status_code} => ${r.url}`,
          );
          console.log(`    Created: ${r.created}\n`);
        }
      }
    } catch {
      console.warn(
        '[INFO] Khong the truy van net._http_response (co the khong co quyen).\n',
      );
    }

    // ── STEP 6: Recently revoked subscriptions ──
    console.log('\n=== STEP 6: RECENTLY REVOKED SUBSCRIPTIONS (7 ngay) ===\n');
    const revokedSubs = await sql`
      SELECT
        ps.id,
        ps.user_id,
        ps.platform,
        ps.browser,
        ps.endpoint,
        ps.revoked_at,
        ps.created_at,
        p.full_name,
        p.role AS profile_role
      FROM public.push_subscriptions ps
      LEFT JOIN public.profiles p ON ps.user_id = p.id
      WHERE ps.revoked_at IS NOT NULL
        AND ps.revoked_at > NOW() - INTERVAL '7 days'
      ORDER BY ps.revoked_at DESC
    `;

    if (revokedSubs.length === 0) {
      console.log(
        '[OK] Khong co subscription nao bi revoke trong 7 ngay qua.\n',
      );
    } else {
      console.warn(
        `[WARNING] Co ${revokedSubs.length} subscription bi revoke trong 7 ngay qua:\n`,
      );
      for (const s of revokedSubs) {
        const isApple = s.endpoint?.includes('push.apple.com');
        console.log(
          `  - ${s.full_name} (${s.platform}/${s.browser}) ${isApple ? '[APNs]' : '[FCM]'}`,
        );
        console.log(
          `    Revoked: ${s.revoked_at} | Created: ${s.created_at}\n`,
        );
      }
    }

    // ── SUMMARY ──
    console.log('========================================');
    console.log('  SUMMARY & VERDICT');
    console.log('========================================\n');

    const hasActiveSubs = allSubs.length > 0;
    const hasIosSubs = allSubs.some(
      (s) => s.platform === 'ios' || s.browser === 'safari-pwa',
    );
    const hasOutbox = outboxEntries.length > 0;
    const hasDelivered = outboxEntries.some((e) => e.status === 'delivered');
    const hasFailed = outboxEntries.some(
      (e) => e.status === 'failed' || e.status === 'exhausted',
    );

    console.log(`  Active subscriptions: ${hasActiveSubs ? 'YES' : 'NO [!]'}`);
    console.log(`  iOS/Safari-PWA sub:   ${hasIosSubs ? 'YES' : 'NO [!]'}`);
    console.log(`  Chat trigger enabled: ${hasChatTrigger ? 'YES' : 'NO [!]'}`);
    console.log(
      `  pg_net installed:     ${pgNetCheck.length > 0 ? 'YES' : 'NO [!]'}`,
    );
    console.log(`  Outbox has entries:   ${hasOutbox ? 'YES' : 'NO [!]'}`);
    console.log(`  Any delivered:        ${hasDelivered ? 'YES' : 'NO [!]'}`);
    console.log(`  Any failed:           ${hasFailed ? 'YES [!]' : 'NO'}`);

    console.log('\n  ── VERDICT ──\n');
    if (!hasActiveSubs || !hasIosSubs) {
      console.log('  iPhone CHUA co push subscription trong DB.');
      console.log('  => Mo PWA tren iPhone > Cai dat > Bat thong bao.');
    } else if (!hasChatTrigger) {
      console.log('  Trigger bi disable => Push se khong bao gio fire.');
      console.log('  => Chay: supabase db push de apply migration moi nhat.');
    } else if (!hasOutbox) {
      console.log('  Trigger fire nhung outbox trong.');
      console.log(
        '  => Kiem tra fn_enqueue_notification_outbox va fn_resolve_chat_notification_recipients.',
      );
    } else if (hasFailed && !hasDelivered) {
      console.log('  Push bi loi khi gui den APNs/FCM.');
      console.log(
        '  => Xem error_message trong outbox o STEP 2 de biet loi cu the.',
      );
      console.log(
        '  => Kiem tra VAPID_PRIVATE_KEY trong Supabase Edge Function secrets.',
      );
    } else if (hasDelivered) {
      console.log('  Server da delivered push thanh cong!');
      console.log('  Neu iPhone VAN khong thay thong bao, kiem tra:');
      console.log(
        '  1. iPhone Settings > Notifications > [Ten PWA] > Allow Notifications = ON',
      );
      console.log('  2. Focus Mode / Do Not Disturb = OFF');
      console.log(
        '  3. Xoa PWA khoi Home Screen > Add lai > Mo app > Bat thong bao',
      );
    }
    console.log('\n========================================\n');
  } catch (err) {
    console.error('Loi khi truy van:', err);
  } finally {
    await sql.end();
  }
}

diagnosePush();
