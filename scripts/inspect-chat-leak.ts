import 'dotenv/config';
import postgres from 'postgres';

async function inspect() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL is not set.');
    process.exit(1);
  }

  const sql = postgres(dbUrl, { max: 2, connect_timeout: 10, ssl: 'require' });

  try {
    console.log('--- PROFILES ---');
    const profiles = await sql`
      SELECT id, full_name, role, customer_id, supplier_id, tenant_id
      FROM public.profiles
      WHERE id IN (
        '85e9d0a4-c3ed-46ab-8751-c5a7278e971b',
        '6c8cc401-487d-4468-8aa7-fe2997093767'
      );
    `;
    console.table(profiles);

    console.log('--- ROOM PARTICIPANTS for 85e9d0a4 ---');
    const participants1 = await sql`
      SELECT p.room_id, p.user_id, p.role, r.entity_type, r.entity_id
      FROM public.chat_room_participants p
      JOIN public.chat_rooms r ON p.room_id = r.id
      WHERE p.user_id = '85e9d0a4-c3ed-46ab-8751-c5a7278e971b';
    `;
    console.table(participants1);

    console.log('--- ROOM PARTICIPANTS for 6c8cc401 ---');
    const participants2 = await sql`
      SELECT p.room_id, p.user_id, p.role, r.entity_type, r.entity_id
      FROM public.chat_room_participants p
      JOIN public.chat_rooms r ON p.room_id = r.id
      WHERE p.user_id = '6c8cc401-487d-4468-8aa7-fe2997093767';
    `;
    console.table(participants2);
  } catch (err) {
    console.error('Inspect error:', err);
  } finally {
    await sql.end();
  }
}

inspect();
