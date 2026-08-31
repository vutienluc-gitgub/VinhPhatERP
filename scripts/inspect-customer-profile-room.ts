import 'dotenv/config';
import postgres from 'postgres';

async function run() {
  const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });
  const p =
    await sql`SELECT id, full_name, role, customer_id, supplier_id FROM profiles WHERE id = '6c8cc401-487d-4468-8aa7-fe2997093767'`;
  console.log('Customer Profile:', p[0]);

  const custId = p[0]?.customer_id;
  console.log('Profile customer_id:', custId);

  const rooms =
    await sql`SELECT * FROM chat_rooms WHERE entity_id = ${custId || ''}`;
  console.log('Rooms matching entity_id = profile.customer_id:', rooms);

  const allCustomerRooms =
    await sql`SELECT * FROM chat_rooms WHERE entity_type = 'customer'`;
  console.log('All customer rooms in DB:', allCustomerRooms);

  const participants = await sql`
    SELECT crp.room_id, crp.user_id, crp.role, p.full_name 
    FROM chat_room_participants crp 
    LEFT JOIN profiles p ON crp.user_id = p.id 
    WHERE crp.room_id = 'dd46feb3-3afa-45cc-a4f6-7420c583a90b'
  `;
  console.log(
    'Participants for room dd46feb3-3afa-45cc-a4f6-7420c583a90b:',
    participants,
  );

  await sql.end();
}

run();
