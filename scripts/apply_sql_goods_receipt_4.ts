import fs from 'fs';

import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const sql = postgres(process.env.DATABASE_URL!);
  const query = fs.readFileSync(
    'supabase/migrations/20260801111500_update_rpc_yarn_receipt_link.sql',
    'utf8',
  );
  await sql.unsafe(query);
  console.log('Migration V4 applied successfully!');
  await sql.end();
}

main();
