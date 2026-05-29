import postgres from 'postgres';
import 'dotenv/config';

async function run() {
  const sql = postgres(process.env.DATABASE_URL);
  try {
    const looms = await sql`SELECT id, code, tenant_id FROM public.looms`;
    console.log('Looms count:', looms.length);
    if (looms.length > 0) {
      const states = await sql`SELECT * FROM public.loom_production_states`;
      console.log('States count:', states.length);
      console.log('States:', states);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sql.end();
  }
}
run();
