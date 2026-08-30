import 'dotenv/config';
import postgres from 'postgres';

async function runAudit() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL is not set in environment.');
    process.exit(1);
  }

  const sql = postgres(dbUrl, { max: 2, connect_timeout: 10, ssl: 'require' });

  console.log(
    '\n[SCAN] ========================================================',
  );
  console.log('   PRODUCTION CHAT ARCHITECTURE & PARTICIPANTS AUDIT');
  console.log('========================================================\n');

  try {
    // 1. Rooms with zero participants
    const zeroParticipantRooms = await sql`
      SELECT r.id, r.entity_type, r.entity_id, r.created_at
      FROM public.chat_rooms r
      WHERE NOT EXISTS (
        SELECT 1 FROM public.chat_room_participants p
        WHERE p.room_id = r.id
      );
    `;
    console.log(
      `1. Rooms with ZERO participants: ${zeroParticipantRooms.length}`,
    );
    if (zeroParticipantRooms.length > 0) {
      console.table(zeroParticipantRooms);
    }

    // 2. Rooms with invalid participants (user_id not in auth.users)
    const invalidParticipants = await sql`
      SELECT p.room_id, p.user_id, p.role
      FROM public.chat_room_participants p
      LEFT JOIN auth.users u ON p.user_id = u.id
      WHERE u.id IS NULL;
    `;
    console.log(
      `2. Participants with INVALID/Dangling user_id: ${invalidParticipants.length}`,
    );
    if (invalidParticipants.length > 0) {
      console.table(invalidParticipants);
    }

    // 3. Messages whose sender is not a participant (Orphan Sender Invariant)
    const orphanSenderMessages = await sql`
      SELECT m.id AS message_id, m.room_id, m.sender_id, m.content, m.created_at
      FROM public.chat_messages m
      WHERE m.sender_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM public.chat_room_participants p
          WHERE p.room_id = m.room_id AND p.user_id = m.sender_id
        );
    `;
    console.log(
      `3. Messages whose sender is NOT in chat_room_participants (Orphan Sender): ${orphanSenderMessages.length}`,
    );
    if (orphanSenderMessages.length > 0) {
      console.table(orphanSenderMessages);
    }

    // 4. Customer rooms where customer profile user is missing
    const customerRoomsMissingParticipant = await sql`
      SELECT r.id AS room_id, r.entity_id AS customer_id, pr.id AS customer_user_id, pr.full_name
      FROM public.chat_rooms r
      JOIN public.profiles pr ON pr.customer_id = r.entity_id::uuid
      JOIN auth.users u ON pr.id = u.id
      WHERE r.entity_type = 'customer'
        AND NOT EXISTS (
          SELECT 1 FROM public.chat_room_participants p
          WHERE p.room_id = r.id AND p.user_id = pr.id
        );
    `;
    console.log(
      `4. Customer rooms whose customer auth profile is MISSING from participants: ${customerRoomsMissingParticipant.length}`,
    );
    if (customerRoomsMissingParticipant.length > 0) {
      console.table(customerRoomsMissingParticipant);
    }

    // 5. Supplier rooms where supplier profile user is missing
    const supplierRoomsMissingParticipant = await sql`
      SELECT r.id AS room_id, r.entity_id AS supplier_id, pr.id AS supplier_user_id, pr.full_name
      FROM public.chat_rooms r
      JOIN public.profiles pr ON pr.supplier_id = r.entity_id::uuid
      JOIN auth.users u ON pr.id = u.id
      WHERE r.entity_type = 'supplier'
        AND NOT EXISTS (
          SELECT 1 FROM public.chat_room_participants p
          WHERE p.room_id = r.id AND p.user_id = pr.id
        );
    `;
    console.log(
      `5. Supplier rooms whose supplier auth profile is MISSING from participants: ${supplierRoomsMissingParticipant.length}`,
    );
    if (supplierRoomsMissingParticipant.length > 0) {
      console.table(supplierRoomsMissingParticipant);
    }

    // 6. Duplicate (room_id, user_id) pairs
    const duplicateParticipants = await sql`
      SELECT room_id, user_id, COUNT(*) AS count
      FROM public.chat_room_participants
      GROUP BY room_id, user_id
      HAVING COUNT(*) > 1;
    `;
    console.log(
      `6. Duplicate (room_id, user_id) pairs: ${duplicateParticipants.length}`,
    );
    if (duplicateParticipants.length > 0) {
      console.table(duplicateParticipants);
    }

    // 7. Overall Summary Statistics
    const [totalRooms] =
      await sql`SELECT COUNT(*) AS count FROM public.chat_rooms`;
    const [totalParticipants] =
      await sql`SELECT COUNT(*) AS count FROM public.chat_room_participants`;
    const [totalMessages] =
      await sql`SELECT COUNT(*) AS count FROM public.chat_messages`;

    console.log('\n[STATS] Production Chat Database Totals:');
    console.log(`   • Total Chat Rooms: ${totalRooms.count}`);
    console.log(`   • Total Room Participants: ${totalParticipants.count}`);
    console.log(`   • Total Chat Messages: ${totalMessages.count}`);

    const is100PercentClean =
      zeroParticipantRooms.length === 0 &&
      invalidParticipants.length === 0 &&
      orphanSenderMessages.length === 0 &&
      customerRoomsMissingParticipant.length === 0 &&
      supplierRoomsMissingParticipant.length === 0 &&
      duplicateParticipants.length === 0;

    console.log('\n========================================================');
    if (is100PercentClean) {
      console.log(
        '[PASS] AUDIT PASSED: 100% CLEAN - NO INVARIANT VIOLATIONS FOUND',
      );
    } else {
      console.log(
        '[WARN] AUDIT WARNING: INVARIANTS VIOLATED - AUTO-REPAIR NEEDED',
      );
    }
    console.log('========================================================\n');
  } catch (err) {
    console.error('Audit execution error:', err);
  } finally {
    await sql.end();
  }
}

runAudit();
