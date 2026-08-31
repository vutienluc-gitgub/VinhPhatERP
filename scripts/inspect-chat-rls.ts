import 'dotenv/config';
import postgres from 'postgres';

async function inspectChatRLS() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) process.exit(1);

  const sql = postgres(dbUrl, { max: 1, connect_timeout: 5, ssl: 'require' });

  try {
    const policies = await sql`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
      FROM pg_policies
      WHERE tablename IN ('chat_messages', 'chat_rooms', 'chat_room_participants');
    `;
    console.log('Current RLS Policies on Chat Tables:');
    for (const p of policies) {
      console.log(
        `\nTable: ${p.tablename} | Policy: ${p.policyname} | Cmd: ${p.cmd}`,
      );
      console.log(`  Qual: ${p.qual}`);
      console.log(`  Check: ${p.with_check}`);
    }
  } catch (err) {
    console.error('Inspection error:', err);
  } finally {
    await sql.end();
  }
}

inspectChatRLS();
