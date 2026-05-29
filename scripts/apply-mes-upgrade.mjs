import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const sql = postgres(process.env.DATABASE_URL);

  try {
    console.log('Running 20260529000006...');
    const content6 = fs.readFileSync(path.join(__dirname, '../supabase/migrations/20260529000006_update_rpc_wo_start_complete_for_looms.sql'), 'utf8');
    await sql.unsafe(content6);

    await sql`
      INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
      VALUES ('20260529000006', 'update_rpc_wo_start_complete_for_looms', '{}')
      ON CONFLICT (version) DO NOTHING;
    `;

    console.log('Success!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sql.end();
  }
}

run();
