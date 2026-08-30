import 'dotenv/config';
import postgres from 'postgres';

async function checkSchema() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) process.exit(1);
  const sql = postgres(dbUrl, { max: 1, connect_timeout: 5, ssl: 'require' });

  try {
    const customerCols = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'customers' AND table_schema = 'public';
    `;
    console.log('--- CUSTOMERS COLUMNS ---');
    console.table(customerCols);

    const chatRoomsCols = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'chat_rooms' AND table_schema = 'public';
    `;
    console.log('--- CHAT_ROOMS COLUMNS ---');
    console.table(chatRoomsCols);

    const chatPartCols = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'chat_room_participants' AND table_schema = 'public';
    `;
    console.log('--- CHAT_ROOM_PARTICIPANTS COLUMNS ---');
    console.table(chatPartCols);
  } finally {
    await sql.end();
  }
}

checkSchema();
