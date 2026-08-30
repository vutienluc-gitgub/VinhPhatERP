/* eslint-disable no-restricted-syntax */
import 'dotenv/config';
import postgres from 'postgres';

async function runScopedAudit() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL is not set.');
    process.exit(1);
  }

  const sql = postgres(dbUrl, { max: 2, connect_timeout: 10, ssl: 'require' });

  console.log('\n🔒 ========================================================');
  console.log('   ENTERPRISE SCOPED CHAT AUTHORIZATION & AUDIT');
  console.log('========================================================\n');

  try {
    // 1. Run Scoped Sync for All Rooms (Phase 2 Backfill)
    console.log(
      'Step 1: Running Scoped Participants Sync on all active chat rooms...',
    );
    const rooms =
      await sql`SELECT id, entity_type, entity_id, tenant_id FROM public.chat_rooms`;
    for (const r of rooms) {
      await sql`SELECT public.fn_sync_room_participants(${r.id});`;
    }
    console.log(
      `✓ Synchronized scoped participants across ${rooms.length} rooms.\n`,
    );

    // 2. Test fn_can_access_chat_room on key test cases (Phase 3 Audit)
    console.log(
      'Step 2: Testing Authorization Invariants with fn_can_access_chat_room...\n',
    );

    // Case 1: Customer Thắm (6c8cc401) accesses own customer room
    const [custRoom] = await sql`
      SELECT id FROM public.chat_rooms 
      WHERE entity_type = 'customer' AND entity_id = '3e2a8140-4004-4019-a1c0-05c7632e0987'
    `;
    if (custRoom) {
      const [{ allowed: custAllowed }] = await sql`
        SELECT public.fn_can_access_chat_room(${custRoom.id}, '6c8cc401-487d-4468-8aa7-fe2997093767') AS allowed;
      `;
      console.log(
        `• Customer Thắm -> Own Customer Room (${custRoom.id}): ${custAllowed ? '✅ ALLOW (PASSED)' : '❌ DENIED'}`,
      );
    }

    // Case 2: Customer Thắm (6c8cc401) attempts to access OTHER customer room
    const otherCustRooms = await sql`
      SELECT id FROM public.chat_rooms 
      WHERE entity_type = 'customer' AND entity_id <> '3e2a8140-4004-4019-a1c0-05c7632e0987'
    `;
    if (otherCustRooms.length > 0) {
      const [{ allowed: otherAllowed }] = await sql`
        SELECT public.fn_can_access_chat_room(${otherCustRooms[0].id}, '6c8cc401-487d-4468-8aa7-fe2997093767') AS allowed;
      `;
      console.log(
        `• Customer Thắm -> Foreign Customer Room (${otherCustRooms[0].id}): ${!otherAllowed ? '✅ DENIED (SECURE)' : '❌ ALLOWED (LEAK)'}`,
      );
    }

    // Case 3: Admin access to any room
    const [{ id: adminId }] =
      await sql`SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1`;
    if (adminId && rooms.length > 0) {
      const [{ allowed: adminAllowed }] = await sql`
        SELECT public.fn_can_access_chat_room(${rooms[0].id}, ${adminId}) AS allowed;
      `;
      console.log(
        `• Admin (${adminId}) -> Any Room (${rooms[0].id}): ${adminAllowed ? '✅ ALLOW (PASSED)' : '❌ DENIED'}`,
      );
    }

    // Case 4: Test Notification Recipients on latest message
    const [latestMsg] = await sql`
      SELECT id, room_id, sender_id, content FROM public.chat_messages ORDER BY created_at DESC LIMIT 1
    `;
    if (latestMsg) {
      const [{ recipients }] = await sql`
        SELECT public.fn_resolve_chat_notification_recipients(${latestMsg.id}) AS recipients;
      `;
      console.log(
        `\nStep 3: Notification Resolver Test on message ${latestMsg.id}:`,
      );
      console.log(`   Recipients resolved: ${JSON.stringify(recipients)}`);
    }

    console.log('\n========================================================');
    console.log('✅ AUDIT & BACKFILL COMPLETED SUCCESSFULLY');
    console.log('========================================================\n');
  } catch (err) {
    console.error('Audit execution error:', err);
  } finally {
    await sql.end();
  }
}

runScopedAudit();
