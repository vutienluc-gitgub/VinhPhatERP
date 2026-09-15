import 'dotenv/config';
import postgres from 'postgres';

async function main() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error('ERROR: DATABASE_URL is missing in environment');
    process.exit(1);
  }

  const sql = postgres(connectionString, { max: 1, ssl: 'require' });

  console.log('=== LATEST NOTIFICATION OUTBOX & DELIVERY EVIDENCE ===\n');

  try {
    console.log('--- UNLOCKING STALE TEST OUTBOX ITEMS ---');
    await sql`
      UPDATE public.notification_outbox
      SET locked_at = NULL, status = 'pending'
      WHERE status = 'processing' AND (locked_at IS NULL OR locked_at < NOW() - INTERVAL '15 seconds');
    `;

    console.log('--- CALLING fn_process_notification_outbox() ---');
    const processResult = await sql`SELECT fn_process_notification_outbox();`;
    console.log('Process Result:', processResult);

    const outboxRows = await sql`
      SELECT id, event_type, status, attempts, next_retry_at, locked_at, processed_at, last_error, created_at
      FROM public.notification_outbox
      ORDER BY created_at DESC
      LIMIT 5;
    `;
    console.log(
      '\nOutbox Rows after processing:',
      JSON.stringify(outboxRows, null, 2),
    );

    const deliveryLogs = await sql`
      SELECT *
      FROM public.notification_delivery_logs
      ORDER BY created_at DESC
      LIMIT 5;
    `;
    console.log('\nDelivery Logs:', JSON.stringify(deliveryLogs, null, 2));

    const subs = await sql`
      SELECT 
        id,
        user_id,
        device_id,
        platform,
        browser,
        revoked_at,
        last_seen_at,
        created_at
      FROM public.push_subscriptions
      ORDER BY created_at DESC
      LIMIT 5;
    `;
    console.log('\nSubscriptions:', JSON.stringify(subs, null, 2));
  } catch (err) {
    console.error('Query error:', err);
  } finally {
    await sql.end();
  }
}

main();
