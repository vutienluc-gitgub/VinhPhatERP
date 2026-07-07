import { Client } from 'pg';

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres.sxphijrofljxkccdwtub:jhVVQpMHZXAtOXba@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres'
  });
  
  await client.connect();
  const res = await client.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name='crm_leads' AND column_name='customer_id';
  `);
  console.log('Exists:', res.rows.length > 0);
  await client.end();
}

run().catch(console.error);
