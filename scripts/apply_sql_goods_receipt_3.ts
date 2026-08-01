import fs from 'fs';

import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const sql = postgres(process.env.DATABASE_URL!);
  const query = fs.readFileSync(
    'supabase/migrations/20260801110000_link_gr_and_yarn_receipt.sql',
    'utf8',
  );
  await sql.unsafe(query);
  console.log('Migration V3 applied successfully!');
  await sql.end();
}

main();
