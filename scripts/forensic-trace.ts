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
  const targetSubscriptionId = '3ce1a5f9-ea81-4968-a916-53a54c0073e3';

  console.log('====================================================');
  console.log('         FORENSIC TRACE DIAGNOSTIC EXECUTION        ');
  console.log('====================================================\n');

  // STEP 1: CHAT MESSAGE
  console.log('--- STEP 1: CHAT MESSAGE TRACE ---');
  const chatMessages = await sql`
    SELECT 
      m.id as message_id,
      m.room_id,
      m.sender_id,
      m.content,
      m.created_at,
      p.full_name as sender_name,
      p.role::text as sender_role,
      r.entity_type,
      r.entity_id
    FROM public.chat_messages m
    JOIN public.profiles p ON m.sender_id = p.id
    JOIN public.chat_rooms r ON m.room_id = r.id
    WHERE r.entity_type = 'customer'
      AND p.role::text <> 'customer'
    ORDER BY m.created_at DESC
    LIMIT 1
  `;
  console.log(
    'Chat Message:',
    JSON.stringify(chatMessages[0] || null, null, 2),
  );

  if (!chatMessages[0]) {
    console.log('No chat message found.');
    await sql.end();
    return;
  }

  const msg = chatMessages[0];

  // Room Participants
  const participants = await sql`
    SELECT crp.user_id, p.full_name, p.role::text
    FROM public.chat_room_participants crp
    JOIN public.profiles p ON crp.user_id = p.id
    WHERE crp.room_id = ${msg.room_id}
  `;
  console.log('Room Participants:', JSON.stringify(participants, null, 2));

  // STEP 2: NOTIFICATION OUTBOX
  console.log('\n--- STEP 2: NOTIFICATION OUTBOX TRACE ---');
  const outboxRows = await sql`
    SELECT 
      id,
      event_type,
      status,
      attempts,
      max_attempts,
      locked_at,
      processed_at,
      last_error,
      created_at,
      payload
    FROM public.notification_outbox
    WHERE payload->>'message_id' = ${msg.message_id}
       OR payload->>'room_id' = ${msg.room_id}
    ORDER BY created_at DESC
    LIMIT 1
  `;
  console.log('Outbox Item:', JSON.stringify(outboxRows[0] || null, null, 2));

  // STEP 3: PG_NET HTTP RESPONSES
  console.log('\n--- STEP 3: PG_NET HTTP RESPONSE TRACE ---');
  try {
    const pgNetResponses = await sql`
      SELECT *
      FROM net._http_response
      ORDER BY created DESC
      LIMIT 5
    `;
    console.log('pg_net Responses:', JSON.stringify(pgNetResponses, null, 2));
  } catch (err: unknown) {
    const error = err as Error;
    console.log(
      'pg_net response query error or table inaccessible:',
      error.message,
    );
  }

  // STEP 4 & 5 & 6: DELIVERY LOGS & SUBSCRIPTION
  console.log('\n--- STEP 4-6: SUBSCRIPTION & DELIVERY LOGS ---');
  const targetSub = await sql`
    SELECT *
    FROM public.push_subscriptions
    WHERE id = ${targetSubscriptionId}
  `;
  console.log(
    'Target Subscription:',
    JSON.stringify(targetSub[0] || null, null, 2),
  );

  const allCustomerSubs = await sql`
    SELECT id, user_id, device_id, platform, browser, revoked_at, last_seen_at, created_at
    FROM public.push_subscriptions
    WHERE user_id = ${customerUserId}
  `;
  console.log(
    'All Customer Subscriptions:',
    JSON.stringify(allCustomerSubs, null, 2),
  );

  // STEP 6: DELIVERY LOGS
  console.log('\n--- STEP 6: DELIVERY LOGS ---');
  const allDeliveryLogs = await sql`
    SELECT *
    FROM public.notification_delivery_logs
    ORDER BY created_at DESC
    LIMIT 10
  `;
  console.log(
    'Latest Delivery Logs:',
    JSON.stringify(allDeliveryLogs, null, 2),
  );

  await sql.end();
}

main().catch(console.error);
