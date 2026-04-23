import 'dotenv/config';
import postgres from 'postgres';

async function test(url: string) {
  console.log('Testing:', url);
  try {
    const sql = postgres(url, { max: 1, connect_timeout: 5, ssl: 'require' });
    const [{ now }] = await sql`SELECT now()`;
    console.log('✅ Success!', now);
    await sql.end();
  } catch (err: unknown) {
    console.log('❌ Failed:', err instanceof Error ? err.message : err);
  }
}

async function run() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log('❌ DATABASE_URL not set in .env');
    return;
  }
  await test(dbUrl);
}

run();
