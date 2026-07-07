import { Client } from 'pg';
import fs from 'fs';

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres.sxphijrofljxkccdwtub:jhVVQpMHZXAtOXba@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres'
  });
  
  await client.connect();
  const sql = fs.readFileSync('supabase/migrations/20260707000001_crm_leads_customer_link.sql', 'utf8');
  console.log('Running SQL...');
  await client.query(sql);
  console.log('Done.');
  await client.end();
}

run().catch(console.error);
