import 'dotenv/config';
import postgres from 'postgres';

async function main() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is missing');
    process.exit(1);
  }

  const sql = postgres(connectionString, { max: 1, ssl: 'require' });

  const customerUserId = '6c8cc401-487d-4468-8aa7-fe2997093767';

  console.log('=== STEP 4: VERIFY ACTIVE SUBSCRIPTIONS FOR CUSTOMER ===\n');

  const subs = await sql`
    SELECT
      id,
      tenant_id,
      user_id,
      device_id,
      platform,
      browser,
      endpoint,
      p256dh,
      auth,
      revoked_at,
      created_at,
      last_seen_at
    FROM public.push_subscriptions
    WHERE user_id = ${customerUserId}
    ORDER BY last_seen_at DESC
  `;

  console.log('Customer Subscriptions:', JSON.stringify(subs, null, 2));

  // STEP 5: SIMULATE RESOLVE LOGIC (identical to send-web-push Edge Function)
  console.log('\n=== STEP 5: SIMULATE EDGE FUNCTION RESOLUTION ===\n');

  const activeSubs = subs.filter((s) => s.revoked_at === null);
  console.log(
    'Active (revoked_at IS NULL) Subscriptions Count:',
    activeSubs.length,
  );
  console.log(
    'Active Subscriptions Resolved:',
    JSON.stringify(
      activeSubs.map((s) => ({
        id: s.id,
        platform: s.platform,
        browser: s.browser,
        hasEndpoint: !!s.endpoint,
        hasP256dh: !!s.p256dh,
        hasAuth: !!s.auth,
        last_seen_at: s.last_seen_at,
      })),
      null,
      2,
    ),
  );

  await sql.end();
}

main().catch(console.error);
