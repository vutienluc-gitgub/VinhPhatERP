import 'dotenv/config';
import postgres from 'postgres';

async function applyFix() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL is not set.');
    process.exit(1);
  }

  const sql = postgres(dbUrl, { max: 2, connect_timeout: 10, ssl: 'require' });

  try {
    console.log(
      'Backfilling historical message senders into chat_room_participants...',
    );
    const result = await sql`
      INSERT INTO public.chat_room_participants (room_id, user_id, role)
      SELECT DISTINCT m.room_id, m.sender_id, 'member'
      FROM public.chat_messages m
      JOIN auth.users u ON m.sender_id = u.id
      WHERE m.sender_id IS NOT NULL
      ON CONFLICT (room_id, user_id) DO NOTHING
      RETURNING *;
    `;
    console.log(
      `Successfully backfilled ${result.length} missing participant records.`,
    );
  } catch (err) {
    console.error('Fix error:', err);
  } finally {
    await sql.end();
  }
}

applyFix();
