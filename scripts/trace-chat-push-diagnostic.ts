import 'dotenv/config';
import postgres from 'postgres';

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing');
  }

  const sql = postgres(process.env.DATABASE_URL, { max: 1, ssl: 'require' });

  console.log('=== 1. LATEST CHAT MESSAGE (CUSTOMER ROOM) ===');
  const messages = await sql`
    SELECT
      m.id as message_id,
      m.room_id,
      m.sender_id,
      m.content,
      m.message_type,
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

  const msg = messages[0];
  console.log('Message:', JSON.stringify(msg, null, 2));

  console.log('\n=== 2. ROOM PARTICIPANTS & CUSTOMER PROFILES ===');
  const participants = await sql`
    SELECT
      crp.user_id,
      crp.unread_count,
      p.full_name,
      p.role::text as role,
      p.customer_id,
      p.tenant_id
    FROM public.chat_room_participants crp
    JOIN public.profiles p ON crp.user_id = p.id
    WHERE crp.room_id = ${msg.room_id}
  `;
  console.log('Participants:', JSON.stringify(participants, null, 2));

  const customerProfiles = await sql`
    SELECT id, full_name, role::text as role, customer_id, tenant_id
    FROM public.profiles
    WHERE customer_id::text = ${msg.entity_id} OR role::text = 'customer'
  `;
  console.log(
    'Profiles matching customer:',
    JSON.stringify(customerProfiles, null, 2),
  );

  console.log(
    '\n=== 3. ALL PUSH SUBSCRIPTIONS FOR ROOM PARTICIPANTS & CUSTOMER PROFILES ===',
  );
  const allUserIds = Array.from(
    new Set([
      ...participants.map((p) => p.user_id),
      ...customerProfiles.map((p) => p.id),
    ]),
  );

  const subs = await sql`
    SELECT
      id,
      tenant_id,
      user_id,
      device_id,
      platform,
      browser,
      endpoint,
      revoked_at,
      last_seen_at,
      created_at
    FROM public.push_subscriptions
    WHERE user_id = ANY(${allUserIds})
  `;
  console.log('Push Subscriptions found:', JSON.stringify(subs, null, 2));

  console.log(
    '\n=== 4. TOTAL ACTIVE PUSH SUBSCRIPTIONS IN ENTIRE DATABASE ===',
  );
  const totalActiveSubs = await sql`
    SELECT id, user_id, device_id, platform, browser, revoked_at, created_at, last_seen_at
    FROM public.push_subscriptions
    ORDER BY created_at DESC
    LIMIT 10
  `;
  console.log(
    'Latest Push Subscriptions in DB:',
    JSON.stringify(totalActiveSubs, null, 2),
  );

  await sql.end();
}

main().catch(console.error);
