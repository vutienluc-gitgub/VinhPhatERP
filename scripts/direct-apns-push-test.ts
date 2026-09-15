import 'dotenv/config';
import { createRequire } from 'module';

import postgres from 'postgres';

const require = createRequire(import.meta.url);
const webpush = require('../server/node_modules/web-push');

async function main() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is missing');
    process.exit(1);
  }

  const sql = postgres(connectionString, { max: 1, ssl: 'require' });
  const subscriptionId = 'd148b1cd-eae0-40f3-a37b-5a058056550a';

  console.log('=== DIRECT APNs WEBPUSH DISPATCH TEST ===\n');
  console.log(`Target Subscription ID: ${subscriptionId}`);

  const allSubs = await sql`
    SELECT id, user_id, device_id, platform, browser, endpoint, p256dh, auth, revoked_at, created_at, last_seen_at
    FROM public.push_subscriptions
    ORDER BY created_at DESC
    LIMIT 10
  `;

  console.log(
    'All Push Subscriptions in DB:',
    JSON.stringify(allSubs, null, 2),
  );

  if (allSubs.length === 0) {
    console.log('NO SUBSCRIPTIONS IN DATABASE AT ALL!');
    await sql.end();
    return;
  }

  const sub =
    allSubs.find(
      (s) =>
        s.user_id === '6c8cc401-487d-4468-8aa7-fe2997093767' ||
        s.id === subscriptionId,
    ) || allSubs[0];

  console.log('Subscription Data:', JSON.stringify(sub, null, 2));

  // Configure VAPID
  const vapidPublicKey =
    'BElJS1biXMms_8auV6_QTwt4Dy0mI36FdcwAk7sR2Cw5h2PJ9Qv-lmeeMDRraW_VVpVCLH3DaMIAapuljw0QQTY';
  const vapidPrivateKey = 'k01WluY5vU4w2XbIQuLZAGPAcXSO2d3sJYPE-yc6TiM';
  const vapidSubject = 'mailto:admin@detmayvinhphat.com';

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  // Prepare push subscription object
  const pushSubscription = {
    endpoint: sub.endpoint,
    keys: {
      p256dh: sub.p256dh,
      auth: sub.auth,
    },
  };

  const pushMessage = JSON.stringify({
    title: 'Vinh Phat Diagnostic Probe',
    body: 'Kiem tra tin nhan truc tiep APNs Lock Screen Push',
    action: 'chat',
    roomId: 'dd46feb3-3afa-45cc-a4f6-7420c583a90b',
    senderName: 'System Diagnostic Probe',
    messageId: `probe-${Date.now()}`,
    notification_id: `probe-${Date.now()}`,
    unreadCount: 1,
  });

  const isAppleEndpoint =
    typeof sub.endpoint === 'string' && sub.endpoint.includes('push.apple.com');
  const pushOptions: {
    TTL: number;
    urgency: string;
    headers?: Record<string, string>;
  } = {
    TTL: 86400,
    urgency: 'high',
  };

  if (isAppleEndpoint) {
    pushOptions.headers = {
      'apns-push-type': 'alert',
      'apns-priority': '10',
      'apns-expiration': String(Math.floor(Date.now() / 1000) + 86400),
    };
  }

  console.log('\nDispatching webpush.sendNotification()...');
  console.log('Push Endpoint:', sub.endpoint);
  console.log('Push Options:', pushOptions);

  const startTimeMs = Date.now();
  try {
    const response = await webpush.sendNotification(
      pushSubscription,
      pushMessage,
      pushOptions,
    );
    const latencyMs = Date.now() - startTimeMs;

    console.log(
      '\n[PASS] [P1 PROVIDER ACCEPTED] webpush.sendNotification SUCCESS!',
    );
    console.log('Status Code:', response.statusCode);
    console.log('Headers:', response.headers);
    console.log('Body:', response.body);
    console.log(`Latency: ${latencyMs}ms`);
  } catch (err: unknown) {
    const error = err as {
      statusCode?: number;
      name?: string;
      message?: string;
      headers?: Record<string, string>;
      body?: string;
    };
    const latencyMs = Date.now() - startTimeMs;
    console.log(
      '\n[FAIL] [P2 PROVIDER REJECTED / ERROR] webpush.sendNotification FAILED!',
    );
    console.log('Status Code:', error.statusCode || 'N/A');
    console.log('Error Name:', error.name || 'Error');
    console.log('Error Message:', error.message);
    console.log('Headers:', error.headers || null);
    console.log('Body:', error.body || null);
    console.log(`Latency: ${latencyMs}ms`);
  } finally {
    await sql.end();
  }
}

main().catch(console.error);
