/* eslint-disable no-restricted-syntax */
import 'dotenv/config';
import postgres from 'postgres';

async function cleanupOverprivileged() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL is not set.');
    process.exit(1);
  }

  const sql = postgres(dbUrl, { max: 2, connect_timeout: 10, ssl: 'require' });

  console.log('\n🧹 ========================================================');
  console.log('   PHASE 6: CLEANUP LEGACY OVERPRIVILEGED PARTICIPANTS');
  console.log('========================================================\n');

  try {
    const participants = await sql`
      SELECT p.room_id, p.user_id, p.role, pr.full_name, pr.role AS user_role, r.entity_type, r.entity_id
      FROM public.chat_room_participants p
      JOIN public.profiles pr ON p.user_id = pr.id
      JOIN public.chat_rooms r ON p.room_id = r.id;
    `;

    console.log(
      `Auditing ${participants.length} total participant assignments...`,
    );
    let removedCount = 0;

    for (const p of participants) {
      // Check if user has legitimate access under new Method C Policy
      const [{ allowed }] = await sql`
        SELECT public.fn_can_access_chat_room(${p.room_id}, ${p.user_id}) AS allowed;
      `;

      if (!allowed) {
        console.log(
          `Removing overprivileged user ${p.full_name} (${p.user_role}) from room ${p.room_id} (${p.entity_type} ${p.entity_id})`,
        );
        await sql`
          DELETE FROM public.chat_room_participants
          WHERE room_id = ${p.room_id} AND user_id = ${p.user_id};
        `;
        removedCount++;
      }
    }

    console.log(
      `\n✓ Phase 6 Cleanup Complete: Removed ${removedCount} overprivileged participant rows.`,
    );

    // Re-verify totals
    const [totalParticipants] =
      await sql`SELECT COUNT(*) AS count FROM public.chat_room_participants`;
    console.log(
      `Current Clean Room Participants Count: ${totalParticipants.count}`,
    );
  } catch (err) {
    console.error('Cleanup error:', err);
  } finally {
    await sql.end();
  }
}

cleanupOverprivileged();
